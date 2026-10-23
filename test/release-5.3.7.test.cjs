'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {musicState}=require('../src/music-requests.cjs');
const {Commands}=require('../src/commands.cjs');
const {parseProfilePage}=require('../src/tiktok-profile.cjs');
function storeSettings(seed={}){const data={...seed};return {get:k=>data[k],set:(k,v)=>{data[k]=v},dump:()=>data};}
const song={uri:'spotify:track:1234567890123456789012',name:'La Chona',artist:'Tucanes',cover:'https://example.com/cover.jpg',duration:190000};
function storeFake(){const settings={},runs=new Map(),users=new Map([['u',100]]);let updated=0;const store={
 db:{run(sql,params=[]){updated=1;if(sql.startsWith('UPDATE users SET balance=balance-')){if((users.get(params[1])||0)<params[2])updated=0;else users.set(params[1],users.get(params[1])-params[0]);}else if(sql.startsWith('INSERT INTO command_runs'))runs.set(params[0],{user:params[1],command:params[2],state:params[3],cost:params[4],at:params[5]});else if(sql.startsWith('UPDATE command_runs'))runs.get(params[0]).state=sql.includes("state='done'")?'done':'failed';},getRowsModified:()=>updated},
 get:k=>settings[k],set:(k,v)=>{settings[k]=v},flush(){},
 all(sql,p=[]){if(sql.startsWith('SELECT id FROM command_runs'))return runs.has(p[0])?[{id:p[0]}]:[];if(sql.startsWith('SELECT at FROM command_runs'))return [...runs.values()].filter(x=>x.user===p[0]&&x.command===p[1]&&['reserved','done'].includes(x.state)).map(x=>({at:x.at}));if(sql.startsWith('SELECT balance FROM users'))return [{balance:users.get(p[0])||0}];return []},
 credit(user,name,cost){users.set(user,(users.get(user)||0)+cost);return {balance:users.get(user)}}
 };return {store,users};}

test('Siguientes 3 mezcla prioridad WITI con cola nativa de Spotify sin duplicar la solicitud',()=>{
 const store=storeSettings({spotifyRequests:[{...song,requestedBy:'Ana',at:Date.now()}]});
 const mixed=musicState(store,{spotifyQueue:[{uri:song.uri,name:song.name,artist:song.artist},{uri:'spotify:track:abcdefghijklmnopqrstuv',name:'Nativa 1',artist:'Spotify'},{uri:'spotify:track:bbbbbbbbbbbbbbbbbbbbbb',name:'Nativa 2',artist:'Spotify'}]});
 assert.deepEqual(mixed.queue.map(x=>x.name),['La Chona','Nativa 1','Nativa 2']);
 assert.equal(mixed.queue[0].priority,true);
 assert.equal(mixed.queue[1].queueOrigin,'spotify');
});

test('/play manda prioridad true al encolar en Spotify',async()=>{
 const {store,users}=storeFake();
 let receivedPriority=null;
 const spotify={status:{connected:true},search:async()=>[song],enqueue:async(uri,opts)=>{receivedPriority=opts?.priority===true;}};
 const cmd=new Commands({store,spotify});
 const result=await cmd.receive({id:'priority-play',user:'u',name:'Ana',text:'/play la chona'});
 assert.match(result.message,/Siguientes 3/);
 assert.equal(receivedPriority,true);
 assert.equal(users.get('u'),50);
 });

test('Parsea foto pública y nombre de TikTok desde HTML del perfil',()=>{
 const html=`<html><body><script>{"__DEFAULT_SCOPE__":{"webapp.user-detail":{"userInfo":{"user":{"uniqueId":"witi","nickname":"Witi Bebe","avatarLarger":"https://p16-sign-va.tiktokcdn.com/avatar.jpeg"}}}}}</script></body></html>`;
 const profile=parseProfilePage(html,'@witi');
 assert.equal(profile.username,'witi');
 assert.equal(profile.displayName,'Witi Bebe');
 assert.match(profile.avatar,/tiktokcdn/);
});
