'use strict';
const {eligible}=require('./chat-policy.cjs');
const defaults=[{name:'/play',aliases:['!play'],action:'play',cost:50,cooldown:15,enabled:true,audience:'all',text:''},{name:'/puntos',aliases:['!puntos'],action:'points',cost:0,cooldown:3,enabled:true,audience:'all',text:''},{name:'/skip',aliases:['!skip'],action:'skip',cost:100,cooldown:30,enabled:false,audience:'moderator',text:''},{name:'/voz',aliases:['!voz'],action:'tts',cost:20,cooldown:10,enabled:false,audience:'all',text:''}];
function validateCommands(input){
 if(!Array.isArray(input)||input.length>50)throw Error('Máximo 50 comandos');const names=new Set();
 return input.map(c=>{const name=String(c.name||'').toLowerCase().trim(),aliases=String(Array.isArray(c.aliases)?c.aliases.join(','):c.aliases||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  for(const n of [name,...aliases]){if(!/^[!/.][a-z0-9_áéíóúñ-]{1,30}$/i.test(n)||names.has(n))throw Error('Comando inválido o duplicado: '+n);names.add(n);}
  if(!['play','points','skip','tts','reply'].includes(c.action))throw Error('Acción desconocida');
  if(!Number.isSafeInteger(Number(c.cost))||c.cost<0||c.cost>1000000)throw Error('Costo de puntos inválido');
  return {name,aliases,action:c.action,cost:Number(c.cost),cooldown:Math.min(3600,Math.max(0,Number(c.cooldown)||0)),enabled:!!c.enabled,audience:['all','follower','moderator','subscriber','topgifter'].includes(c.audience)?c.audience:'all',text:String(c.text||'').slice(0,500)};
 });
}
class Commands{
 constructor({store,spotify,speak=()=>{},context=()=>({})}){Object.assign(this,{store,spotify,speak,context});this.tail=Promise.resolve();store.db.run('CREATE TABLE IF NOT EXISTS command_runs(id TEXT PRIMARY KEY,user TEXT NOT NULL,command TEXT NOT NULL,state TEXT NOT NULL,cost INTEGER NOT NULL,at INTEGER NOT NULL)');}
 settings(){return this.store.get('commands')||defaults;}
 save(c){const out=validateCommands(c);this.store.set('commands',out);return out;}
 receive(e){const job=this.tail.then(()=>this.run(e));this.tail=job.catch(()=>{});return job;}
 async run(e){

  const [word,...words]=String(e.text||'').trim().split(/\s+/),cmd=this.settings().find(c=>c.enabled&&[c.name,...(c.aliases||[])].includes(word.toLowerCase()));if(!cmd)return null;
  if(this.store.all('SELECT id FROM command_runs WHERE id=?',[e.id]).length)return {duplicate:true};
  if(!eligible(e,cmd,this.context()))throw Error('No tienes el rol requerido para '+cmd.name);
  const last=this.store.all("SELECT at FROM command_runs WHERE user=? AND command=? AND state IN ('reserved','done') ORDER BY at DESC LIMIT 1",[e.user,cmd.name])[0];
  if(last&&Date.now()-last.at<cmd.cooldown*1000)throw Error('Espera el tiempo de recarga de '+cmd.name);
  const balance=()=>this.store.all('SELECT balance FROM users WHERE id=?',[e.user])[0]?.balance||0;
  if(balance()<cmd.cost)throw Error(`${e.name||e.user}, no tienes suficientes puntos. Necesitas ${cmd.cost} y tienes ${balance()}`);
  const args=words.join(' ');let song;if(e.simulated){if(cmd.action==='points')return {message:`${e.name}, tienes ${balance()} puntos (prueba)`};return {message:`${e.name}, simulación de ${cmd.name}: saldo suficiente; no se descuenta ni controla Spotify`};}
  if(['play','skip'].includes(cmd.action)&&!this.spotify.status.connected)throw Error('Conecta Spotify antes de usar este comando');
  if(cmd.action==='play'){if(args.length<2||args.length>150)throw Error('Ejemplo: /play la chona');song=(await this.spotify.search(args))[0];if(!song)throw Error('No encontré esa canción');}
  if(cmd.action==='tts'&&!args.trim())throw Error('Escribe el texto después del comando');
  this.store.db.run('BEGIN IMMEDIATE');try{
   if(cmd.cost){this.store.db.run('UPDATE users SET balance=balance-? WHERE id=? AND balance>=?',[cmd.cost,e.user,cmd.cost]);if(this.store.db.getRowsModified()!==1)throw Error('Saldo insuficiente');this.store.db.run('INSERT INTO ledger VALUES(?,?,?,?,?,?)',[require('node:crypto').randomUUID(),'command:'+e.id,e.user,-cmd.cost,balance(),new Date().toISOString()]);}
   this.store.db.run('INSERT INTO command_runs VALUES(?,?,?,?,?,?)',[e.id,e.user,cmd.name,'reserved',cmd.cost,Date.now()]);this.store.db.run('COMMIT');this.store.flush();
  }catch(err){this.store.db.run('ROLLBACK');throw err;}
  let message;
  try{
   if(cmd.action==='play'){await this.spotify.enqueue(song.uri);try{const requests=(this.store.get('spotifyRequests')||[]).filter(r=>Date.now()-r.at<21600000);requests.push({uri:song.uri,requestedBy:e.name||e.user,requestedByAvatar:e.avatar||'',at:Date.now()});this.store.set('spotifyRequests',requests.slice(-100));}catch{}message=`${e.name}, tu canción ${song.name} · ${song.artist} se agregó a la cola de Spotify (${cmd.cost} puntos)`;}
   if(cmd.action==='skip'){await this.spotify.playback('next');message='Canción saltada';}
   if(cmd.action==='points')message=`${e.name}, tienes ${balance()} puntos`;
   if(cmd.action==='tts'){this.speak(args.slice(0,300),e);message='Lectura añadida a la cola';}
   if(cmd.action==='reply')message=cmd.text.replaceAll('{user}',e.name).replaceAll('{args}',args).replaceAll('{points}',String(balance()));
   this.store.db.run("UPDATE command_runs SET state='done' WHERE id=?",[e.id]);this.store.flush();return {message};
  }catch(err){if(cmd.cost)this.store.credit(e.user,e.name,cmd.cost,'refund:'+e.id);this.store.db.run("UPDATE command_runs SET state='failed' WHERE id=?",[e.id]);this.store.flush();throw Error(err.message+(cmd.cost?' · puntos devueltos':''));}
 }
}
module.exports={Commands,validateCommands,defaults};
