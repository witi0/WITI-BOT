'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{EventEmitter}=require('node:events');
const {Store,Engine,validateRule}=require('../src/core.cjs'),{Community}=require('../src/community.cjs'),{normalize,TikTokReader}=require('../src/tiktok.cjs'),{followerStatus}=require('../src/follower.cjs'),{TtsPolicy,eligible}=require('../src/chat-policy.cjs'),{speechName}=require('../src/speech-name.cjs'),{Simulation,buildSimulationEvent}=require('../src/simulation.cjs');
async function setup(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'witi44-')),s=await Store.open(dir);t.after(()=>{s.db.close();fs.rmSync(dir,{recursive:true,force:true});});return s;}
test('seguidor→no seguidor→desconocido→seguidor: decide con el comentario actual, incluso después de reiniciar',async t=>{
 const s=await setup(t),c=new Community(s),policy=new TtsPolicy(),settings={enabled:true,prefix:'.',audience:'follower',cooldown:0};
 function send(id,payload){const e=normalize('comment',{common:{msgId:id},content:'.Hola',user:{id:'ana',nickname:'ANA',...payload}});c.observe(e);return policy.text(e,settings);}
 assert.equal(send('1',{followInfo:{followStatus:'1'}}),'ana: Hola');
 assert.equal(send('2',{followInfo:{followStatus:'0'}}),null);
 assert.equal(send('3',{}),null);
 assert.equal(send('4',{followInfo:{followStatus:'2'}}),'ana: Hola');
 new Community(s);assert.equal(send('5',{}),null);
 assert.equal(send('6',{isFollower:false}),null);
 assert.equal(s.all('SELECT follower FROM community_members')[0].follower,0);
});
test('0 no se confunde con desconocido y una negación explícita elimina un rol antiguo',()=>{
 for(const value of [0,'0'])assert.equal(followerStatus({user:{followInfo:{followStatus:value}}}),false);
 assert.equal(followerStatus({}),null);assert.equal(followerStatus({user:{isSubscriber:true}}),null);
 assert.equal(eligible({follower:false,roles:['follower']},{audience:'follower'}),false);
 assert.equal(eligible({follower:null,roles:[]},{audience:'follower'}),false);
 assert.equal(eligible({follower:true,roles:[]},{audience:'follower'}),true);
 assert.equal(eligible({userIdentity:{isFollowerOfAnchor:false},follower:true,roles:['follower']},{audience:'follower'}),false);
});
test('el punto no salta el filtro y la decisión TTS es síncrona sin peticiones de red',()=>{
 const p=new TtsPolicy(),s={enabled:true,audience:'follower',prefix:'.',cooldown:0};
 for(const text of ['.hola','hola','.!play música','./puntos'])assert.equal(p.text({type:'comment',user:'x',name:'X',follower:false,text},s),null);
 const value=p.text({type:'comment',user:'x',name:'YAEL',follower:true,text:'.hola'},s);assert.equal(typeof value,'string');assert.equal(value,'yael: hola');
});
test('normaliza nombres decorativos sin alterar nombre visible, acentos ni idioma',()=>{
 for(const [name,expected]of [['𝓨𝓐𝓔𝓛𝓘𝓣𝓞_07 😊','yaelito 07'],['ＹＡＥＬ_725','yael 725'],['ʏᴀᴇʟ','yael'],['JOSÉ ☀️','josé'],['MARÍA-JOSÉ','maría josé'],['用户','用户'],['😊✨','usuario']])assert.equal(speechName(name),expected);
 const e={type:'comment',user:'1',name:'𝓨𝓐𝓔𝓛',text:'.Hola',follower:true};assert.equal(new TtsPolicy().text(e,{enabled:true,prefix:'.',cooldown:0}),'yael: Hola');assert.equal(e.name,'𝓨𝓐𝓔𝓛');
});
test('tres acciones por follow y regalo no exigen likes; un fallo no bloquea las otras',async t=>{
 const s=await setup(t),out=[];for(const trigger of ['follow','gift'])s.save('rules',validateRule({name:trigger,trigger,likeThreshold:NaN,actions:[{type:'sound',sound:'witi-001.wav'},{type:'tts',text:'Hola {user}'},{type:'tts',text:'Otra acción'}]},[]));
 const engine=new Engine(s,async(a,e)=>{out.push([a.type,e.type]);if(a.type==='sound')throw Error('Audio faltante');});
 for(const type of ['follow','gift']){const results=await engine.receive({id:type,type,user:'a',name:'Ana',gift:'5655'});assert.equal(results.length,3);assert.equal(results[0].status,'error');}
 assert.deepEqual(out.map(x=>x[0]),['sound','tts','tts','sound','tts','tts']);
 assert.equal(s.list('rules')[0].likeThreshold,undefined);
});
test('hitos de likes simulados y reales no comparten contadores ni cooldown',async t=>{
 const s=await setup(t),out=[];s.save('rules',validateRule({name:'mil',trigger:'like',likeThreshold:1000,actions:[{type:'tts'}]},[]));const e=new Engine(s,async(a,v)=>out.push(v.simulated?'test':'live'));
 for(const [id,count,simulated]of [['real1',900,false],['test1',900,true],['real2',100,false],['test2',100,true]])await e.receive({id,type:'like',user:'a',count,simulated});assert.deepEqual(out,['live','test']);
});
test('simulador mantiene puntos y estadísticas reales aislados, prueba seguidores y muestra regalos del catálogo',async t=>{
 const store=await setup(t),community=new Community(store);store.set('pointSettings',{enabled:true,initialPoints:50});store.set('ttsSettings',{enabled:true,audience:'follower',prefix:'.',cooldown:0});store.credit('a','Ana',100,'seed');
 const audio=[],events=[],engine=new Engine(store,async()=>{}),sim=new Simulation({store,engine,ttsPolicy:new TtsPolicy(),speech:text=>audio.push(text),command:async()=>{},server:{refresh(){},previewAll(d){events.push(d.event)}},hub:()=>({ingest(){}})});
 await sim.send({type:'comment',name:'𝓨𝓐𝓔𝓛',user:'a',text:'.Hola',follower:true});await sim.send({type:'comment',user:'a',text:'.No leer',follower:false});await sim.send({type:'comment',user:'a',text:'.Tampoco',follower:null});
 assert.deepEqual(audio,['yael: Hola']);await sim.send({type:'like',user:'a',count:2000});const gift=require('../assets/gifts/catalog.json').gifts[0];await sim.send({type:'gift',gift:gift.id,count:3});
 assert.equal(sim.snapshot().likes,2000);assert.equal(sim.snapshot().gifts,3);assert.equal(events.at(-1).coins,gift.coins*3);assert.equal(store.snapshot().users[0].balance,100);assert.equal(store.snapshot().ledger.length,1);assert.equal(store.get('liveState'),undefined);
 sim.reset();assert.equal(sim.active,false);assert.throws(()=>buildSimulationEvent({type:'like',count:-1}),/Cantidad/);assert.throws(()=>buildSimulationEvent({type:'gift',gift:'inventado'}),/catálogo/);
});
test('cada 5 segundos se reintenta offline y desconectar cancela; conectado no agenda nuevos intentos',async t=>{
 let dials=0;const r=new TikTokReader({event:()=>{},status:()=>{},store:{set(){}},eventTypes:{nativeRoomDiscovery:true},connectionFactory:()=>{const c=new EventEmitter();c.connect=async()=>{dials++;throw Error('HostNotOnlineError')};c.disconnect=()=>{};return c;}});t.after(()=>r.disconnect());
 const before=Date.now();await r.connect('witimc').catch(()=>{});assert.equal(dials,1);assert.ok(r.state.nextRetryAt-before>=4900&&r.state.nextRetryAt-Date.now()<=5000);assert.ok(r.retry);r.disconnect();assert.equal(r.retry,null);assert.equal(r.active,false);
 const c=new EventEmitter();c.connect=async()=>({roomId:'12345678'});c.disconnect=()=>{};r.connectionFactory=()=>c;await r.connect('witimc');assert.equal(r.state.connected,true);assert.equal(r.retry,null);
});
