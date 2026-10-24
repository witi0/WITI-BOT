'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {EventEmitter}=require('node:events'),{createRequire}=require('node:module');
const {Store}=require('../src/core.cjs'),{normalizePoints}=require('../src/community.cjs');
const {startOverlayServer}=require('../src/overlay.cjs');
const {JSDOM,VirtualConsole}=require('jsdom');
async function until(predicate){for(let i=0;i<150;i++){if(predicate())return;await new Promise(r=>setTimeout(r,10));}assert.ok(predicate(),'el flujo debe terminar');}
test('ajustes de puntos antiguos se recuperan; nuevas cantidades inválidas se rechazan',()=>{
 for(const input of [null,[],{perCoin:'roto',likesPerPoint:0,perFollow:-3}]){
  const p=normalizePoints(input);assert.equal(p.perCoin,1);assert.equal(p.likesPerPoint,100);assert.equal(p.perFollow,5);
 }
 assert.throws(()=>normalizePoints({perCoin:'roto'},{strict:true}),/puntos/);
 assert.equal(normalizePoints({perComment:4},{strict:true}).perComment,4);
});
test('puerto ocupado: abre overlays en otro puerto y lo conserva al reiniciar',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'witi-port-')),store=await Store.open(dir);
 const blocker=http.createServer();await new Promise(r=>blocker.listen(0,'127.0.0.1',r));
 const occupied=blocker.address().port;store.set('overlayPort',occupied);
 let server; t.after(async()=>{await server?.close();await new Promise(r=>blocker.close(r));store.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 server=await startOverlayServer(store,dir);const selected=store.get('overlayPort');assert.notEqual(selected,occupied);
 const id=store.list('overlays')[0].id,url=server.url(id);assert.equal((await fetch(url)).status,200);
 await server.close();server=await startOverlayServer(store,dir);assert.equal(server.url(id),url);
});
test('main + preload + interfaz + SQLite + HTTP: audio espera al escritorio y el chat acredita y reproduce',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'witi-runtime-')),store=await Store.open(dir);
 store.set('pointSettings',{enabled:true,perComment:4,commentCooldown:0,initialPoints:0,perCoin:'legacy'});
 store.set('ttsSettings',{enabled:true,engine:'online',voice:'es_mx_002',prefix:'.',readName:false,cooldown:0});
 // A previous session left a manual TTS job pending before the renderer loaded.
 const {PlaybackQueue}=require('../src/playback.cjs');new PlaybackQueue(store).enqueue({id:'restored',overlay:'__tts__',payload:{text:'Restaurado',tts:true}});
 const main=path.resolve(__dirname,'../src/main.cjs'),requireReal=createRequire(main),handlers=new Map(),fatal=[],errors=[],timers=[],clients=[],spoken=[];
 let win,server,dom,readyCalls=0;
 const app=new EventEmitter();Object.assign(app,{setName(){},requestSingleInstanceLock:()=>true,whenReady:()=>Promise.resolve(),getPath:()=>dir,getVersion:()=> '5.3.9',quit(){}});
 const ipc=new EventEmitter();ipc.invoke=async(name,...args)=>handlers.get(name)({sender:win.webContents,senderFrame:{url:'file://witi/renderer/index.html'}},...args);
 class Window{
  constructor(options){win=this;this.options=options;this.webContents=new EventEmitter();Object.assign(this.webContents,{send:(name,data)=>ipc.emit(name,{},data),setWindowOpenHandler(){},isLoading:()=>false,session:{setPermissionRequestHandler(){}}});}
  isDestroyed(){return false;}removeMenu(){}setMenuBarVisibility(){}setAutoHideMenuBar(){}
  async loadFile(file){
   assert.equal(server.playback.active.size,0,'ningún audio se entrega antes del registro de listeners');
   const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
   dom=await JSDOM.fromFile(file,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:console,beforeParse(w){
    const preloadRequire=name=>{assert.equal(name,'electron');return{ipcRenderer:ipc,contextBridge:{exposeInMainWorld:(key,value)=>w[key]=value}};};
    vm.runInNewContext(fs.readFileSync(path.join(path.dirname(main),'preload.cjs'),'utf8'),{require:preloadRequire});
    w.structuredClone=structuredClone;w.speechSynthesis={getVoices:()=>[],cancel(){},resume(){},speak(){},pause(){}};
    w.Audio=class{constructor(){this.paused=true;}play(){this.paused=false;setImmediate(()=>this.onended?.());return Promise.resolve();}pause(){this.paused=true;}};
   }});
   await new Promise(r=>dom.window.addEventListener('load',r));this.webContents.emit('did-finish-load');
  }
 }
 const fakeRequire=name=>{
  if(name==='electron')return{app,BrowserWindow:Window,ipcMain:{handle:(key,fn)=>handlers.set(key,async(...a)=>{if(key==='desktop-ready')readyCalls++;return fn(...a);})},dialog:{showErrorBox:(_,message)=>fatal.push(message)},safeStorage:{isEncryptionAvailable:()=>true},shell:{},clipboard:{writeText(){}},Menu:{setApplicationMenu(){}}};
  if(name==='./core.cjs')return{...requireReal(name),Store:{open:async()=>store}};
  if(name==='./overlay.cjs')return{startOverlayServer:async(s,d,o)=>server=await startOverlayServer(s,d,{...o,port:0})};
  if(name==='./tiktok.cjs')return{TikTokReader:class extends requireReal(name).TikTokReader{constructor(o){super({...o,connectionFactory:()=>{const c=new EventEmitter();c.connect=async()=>({roomId:'123456789123456789'});c.disconnect=()=>{};clients.push(c);return c;}});}}};
  if(name==='./tiktok-profile.cjs')return{...requireReal(name),resolvePublicProfile:async()=>({avatar:'',displayName:'Witi'})};
  if(name==='./voices.cjs')return{...requireReal(name),synthesize:async({text})=>{spoken.push(text);return{mime:'audio/mpeg',data:Buffer.alloc(300).toString('base64')};}};
  if(name==='./bundled-media.cjs')return{...requireReal(name),installBundledMedia(){}};
  if(name==='./spotify.cjs')return{Spotify:class{constructor(){this.status={connected:false};}restore(){}close(){}}};
  if(name==='./tiktok-login.cjs')return{TikTokLogin:class{constructor(){this.status={};}restore(){}close(){}}};
  if(name==='./updates.cjs')return{Updates:class{constructor(){this.state={status:'idle'};}async check(){}}};
  return requireReal(name);
 };
 t.after(async()=>{dom?.window.close();app.emit('before-quit');for(const [clear,id]of timers)clear(id);await server?.close();store.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 vm.runInNewContext(fs.readFileSync(main,'utf8'),{require:fakeRequire,__dirname:path.dirname(main),process,Buffer,console,setTimeout:(...a)=>{const id=setTimeout(...a);timers.push([clearTimeout,id]);return id;},clearTimeout,setInterval:(...a)=>{const id=setInterval(...a);timers.push([clearInterval,id]);return id;},clearInterval});
 await until(()=>readyCalls>0||fatal.length);assert.deepEqual(fatal,[]);assert.deepEqual(errors,[]);
 assert.equal(win.options.webPreferences.backgroundThrottling,false);
 await until(()=>store.all("SELECT state FROM playback_jobs WHERE id='restored'")[0]?.state==='done');
 const call=(...a)=>dom.window.witi.call(...a);
 assert.equal((await call('snapshot')).pointSettings.perCoin,1);
 await call('tiktok-connect',{username:'witimc'});
 clients.at(-1).emit('chat',{common:{msgId:'live1'},user:{id:'u1',nickname:'Ana'},content:'.Hola real'});
 await until(()=>store.all("SELECT balance FROM users WHERE id='u1'")[0]?.balance===4);
 await until(()=>store.all("SELECT state FROM playback_jobs WHERE id='tiktok:comment:live1:tts'")[0]?.state==='done');
 assert.ok(spoken.includes('Hola real'));
 await assert.rejects(call('point-settings',{perFollow:-1}),/puntos/);
 // The actual preload must pass profile notifications, not silently discard them.
 win.webContents.send('profile-updated',{name:'Witi reparado',tiktokUsername:'witimc'});
 assert.equal(dom.window.document.querySelector('#workspaceTitle').textContent,'Witi reparado');
 assert.deepEqual(errors,[]);
});
