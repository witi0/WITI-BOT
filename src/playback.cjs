'use strict';
const crypto=require('node:crypto');
const {priorityFor}=require('./live-hub.cjs');
class PlaybackQueue{
 constructor(store,{player=()=>null,change=()=>{}}={}){
  this.store=store;this.player=player;this.change=change;this.active=new Map();this.paused=!!store.get('playbackPaused');
  store.db.run("CREATE TABLE IF NOT EXISTS playback_jobs(id TEXT PRIMARY KEY,overlay TEXT NOT NULL,preview INTEGER NOT NULL,body TEXT NOT NULL,total INTEGER NOT NULL,done INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL DEFAULT 'pending',audio INTEGER NOT NULL DEFAULT 0);CREATE TABLE IF NOT EXISTS playback_receipts(id TEXT PRIMARY KEY);CREATE INDEX IF NOT EXISTS playback_pending ON playback_jobs(state,overlay,preview)");
  const cols=store.all('PRAGMA table_info(playback_jobs)').map(x=>x.name);
  if(!cols.includes('priority'))store.db.run('ALTER TABLE playback_jobs ADD COLUMN priority INTEGER NOT NULL DEFAULT 3');
  this.cooldowns=new Map();this.busyAudio=null;
 }
 key(overlay,preview){return overlay+':'+Number(preview);}
 enqueue({id=crypto.randomUUID(),overlay,preview=false,payload,repeats=1,priority,cooldownMs=0}){
  if(!Number.isSafeInteger(repeats)||repeats<1||repeats>100000)throw Error('Cantidad de reproducciones inválida');
  if(!['__tts__','__sound__'].includes(overlay)&&!this.store.list('overlays').some(o=>o.id===overlay)&&!this.store.list('rules').some(r=>r.id===overlay&&r.trigger==='gift'))throw Error('Pantalla no encontrada');
  const level=[1,2,3].includes(Number(priority))?Number(priority):priorityFor(payload?.event||{});
  const media=String(payload?.media||payload?.sound||'');const audio=overlay==='__tts__'||/\.(mp3|wav|ogg|mp4|webm)$/i.test(media)?1:0;
  const cd=Math.max(0,Math.min(60000,Number(cooldownMs)||0));const key=overlay+':'+media+':'+(payload?.name||'');
  if(cd>0&&Date.now()-(this.cooldowns.get(key)||0)<cd)return null;
  if(cd>0)this.cooldowns.set(key,Date.now());
  this.store.db.run('INSERT OR IGNORE INTO playback_jobs(id,overlay,preview,body,total,audio,priority) VALUES(?,?,?,?,?,?,?)',[id,overlay,Number(preview),JSON.stringify(payload),repeats,audio,level]);this.store.flush();
  if(level===1&&!preview&&this.store.get('audioSettings')?.interruptCritical!==false&&this.player(overlay,false))this.preemptLowerPriority();
  this.wake();this.changed();return id;
 }
 preemptLowerPriority(){
  for(const [key,a]of [...this.active]){
   if(a.priority===1||a.preview)continue;
   this.active.delete(key);if(this.busyAudio===a.delivery)this.busyAudio=null;
   // Do not ACK interrupted audio. It stays pending with its prior completed count.
   try{a.output.send({type:'interrupt-action',delivery:a.delivery,reason:'critical-priority'});}catch{}
  }
 }
 wake(){
  if(this.paused)return;
  const jobs=this.store.all("SELECT rowid,* FROM playback_jobs WHERE state='pending' AND done<total AND rowid IN (SELECT MIN(rowid) FROM playback_jobs WHERE state='pending' AND done<total GROUP BY overlay,preview,priority) ORDER BY priority ASC,rowid ASC");
  for(const job of jobs){
   const key=this.key(job.overlay,!!job.preview);if(this.active.has(key))continue;
   if(job.audio&&this.busyAudio)continue;
   if(job.audio&&job.priority!==1&&Date.now()<(this.nextAudioAt||0))continue;
   const output=this.player(job.overlay,!!job.preview);if(!output)continue;
   const delivery=crypto.randomUUID();const active={delivery,job:job.id,player:output.id,output,audio:!!job.audio,priority:job.priority||3,preview:!!job.preview};
   this.active.set(key,active);if(job.audio)this.busyAudio=delivery;
   try{output.send({type:'queued-action',delivery,jobId:job.id,sequence:job.done+1,total:job.total,payload:JSON.parse(job.body),priority:active.priority});}
   catch{this.active.delete(key);if(this.busyAudio===delivery)this.busyAudio=null;}
  }
 }
 ack(delivery,status){
  if(!['ended','error'].includes(status))throw Error('Confirmación inválida');
  if(this.store.all('SELECT id FROM playback_receipts WHERE id=?',[delivery]).length)return true;
  const found=[...this.active.entries()].find(([,a])=>a.delivery===delivery);if(!found)return false;
  const [key,a]=found;
  this.store.db.run('BEGIN');try{
   this.store.db.run('INSERT INTO playback_receipts(id) VALUES(?)',[delivery]);
   if(status==='ended')this.store.db.run("UPDATE playback_jobs SET done=done+1,state=CASE WHEN done+1>=total THEN 'done' ELSE 'pending' END WHERE id=?",[a.job]);
   else this.store.db.run("UPDATE playback_jobs SET state='failed' WHERE id=?",[a.job]);
   this.store.db.run('COMMIT');
  }catch(e){this.store.db.run('ROLLBACK');throw e;}
  this.store.flush();this.active.delete(key);if(this.busyAudio===delivery){this.busyAudio=null;const gap=Math.max(0,Math.min(10000,Number(this.store.get('audioSettings')?.gapMs)||0));this.nextAudioAt=Date.now()+gap;if(gap){clearTimeout(this.gapTimer);this.gapTimer=setTimeout(()=>this.wake(),gap);this.gapTimer.unref?.();}}this.wake();this.changed();return true;
 }
 disconnect(playerId){for(const [key,a]of this.active)if(a.player===playerId){this.active.delete(key);if(this.busyAudio===a.delivery)this.busyAudio=null;}this.wake();this.changed();}
 setPaused(value){this.paused=!!value;this.store.set('playbackPaused',this.paused);this.wake();this.changed();return this.status();}
 retry(){this.store.db.run("UPDATE playback_jobs SET state='pending' WHERE state='failed'");this.store.flush();this.wake();this.changed();return this.status();}
 cancelPreview(overlay){this.store.db.run("UPDATE playback_jobs SET state='cancelled' WHERE overlay=? AND preview=1 AND state IN ('pending','failed')",[overlay]);const key=this.key(overlay,true),a=this.active.get(key);if(a?.delivery===this.busyAudio)this.busyAudio=null;this.active.delete(key);this.store.flush();this.wake();this.changed();}
 cancelOverlay(overlay){this.store.db.run("UPDATE playback_jobs SET state='cancelled' WHERE overlay=? AND state IN ('pending','failed')",[overlay]);for(const preview of [false,true]){const key=this.key(overlay,preview),a=this.active.get(key);if(a?.delivery===this.busyAudio)this.busyAudio=null;this.active.delete(key);}this.store.flush();this.wake();this.changed();}
 clear(){this.store.db.run("UPDATE playback_jobs SET state='cancelled' WHERE state IN ('pending','failed')");this.active.clear();this.busyAudio=null;this.store.flush();this.changed();return this.status();}
 status(){
  const rows=this.store.all('SELECT state,SUM(total-done) AS remaining,SUM(done) AS done FROM playback_jobs GROUP BY state');
  const audio=this.store.all('SELECT SUM(done) AS n FROM playback_jobs WHERE audio=1')[0]?.n||0;
  const priorities=this.store.all("SELECT priority,SUM(total-done) AS n FROM playback_jobs WHERE state='pending' GROUP BY priority");
  return {audioCompleted:audio,pending:rows.filter(r=>r.state==='pending').reduce((n,r)=>n+r.remaining,0),failed:rows.filter(r=>r.state==='failed').reduce((n,r)=>n+r.remaining,0),cancelled:rows.filter(r=>r.state==='cancelled').reduce((n,r)=>n+r.remaining,0),completed:rows.reduce((n,r)=>n+r.done,0),active:this.active.size,paused:this.paused,byPriority:Object.fromEntries(priorities.map(x=>[x.priority,x.n])),serialAudio:true};
 }
 changed(){this.change(this.status());}
}
function giftRepeats(action,event,rule){if(event.type!=='gift'||rule.repeatGiftAudio===false||!(action.type==='sound'||action.type==='media'&&/\.(mp3|wav|ogg)$/i.test(action.media||'')))return 1;const n=Number(event.count??1);if(!Number.isSafeInteger(n)||n<1)throw Error('Cantidad de regalos inválida');return n;}
module.exports={PlaybackQueue,giftRepeats};
