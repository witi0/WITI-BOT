'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Store,Engine}=require('../src/core.cjs'),{LiveState}=require('../src/live-state.cjs'),{rememberRequest,reconcile,musicState}=require('../src/music-requests.cjs'),{JSDOM}=require('jsdom');
const memory=()=>{const data={};return {get:k=>data[k],set:(k,v)=>data[k]=structuredClone(v)};};
test('1000 rosas ejecutan solo su regla; regalo distinto usa fallback; regla desactivada no silencia',async()=>{
 let rules=[{id:'any',enabled:true,trigger:'gift',actions:[{type:'sound',sound:'general'}]},{id:'rose',enabled:true,trigger:'gift',match:'Rosa',actions:[{type:'sound',sound:'rosa'}]}],output=[];
 const engine=new Engine({list:()=>rules,log:()=>{}},async(a,e,c)=>output.push([a.sound,c.repeats]));
 for(let i=0;i<1000;i++)await engine.receive({id:String(i),user:'a',type:'gift',gift:'1',giftName:'Rose',giftDisplayName:'Rosa',count:1});
 assert.equal(output.length,1000);assert.ok(output.every(x=>x[0]==='rosa'&&x[1]===1));
 await engine.receive({id:'other',user:'a',type:'gift',gift:'2',giftName:'Lion',count:1});assert.equal(output.at(-1)[0],'general');
 rules[1].enabled=false;await engine.receive({id:'disabled',user:'a',type:'gift',gift:'1',giftDisplayName:'Rosa',count:1});assert.equal(output.at(-1)[0],'general');
 rules[1].enabled=true;rules[1].match='1';await engine.receive({id:'streak',user:'a',type:'gift',gift:'1',count:1000});assert.deepEqual(output.at(-1),['rosa',1000]);
});
test('nueva sala reinicia; misma sala sobrevive a caída y reinicio; datos antiguos sin sala se migran',()=>{
 const store=memory();store.set('liveState',{coins:20});let live=new LiveState(store);assert.equal(live.snapshot().coins,0);
 assert.equal(live.connectSession({connected:true,roomId:'111',username:'witi'}),true);live.apply({type:'gift',user:'a',coins:20,gift:'1',count:1});const id=live.snapshot().sessionId;live.close();
 live=new LiveState(store);assert.equal(live.connectSession({connected:true,roomId:'111'}),false);assert.equal(live.snapshot().coins,20);assert.equal(live.snapshot().sessionId,id);
 assert.equal(live.connectSession({connected:false}),false);assert.equal(live.connectSession({connected:true,roomId:'222'}),true);assert.equal(live.snapshot().coins,0);assert.deepEqual(live.snapshot().topgifters,[]);
 live.apply({type:'like',user:'a',count:5});live.connectSession({liveStatus:'offline'});assert.equal(live.connectSession({connected:true,roomId:'222'}),true);assert.equal(live.snapshot().likes,0);live.close();
});
test('solicitudes FIFO preceden a Spotify y atribución permanece en canción actual; admite repetidas',()=>{
 const s=memory(),a={uri:'a',name:'Uno'},b={uri:'b',name:'Dos'},automatic={uri:'auto',name:'Automática'};
 reconcile(s,{uri:'auto',progress:15000});rememberRequest(s,a,{name:'Ana',avatar:'https://example.com/ana.jpg'});rememberRequest(s,b,{name:'Beto'});rememberRequest(s,a,{name:'Carla'});
 let m=musicState(s,{spotifyQueue:[automatic,a,b]});assert.deepEqual(m.queue.map(x=>x.requestedBy),['Ana','Beto','Carla']);
 m=reconcile(s,{uri:'a',progress:0});assert.equal(m.requestedBy,'Ana');assert.equal(m.requestedByAvatar,'https://example.com/ana.jpg');assert.equal(reconcile(s,{uri:'a',progress:20000}).requestedBy,'Ana');
 m=musicState(s,m);assert.deepEqual(m.queue.map(x=>x.requestedBy),['Beto','Carla']);assert.equal(reconcile(s,{uri:'b',progress:0}).requestedBy,'Beto');assert.equal(reconcile(s,{uri:'a',progress:0}).requestedBy,'Carla');assert.equal(s.get('spotifyRequests').length,0);
});
test('los tres estilos mantienen exactamente N puestos; datos reales reemplazan ejemplos sin HTML',async t=>{
 let source;const dom=new JSDOM('<div id="demoBadge"></div><div id="stage"><div id="main"></div><canvas id="fx"></canvas><div id="actions"></div></div>',{runScripts:'dangerously',url:'http://127.0.0.1/overlay/x?token=x',beforeParse(w){w.EventSource=class{constructor(){source=this;}close(){}};w.HTMLCanvasElement.prototype.getContext=()=>({});}});t.after(()=>dom.window.close());
 dom.window.eval(fs.readFileSync(path.join(__dirname,'../renderer/widget.js'),'utf8'));const d=dom.window.document;
 for(const mode of ['minimal','witi','pro'])for(const kind of ['toplikes','topgifters','ranking']){
  source.onmessage({data:JSON.stringify({type:'config',overlay:{id:'x',kind,overlayMode:mode,top:3,width:800,height:500},toplikes:[],topgifters:[],users:[]})});assert.equal(d.querySelectorAll('.rank-row').length,3);assert.equal(d.documentElement.dataset.mode,mode);assert.match(d.querySelector('#main').textContent,/USUARIO EJEMPLO 3/);assert.doesNotMatch(d.querySelector('#main').textContent,/USUARIO EJEMPLO 4/);
  source.onmessage({data:JSON.stringify({type:'state',toplikes:[{user:'a',name:'<img src=x>',likes:25}],topgifters:[{user:'a',name:'<img src=x>',coins:20}],users:[{id:'a',name:'<img src=x>',balance:15}]})});assert.equal(d.querySelectorAll('.rank-row').length,3);assert.equal(d.querySelector('.rank-name').textContent,'<img src=x>');assert.doesNotMatch(d.querySelector('#main').textContent,/USUARIO EJEMPLO 1/);assert.equal(d.querySelector('img[src=x]'),null);
 }
});
test('top de puntos consulta ganancias de sesión y conserva saldo histórico',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'witi52-')),s=await Store.open(dir);const {startOverlayServer}=require('../src/overlay.cjs');s.credit('old','Ayer',100,'old');s.db.run("UPDATE ledger SET created='2000-01-01T00:00:00.000Z'");s.credit('new','Hoy',25,'new');const start=Date.now()-10000,srv=await startOverlayServer(s,dir,{port:0,state:()=>({sessionStartedAt:start})}),abort=new AbortController();
 t.after(()=>{abort.abort();srv.close();s.db.close();fs.rmSync(dir,{recursive:true,force:true});});const url=new URL(srv.url(s.list('overlays')[0].id));url.pathname=url.pathname.replace('/overlay/','/events/');const res=await fetch(url,{signal:abort.signal}),text=new TextDecoder().decode((await res.body.getReader().read()).value),data=JSON.parse(text.split('data: ')[1]);assert.deepEqual(data.users.map(x=>[x.name,x.balance]),[['Hoy',25]]);assert.equal(s.all('SELECT balance FROM users WHERE id=?',['old'])[0].balance,100);
});
