const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const initSqlJs = require('sql.js');
const {giftRepeats}=require('./playback.cjs');
class Store {
  static async open(dir) {
    fs.mkdirSync(dir, {recursive:true});
    const SQL = await initSqlJs();
    const file=path.join(dir,'witi.sqlite');
    const db=fs.existsSync(file)?new SQL.Database(fs.readFileSync(file)):new SQL.Database();
    const s=new Store(db,file);
    db.run(`PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,balance INTEGER NOT NULL DEFAULT 0 CHECK(balance>=0));
      CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,event TEXT UNIQUE NOT NULL,user TEXT NOT NULL REFERENCES users(id),amount INTEGER NOT NULL,balance INTEGER NOT NULL,created TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS rules(id TEXT PRIMARY KEY,body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS overlays(id TEXT PRIMARY KEY,body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS logs(id INTEGER PRIMARY KEY AUTOINCREMENT,body TEXT NOT NULL);
      PRAGMA user_version=1;`);
    if (!s.get('timer')) s.set('timer',{remaining:300,running:false,anchor:Date.now()});
    if(!s.all('SELECT id FROM overlays').length){const {fromTemplate}=require('./gallery.cjs');for(const id of [34,0,1,2,10,16,4,7])s.save('overlays',fromTemplate('witi-'+id));}
    s.flush(); return s;
  }
  constructor(db,file){this.db=db;this.file=file;}
  all(sql,args=[]){const q=this.db.prepare(sql);try{q.bind(args);const out=[];while(q.step())out.push(q.getAsObject());return out;}finally{q.free();}}
  flush(){clearTimeout(this.logFlush);this.logFlush=null;const tmp=this.file+'.tmp';fs.writeFileSync(tmp,this.db.export(),{mode:0o600});fs.renameSync(tmp,this.file);}
  get(key){const r=this.all('SELECT value FROM settings WHERE key=?',[key])[0];return r?JSON.parse(r.value):undefined;}
  set(key,value){this.db.run('INSERT OR REPLACE INTO settings VALUES (?,?)',[key,JSON.stringify(value)]);this.flush();}
  save(table,obj){if(!['rules','overlays'].includes(table))throw Error('Tabla inválida');this.db.run(`INSERT OR REPLACE INTO ${table} VALUES (?,?)`,[obj.id,JSON.stringify(obj)]);this.flush();return obj;}
  list(table){if(!['rules','overlays'].includes(table))throw Error('Tabla inválida');return this.all(`SELECT body FROM ${table}`).map(x=>JSON.parse(x.body));}
  remove(table,id){if(!['rules','overlays'].includes(table))throw Error('Tabla inválida');this.db.run(`DELETE FROM ${table} WHERE id=?`,[id]);this.flush();}
  log(data){this.db.run('INSERT INTO logs(body) VALUES (?)',[JSON.stringify({...data,at:new Date().toISOString()})]);this.db.run('DELETE FROM logs WHERE id NOT IN (SELECT id FROM logs ORDER BY id DESC LIMIT 500)');if(!this.logFlush){this.logFlush=setTimeout(()=>{this.logFlush=null;try{this.flush();}catch{}},500);this.logFlush.unref?.();}}
  credit(user,name,amount,event){
    if(!user||!event||!Number.isSafeInteger(amount)||amount===0)throw Error('Transacción inválida');
    this.db.run('BEGIN IMMEDIATE');
    try{
      if(this.all('SELECT id FROM ledger WHERE event=?',[event]).length){this.db.run('ROLLBACK');return {duplicate:true};}
      this.db.run('INSERT OR IGNORE INTO users(id,name) VALUES (?,?)',[user,name]);
      const balance=this.all('SELECT balance FROM users WHERE id=?',[user])[0].balance+amount;
      if(!Number.isSafeInteger(balance)||balance<0)throw Error('Saldo insuficiente o fuera de rango');
      this.db.run('UPDATE users SET balance=?,name=? WHERE id=?',[balance,name,user]);
      this.db.run('INSERT INTO ledger VALUES(?,?,?,?,?,?)',[crypto.randomUUID(),event,user,amount,balance,new Date().toISOString()]);
      this.db.run('COMMIT');this.flush();return {balance};
    }catch(e){try{this.db.run('ROLLBACK');}catch{}throw e;}
  }
  timer(){const t=this.get('timer');return {...t,remaining:Math.max(0,t.remaining-(t.running?(Date.now()-t.anchor)/1000:0)),anchor:Date.now()};}
  changeTimer(op,value=0){const t=this.timer();if(!Number.isFinite(value)||Math.abs(value)>31536000)throw Error('Tiempo inválido');
    if(op==='add')t.remaining=Math.min(31536000,Math.max(0,t.remaining+value));else if(op==='set')t.remaining=Math.max(0,value);else if(op==='start')t.running=true;else if(op==='pause')t.running=false;else throw Error('Operación inválida');
    t.anchor=Date.now();this.set('timer',t);return t;}
  snapshot(){return {rules:this.list('rules'),overlays:this.list('overlays'),users:this.all('SELECT * FROM users ORDER BY balance DESC LIMIT 200'),ledger:this.all('SELECT * FROM ledger ORDER BY created DESC LIMIT 200'),logs:this.all('SELECT body FROM logs ORDER BY id DESC LIMIT 100').map(x=>JSON.parse(x.body)),timer:this.timer()};}
  backup(){this.flush();const dest=this.file+'.backup-'+Date.now();fs.copyFileSync(this.file,dest);return dest;}
}
function validateRule(r,overlayIds){
 if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>100)throw Error('Escribe un nombre de hasta 100 caracteres');
 if(!['follow','share','gift','like','comment','command','manual','subscription'].includes(r.trigger))throw Error('Disparador inválido');
 if(r.trigger==='like'&&(!Number.isSafeInteger(Number(r.likeThreshold??1000))||Number(r.likeThreshold??1000)<1||Number(r.likeThreshold??1000)>1000000))throw Error('El umbral de likes debe estar entre 1 y 1000000');
 if(!Array.isArray(r.actions)||!r.actions.length||r.actions.length>10)throw Error('Añade de 1 a 10 acciones');
 for(const a of r.actions){
   if(!['alert','media','points','timer','tts','obsScene','sound','wheel'].includes(a.type))throw Error('Acción inválida');
   if((['alert','wheel'].includes(a.type)||a.type==='media'&&!/\.(mp3|wav|ogg)$/i.test(a.media||''))&&!overlayIds.includes(a.overlay))throw Error('Elige una pantalla válida');
   if(['points','timer'].includes(a.type)&&(!Number.isSafeInteger(a.value)||Math.abs(a.value)>1000000))throw Error('Cantidad inválida');
   if(a.type==='media'&&!/^[a-f0-9]{64}\.(png|jpg|jpeg|webp|gif|mp4|webm|mp3|wav|ogg)$/.test(a.media||''))throw Error('Importa un recurso');
   if(a.type==='sound'&&!/^(?:witi-\d{3}\.wav|[a-f\d]{64}\.(?:mp3|wav|ogg))$/.test(a.sound||''))throw Error('Elige un sonido de la biblioteca');
   if(a.text&&a.text.length>500)throw Error('Texto demasiado largo');
 }
 return {...r,id:typeof r.id==='string'?r.id:crypto.randomUUID(),likeThreshold:r.trigger==='like'?Number(r.likeThreshold??1000):undefined,enabled:r.enabled!==false,repeatGiftAudio:r.repeatGiftAudio!==false,cooldown:Math.min(3600,Math.max(0,Number(r.cooldown)||0))};
}
class Engine{
 constructor(store,execute){this.store=store;this.execute=execute;this.seen=new Map();this.cooldowns=new Map();this.likes=new Map();}
 async receive(event){
   if(!event.id||!event.user||typeof event.type!=='string')throw Error('Evento inválido');
   if(this.seen.has(event.id))return {duplicate:true};this.seen.set(event.id,Date.now());
   if(this.seen.size>10000)this.seen.delete(this.seen.keys().next().value);
   const results=[];
   for(const r of this.store.list('rules')){
     if(!r.enabled||r.trigger!==event.type)continue;
     if(r.match&&r.match!==event.text&&r.match!==event.gift&&String(r.match).toLowerCase()!==String(event.giftName||'').toLowerCase())continue;
     const key=r.id+':'+(event.simulated?'test:':'live:')+event.user;let hits=1;let threshold=0,baseHit=0;if(event.type==='like'){threshold=Math.max(1,Number(r.likeThreshold)||500);const old=this.likes.get(key)||0,total=old+Math.max(0,Math.floor(Number(event.count)||1));this.likes.delete(key);this.likes.set(key,total);if(this.likes.size>10000)this.likes.delete(this.likes.keys().next().value);baseHit=Math.floor(old/threshold);hits=Math.floor(total/threshold)-baseHit;}
     for(let hit=0;hit<hits;hit++){const fired=threshold?{...event,count:threshold,likeMilestone:(baseHit+hit+1)*threshold}:event;
     const cooling=Date.now()-(this.cooldowns.get(key)||0)<r.cooldown*1000;
     if(!cooling){this.cooldowns.delete(key);this.cooldowns.set(key,Date.now());if(this.cooldowns.size>10000)this.cooldowns.delete(this.cooldowns.keys().next().value);}
     for(let i=0;i<r.actions.length;i++){
       const a=r.actions[i],perGiftAudio=event.type==='gift'&&r.repeatGiftAudio!==false&&(a.type==='sound'||a.type==='media'&&/\.(mp3|wav|ogg)$/i.test(a.media||''));if(cooling&&!perGiftAudio)continue;try{let outcome;
         if(a.type==='points') {if(!event.simulated)this.store.credit(event.user,event.name||event.user,a.value,event.id+':'+r.id+':'+hit+':'+i);}
         else outcome=await this.execute(a,fired,{id:crypto.createHash('sha256').update(event.id+':'+r.id+':'+hit+':'+i).digest('hex'),repeats:giftRepeats(a,event,r),rule:r.id,individualOverlay:!!r.individualOverlay});
         results.push({rule:r.name,action:a.type,status:event.simulated&&a.type==='points'?'omitido: simulación sin puntos permanentes':(outcome?.status||'ejecutada')});
       }catch(e){results.push({rule:r.name,action:a.type,status:'error',message:e.message});}
     }}
   }
   this.store.log({event:event.type,user:event.user,simulated:!!event.simulated,results});return results;
 }
}
module.exports={Store,Engine,validateRule};
