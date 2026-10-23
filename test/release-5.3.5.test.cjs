'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Commands}=require('../src/commands.cjs');
const {musicState,reconcile,rememberRequest,forgetRequest}=require('../src/music-requests.cjs');
const {synthesize}=require('../src/voices.cjs');
const sound={ok:true,status:200,text:async()=>JSON.stringify({success:true,data:Buffer.alloc(550,3).toString('base64')})};
function storeFake(){const settings={},runs=new Map(),users=new Map([['u',100]]),ledger=[];let updated=0,breakDone=false;const store={
 db:{run(sql,params=[]){updated=1;if(sql.startsWith('UPDATE users SET balance=balance-')){if((users.get(params[1])||0)<params[2])updated=0;else users.set(params[1],users.get(params[1])-params[0]);}else if(sql.startsWith('INSERT INTO ledger'))ledger.push(params);else if(sql.startsWith('INSERT INTO command_runs'))runs.set(params[0],{user:params[1],command:params[2],state:params[3],cost:params[4],at:params[5]});else if(sql.startsWith('UPDATE command_runs')){if(breakDone)throw Error('disk IO');runs.get(params[0]).state=sql.includes("state='done'")?'done':'failed';}},getRowsModified:()=>updated},
 get:k=>settings[k],set:(k,v)=>{settings[k]=v},flush(){},
 all(sql,p=[]){if(sql.startsWith('SELECT id FROM command_runs'))return runs.has(p[0])?[{id:p[0]}]:[];if(sql.startsWith('SELECT at FROM command_runs'))return [...runs.values()].filter(x=>x.user===p[0]&&x.command===p[1]&&['reserved','done'].includes(x.state)).map(x=>({at:x.at}));if(sql.startsWith('SELECT balance FROM users'))return [{balance:users.get(p[0])||0}];return []},
 credit(user,name,cost){users.set(user,(users.get(user)||0)+cost);return {balance:users.get(user)}}
 };return {store,users,runs,ledger,breakAfterEnqueue:()=>breakDone=true};}
const song={uri:'spotify:track:1234567890123456789012',name:'La Chona',artist:'Tucanes',cover:'https://example.com/cover.jpg',duration:190000};
test('WitiVoces responden usando el proveedor disponible sin esperar al colgado',async()=>{
 const started=Date.now();let calls=0;
 const result=await synthesize({voice:'es_mx_002',text:'Hola'}, {fetcher:async()=>{calls++;return calls===1?new Promise(()=>{}):sound;},timeouts:[400,400]});
 assert.equal(calls,2);assert.equal(result.voice,'es_mx_002');assert(Date.now()-started<300,'debe resolver en paralelo');
});
test('WitiVoces nunca salta a Windows si el usuario eligió WitiVoces',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../renderer/app.js'),'utf8');
 const handler=code.slice(code.indexOf("window.witi.on('tts-job'"));
 assert.doesNotMatch(handler,/catch\(err\)\{[^}]*await speakLocal/);
 assert.match(handler,/No se cambió a voz Microsoft/);
 assert.match(code,/voiceQueue\.length>3/);
});
test('solicitudes de la comunidad muestran 3 y atribución, nunca recomendaciones Spotify',()=>{
 const settings={},store={get:k=>settings[k],set:(k,v)=>settings[k]=v};
 const a=rememberRequest(store,{...song,name:'Primera'},{name:'Ana',avatar:'https://example.com/u.jpg'});
 rememberRequest(store,{...song,name:'Segunda'},{name:'Beto'});
 rememberRequest(store,{...song,name:'Tercera'},{name:'Caro'});
 rememberRequest(store,{...song,name:'Cuarta'},{name:'Diego'});
 let m=musicState(store,{spotifyQueue:[{name:'Spotify random',uri:'spotify:other'}]});
 assert.deepEqual(m.queue.map(q=>q.requestedBy),['Ana','Beto','Caro']);assert.equal(m.queue[0].requestedByAvatar,'https://example.com/u.jpg');
 assert.equal(reconcile(store,{uri:song.uri,progress:0}).requestedBy,'Ana');
 assert.deepEqual(musicState(store).queue.map(q=>q.requestedBy),['Beto','Caro','Diego']);
 forgetRequest(store,a);assert.equal(store.get('spotifyRequests').length,3);
});
test('/play confirmado descuenta una vez, conserva usuario y confirma Siguientes 3',async()=>{
 const {store,users,runs}=storeFake();let observedAtEnqueue,updates=0;
 const spotify={status:{connected:true},search:async()=>[song],enqueue:async()=>{observedAtEnqueue=store.get('spotifyRequests')?.[0]?.requestedBy}};
 const cmd=new Commands({store,spotify,queueChanged:()=>updates++});
 const r=await cmd.receive({id:'one',user:'u',name:'Ana',text:'/play la chona',avatar:'https://example.com/u.jpg'});
 assert.match(r.message,/Siguientes 3/);assert.equal(observedAtEnqueue,'Ana');assert.equal(users.get('u'),50);assert.equal(updates,1);assert.equal(runs.get('one').state,'done');
 assert.equal(store.get('spotifyRequests')[0].requestedByAvatar,'https://example.com/u.jpg');
});
test('/play fallido devuelve puntos y no deja canción fantasma',async()=>{
 const {store,users,runs}=storeFake(),spotify={status:{connected:true},search:async()=>[song],enqueue:async()=>{throw Error('Spotify no tiene dispositivo')}};
 const cmd=new Commands({store,spotify});await assert.rejects(()=>cmd.receive({id:'two',user:'u',name:'Ana',text:'/play la chona'}),/puntos devueltos/);
 assert.equal(users.get('u'),100);assert.equal(store.get('spotifyRequests').length,0);assert.equal(runs.get('two').state,'failed');
});
test('/play enviado no devuelve puntos ni informa error falso por un fallo de confirmación local',async()=>{
 const {store,users,runs,breakAfterEnqueue}=storeFake();
 const spotify={status:{connected:true},search:async()=>[song],enqueue:async()=>{breakAfterEnqueue()}};
 const cmd=new Commands({store,spotify});const r=await cmd.receive({id:'three',user:'u',name:'Ana',text:'/play la chona'});
 assert.match(r.message,/Spotify confirmó/);assert.equal(users.get('u'),50);assert.equal(store.get('spotifyRequests').length,1);assert.equal(runs.get('three').state,'reserved');
});
