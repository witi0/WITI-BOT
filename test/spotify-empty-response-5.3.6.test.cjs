'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Spotify}=require('../src/spotify.cjs');
const {Commands}=require('../src/commands.cjs');
const {jsonRequest}=require('../src/oauth.cjs');
const song={uri:'spotify:track:1234567890123456789012',name:'La Chona',artist:'Los Tucanes',cover:'https://example.com/cover.jpg'};
function spotifyService(){const settings={};const service=new Spotify({store:{get:k=>settings[k],set:(k,v)=>settings[k]=v},secretGet:()=>'',secretSet:()=>{},open:async()=>{},change:()=>{}});service.tokens={access:'sample-access',expires:Date.now()+3600000};service.status.connected=true;return service;}
function installFetch(t,fn){const old=global.fetch;global.fetch=fn;t.after(()=>{global.fetch=old;});}
function response(status,body='',headers={}){return new Response(status===204?null:body,{status,headers});}
function storeFake(){const settings={},runs=new Map(),users=new Map([['fan-1',100]]),ledger=[];let updated=0;const store={
 db:{run(sql,params=[]){updated=1;if(sql.startsWith('UPDATE users SET balance=balance-')){if((users.get(params[1])||0)<params[2])updated=0;else users.set(params[1],users.get(params[1])-params[0]);}else if(sql.startsWith('INSERT INTO ledger'))ledger.push(params);else if(sql.startsWith('INSERT INTO command_runs'))runs.set(params[0],{user:params[1],command:params[2],state:params[3],cost:params[4],at:params[5]});else if(sql.startsWith('UPDATE command_runs'))runs.get(params[0]).state=sql.includes("state='done'")?'done':'failed';},getRowsModified:()=>updated},
 get:k=>settings[k],set:(k,v)=>{settings[k]=v},flush(){},
 all(sql,p=[]){if(sql.startsWith('SELECT id FROM command_runs'))return runs.has(p[0])?[{id:p[0]}]:[];if(sql.startsWith('SELECT at FROM command_runs'))return [...runs.values()].filter(x=>x.user===p[0]&&x.command===p[1]&&['reserved','done'].includes(x.state)).map(x=>({at:x.at}));if(sql.startsWith('SELECT balance FROM users'))return [{balance:users.get(p[0])||0}];return []},
 credit(user,name,cost){users.set(user,(users.get(user)||0)+cost);return{balance:users.get(user)};}
 };return{store,users,runs};}
for(const status of [200,202,204])test(`Spotify /play acepta ${status} sin JSON como confirmación`,async t=>{
 const service=spotifyService();let seen=0;
 installFetch(t,async(url,opt)=>{assert.match(url,/\/me\/player\/queue\?/);assert.equal(opt.method,'POST');seen++;return response(status);});
 assert.equal(await service.enqueue(song.uri),undefined);
 assert.equal(seen,1);
});
test('/play confirma canción, usuario, puntos y Siguientes 3 ante HTTP 200 sin cuerpo',async t=>{
 const {store,users,runs}=storeFake(),service=spotifyService();let postCount=0,changed=0;
 installFetch(t,async(url,opt)=>{
  if(url.includes('/search?'))return response(200,JSON.stringify({tracks:{items:[{id:song.uri.split(':').at(-1),uri:song.uri,name:song.name,artists:[{name:song.artist}],duration_ms:190000,album:{images:[{url:song.cover}]}}]}}));
  if(url.includes('/me/player/queue?')){postCount++;return response(200);}
  throw Error('Petición inesperada: '+url);
 });
 const commands=new Commands({store,spotify:service,queueChanged:()=>changed++});
 const output=await commands.receive({id:'chat-01',type:'command',text:'/play la chona',user:'fan-1',name:'WitiFan',avatar:'https://example.com/avatar.jpg'});
 assert.match(output.message,/añadida a Spotify y a Siguientes 3/);
 assert.equal(postCount,1);assert.equal(changed,1);assert.equal(users.get('fan-1'),50);assert.equal(runs.get('chat-01').state,'done');
 assert.equal(store.get('spotifyRequests')[0].requestedBy,'WitiFan');
 assert.equal(store.get('spotifyRequests')[0].requestedByAvatar,'https://example.com/avatar.jpg');
 assert.equal((await commands.receive({id:'chat-01',text:'/play la chona',user:'fan-1',name:'WitiFan'})).duplicate,true);
 assert.equal(postCount,1);assert.equal(users.get('fan-1'),50);
});
test('Spotify 404 sin JSON muestra dispositivo ausente, cancela solicitud y devuelve puntos',async t=>{
 const {store,users,runs}=storeFake(),service=spotifyService();
 installFetch(t,async(url)=>url.includes('/search?')?response(200,JSON.stringify({tracks:{items:[{uri:song.uri,name:song.name,artists:[{name:song.artist}]}]}})):response(404));
 const cmd=new Commands({store,spotify:service});
 await assert.rejects(()=>cmd.receive({id:'chat-02',text:'/play la chona',user:'fan-1',name:'WitiFan'}),/dispositivo activo.*puntos devueltos/);
 assert.equal(users.get('fan-1'),100);assert.equal(store.get('spotifyRequests').length,0);assert.equal(runs.get('chat-02').state,'failed');
});
test('Spotify 403 vacío mantiene error HTTP concreto (no error de JSON)',async t=>{
 installFetch(t,async()=>response(403));
 const service=spotifyService();
 await assert.rejects(()=>service.enqueue(song.uri),err=>err.status===403&&/Premium/.test(err.message)&&!/Respuesta inválida/.test(err.message));
});
test('Spotify 429 conserva Retry-After cuando el cuerpo viene vacío',async t=>{
 installFetch(t,async()=>response(429,'',{'retry-after':'9'}));
 const service=spotifyService();
 await assert.rejects(()=>service.enqueue(song.uri),err=>err.status===429&&err.retryAfter===9);
 assert(service.nextPoll>Date.now());
});
test('Las consultas de datos GET siguen exigiendo JSON válido',async t=>{
 installFetch(t,async()=>response(200));
 await assert.rejects(()=>jsonRequest('https://api.spotify.com/v1/me'),/no devolvió los datos esperados/);
});
test('El control de reproducción acepta respuesta exitosa vacía',async t=>{
 installFetch(t,async()=>response(200));
 const service=spotifyService();service.tick=async()=>{};
 await service.playback('next');
 await service.playback('pause');
});
