'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module'),{EventEmitter}=require('node:events');
const {Store}=require('../src/core.cjs'),{TikTokReader}=require('../src/tiktok.cjs');
test('ajustes TTS heredados no bloquean snapshot, configuración OBS ni conexión por IPC real',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'witi-legacy-ipc-')),store=await Store.open(dir);store.set('tiktokUsername','witimc');store.set('ttsSettings',{enabled:true,prefix:'',allowedRoles:'legacy'});let win,connected=0;const handlers=new Map(),fatal=[],timers=[],speech=[],sounds=[],emitted=[];
 const app=new EventEmitter();Object.assign(app,{setName(){},requestSingleInstanceLock:()=>true,whenReady:()=>Promise.resolve(),getPath:()=>dir,getVersion:()=> '4.0.1',quit(){}});
 class Window{constructor(){win=this;this.webContents=new EventEmitter();Object.assign(this.webContents,{send(){},setWindowOpenHandler(){},session:{setPermissionRequestHandler(){}}});}isDestroyed(){return false;}removeMenu(){}setMenuBarVisibility(){}setAutoHideMenuBar(){}async loadFile(){} }
 const main=path.resolve(__dirname,'../src/main.cjs'),realRequire=createRequire(main);
 const connections=[];
 class Reader extends TikTokReader{constructor(options){super({...options,connectionFactory:()=>{const socket=new EventEmitter();socket.connect=async()=>{connected++;return{roomId:'123456789123456789'}};socket.disconnect=async()=>{};connections.push(socket);return socket;}});}}
 const server={playback:{cancelOverlay(){},status:()=>({}),enqueue(job){speech.push(job);},wake(){},disconnect(){}},url:id=>'http://127.0.0.1/overlay/'+id,templateUrl:id=>'http://127.0.0.1/template/'+id,ruleUrl:id=>'http://127.0.0.1/rule/'+id,asset:id=>'http://127.0.0.1/asset/'+id,refresh(){},preview(){},previewAll(){},broadcast(){},emit(id,data){emitted.push({id,...data});},close(){}};
 new (realRequire('./playback.cjs').PlaybackQueue)(store);
 const fakeRequire=name=>{
  if(name==='electron')return {app,BrowserWindow:Window,ipcMain:{handle:(key,fn)=>handlers.set(key,fn)},dialog:{showErrorBox:(_,message)=>fatal.push(message)},safeStorage:{isEncryptionAvailable:()=>true},shell:{},clipboard:{writeText(){}},Menu:{setApplicationMenu(){}}};
  if(name==='./core.cjs')return {...realRequire(name),Store:{open:async()=>store}};
  if(name==='./overlay.cjs')return {startOverlayServer:async()=>server};
  if(name==='./bundled-media.cjs')return {installBundledMedia(){},audioPayload:()=>({})};
  if(name==='./tiktok.cjs')return {TikTokReader:Reader};
  if(name==='./spotify.cjs')return {Spotify:class{constructor(){this.status={connected:false}}restore(){}close(){}}};
  if(name==='./tiktok-login.cjs')return {TikTokLogin:class{constructor(){this.status={}}restore(){}logout(){}close(){}}};
  if(name==='./updates.cjs')return {Updates:class{constructor(){this.state={}}async check(){}}};
  return realRequire(name);
 };
 const context={require:fakeRequire,module:{exports:{}},exports:{},__dirname:path.dirname(main),__filename:main,process,Buffer,console,setTimeout:(...args)=>{const id=setTimeout(...args);timers.push([clearTimeout,id]);return id;},clearTimeout,setInterval:(...args)=>{const id=setInterval(...args);timers.push([clearInterval,id]);return id;},clearInterval};
 vm.runInNewContext(fs.readFileSync(main,'utf8'),context,{filename:main});
 t.after(()=>{app.emit('before-quit');for(const [clear,id]of timers)clear(id);store.db.close();fs.rmSync(dir,{recursive:true,force:true});});
 for(let n=0;n<50&&!win;n++)await new Promise(setImmediate);
 assert.deepEqual(fatal,[]);assert.ok(win);
 const event={sender:win.webContents,senderFrame:{url:'file://witi/renderer/index.html'}};
 const call=async(name,...args)=>{const result=await handlers.get(name)(event,...args);if(!result.ok)throw Error(result.error);return result.value;};
 for(let i=0;i<50&&connected<1;i++)await new Promise(setImmediate);assert.equal(connected,1,'saved username auto-connects on startup');const snapshot=await call('snapshot');assert.equal(snapshot.ttsSettings.prefix,'.');assert.equal(snapshot.ttsSettings.allowedRoles.length,0);
 const defaults=await call('overlay-design-defaults','nowPlaying');assert.equal(defaults.musicLayout,'studio');
 const overlay=snapshot.overlays[0];await call('save-overlay',{...overlay,name:'Overlay funciona'});assert.equal((await call('snapshot')).overlays.find(o=>o.id===overlay.id).name,'Overlay funciona');
 await assert.rejects(call('tts-settings',{prefixEnabled:true,prefix:''}),/prefijo/);
 const connection=await call('tiktok-connect',{username:'@witimc'});assert.equal(connection.connected,true);assert.equal(connected,2);assert.equal((await call('tiktok-state')).connected,true);
 assert.equal((await call('snapshot')).tiktok.connected,true);
 store.credit('123','Witi',100,'command-seed');connections.at(-1).emit('chat',{common:{msgId:'chat-content-command'},content:'/puntos',user:{id:'123',nickname:'Witi'}});for(let n=0;n<50&&!store.snapshot().logs.some(l=>l.event==='command-response');n++)await new Promise(setImmediate);assert.ok(store.snapshot().logs.some(l=>l.event==='command-response'&&l.results[0].message.includes('100 puntos')));assert.ok(emitted.some(d=>d.type==='command-response'&&d.response.name==='Witi'&&d.response.text.includes('100 puntos')));
 await call('tts-settings',{enabled:true,audience:'follower',prefix:'.',cooldown:0});
 for(const [id,status]of [['following',1],['unfollowed',0],['unknown',null]]){
  connections.at(-1).emit('chat',{common:{msgId:id},content:'.Hola',user:{id:'123',nickname:'𝓨𝓐𝓔𝓛',...(status===null?{}:{followInfo:{followStatus:String(status)}})}});
  for(let n=0;n<50&&!store.snapshot().logs.some(l=>l.event==='comment'&&l.user==='123'&&new Date(l.at));n++)await new Promise(setImmediate);
  for(let n=0;n<5;n++)await new Promise(setImmediate);
 }
 assert.equal(speech.length,1);assert.equal(speech[0].payload.text,'yael: Hola');
 await call('tiktok-disconnect');assert.equal((await call('tiktok-state')).connected,false);
 await call('tts-settings',{prefixEnabled:false,prefix:'',enabled:true});assert.equal((await call('snapshot')).ttsSettings.prefixEnabled,false);
});
