const {app,BrowserWindow,ipcMain,dialog,safeStorage,shell,clipboard}=require('electron');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {installBundledMedia,audioPayload}=require('./bundled-media.cjs');
const {Store,Engine,validateRule}=require('./core.cjs');const {startOverlayServer}=require('./overlay.cjs');
const {OBSWebSocket}=require('obs-websocket-js');const {catalog,fromTemplate,installGallery,validateOverlay,pickPrize}=require('./gallery.cjs');
const {LiveState,demoState}=require('./live-state.cjs');const {Spotify}=require('./spotify.cjs');const {TikTokReader}=require('./tiktok.cjs');const {TikTokLogin}=require('./tiktok-login.cjs');const {Updates}=require('./updates.cjs');
const release=require('../release.json');const {mergedCatalog}=require('./gifts.cjs');const {normalizeAppearance}=require('./appearance.cjs');const {VOICES,synthesize}=require('./voices.cjs');
let win,store,server,engine,mediaDir,liveState,spotify,tiktok,identity,updates,obs=new OBSWebSocket(),obsConnected=false,liveLock=false,activeObs=false;const seenLive=new Set();let autoUpdate;
app.setName('WITI BOT');if(!app.requestSingleInstanceLock())app.quit();app.on('second-instance',()=>{win?.show();win?.focus();});
function notify(channel,data){if(win&&!win.isDestroyed())win.webContents.send(channel,data);}
function secretSet(key,value){if(!safeStorage.isEncryptionAvailable())throw Error('El almacén seguro de Windows no está disponible');store.set('secret:'+key,safeStorage.encryptString(value).toString('base64'));}
function secretGet(key){const s=store.get('secret:'+key);if(!s)return '';if(!safeStorage.isEncryptionAvailable())throw Error('El almacén seguro de Windows no está disponible');return safeStorage.decryptString(Buffer.from(s,'base64'));}
function locked(){return liveLock||!!tiktok?.state.connected;}
function musicState(){const m=liveState?.music||{},own=store.get('songQueue')||[];return {...m,queue:own.length?own:(m.spotifyQueue||[]),queueSource:own.length?'WITI BOT':'Spotify'};}
function stateNow(){return {...liveState.snapshot(),music:musicState()};}
function soundList(){const meta=store.get('soundMetadata')||{};return (store.get('importedSounds')||[]).map(s=>({...s,...meta[s.id],url:server.asset(s.file),builtin:false}));}
function snapshot(){return {...store.snapshot(),liveState:stateNow(),catalog,urls:Object.fromEntries(store.list('overlays').map(o=>[o.id,server.url(o.id)])),previewUrls:Object.fromEntries(store.list('overlays').map(o=>[o.id,server.url(o.id,true)])),version:app.getVersion(),obsConnected,live:locked(),update:updates.state,appearance:normalizeAppearance(store.get('appearance')||{}),shortcuts:store.get('shortcuts')||{},profile:store.get('profile')||{},spotify:spotify.status,tiktok:tiktok.state,identity:identity.status,spotifyClientId:store.get('spotifyClientId')||release.spotifyClientId||'',tiktokClientKey:store.get('tiktokClientKey')||'',tiktokUsername:store.get('tiktokUsername')||'',soundCount:soundList().length,pointSettings:store.get('pointSettings')||{enabled:false,perCoin:1,perFollow:5},songQueue:store.get('songQueue')||[],ttsSettings:store.get('ttsSettings')||{enabled:false,prefix:'.',readName:true}};}
async function runAction(a,e){
 const text=(a.text||'{user}').replaceAll('{user}',e.name||e.user).replaceAll('{text}',e.text||'');
 if(['alert','media','sound'].includes(a.type)){const n=server.emit(a.overlay,{type:'action',text,...audioPayload(a),name:e.name,avatar:e.avatar,simulated:!!e.simulated});if(!n)throw Error('Abre la fuente de esta pantalla en OBS o en la vista previa');return {status:'despachada a la fuente; reproducción no confirmada'};}
 if(a.type==='timer'){if(e.simulated)throw Error('Temporizador real omitido en simulación');store.changeTimer('add',a.value);}
 if(a.type==='tts'){notify('speak',{text,simulated:!!e.simulated});return {status:'despachada al motor TTS; reproducción no confirmada'};}
 if(a.type==='obsScene'){if(e.simulated)throw Error('OBS real omitido en simulación');if(!obsConnected)throw Error('OBS desconectado');await obs.call('SetCurrentProgramScene',{sceneName:a.text});}
 if(a.type==='wheel'){const o=store.list('overlays').find(o=>o.id===a.overlay);if(!o)throw Error('Elige la pantalla de ruleta');const winner=pickPrize(o.prizes);server.emit(o.id,{type:'wheel',winner,spinning:true});store.log({event:'wheel',user:e.user,simulated:!!e.simulated,results:[{action:'wheel',status:winner}]});}
}
async function receive(e){
 if(seenLive.has(e.id))return;seenLive.add(e.id);if(seenLive.size>15000)seenLive.delete(seenLive.values().next().value);
 liveState.apply(e);server.broadcast({type:'live',event:e});notify('live-event',e);
 if(e.type==='viewers')return;
 const ps=store.get('pointSettings');if(ps?.enabled&&!e.simulated){const amount=Math.floor(e.type==='gift'?e.coins*ps.perCoin:e.type==='follow'?ps.perFollow:0);if(amount>0)store.credit(e.user,e.name,amount,'auto:'+e.id);}
 await engine.receive(e);
 if(e.type==='comment'&&e.text.startsWith('!')){const command={...e,id:e.id+':command',type:'command'};await engine.receive(command);await commandHandler(command);}
 const t=store.get('ttsSettings');if(e.type==='comment'&&t?.enabled&&e.text.startsWith(t.prefix||'.')){const text=e.text.slice((t.prefix||'.').length).replace(/https?:\/\/\S+/g,'').slice(0,300);if(text.trim())notify('speak',{text:(t.readName?e.name+': ':'')+text,simulated:false});}
}
async function commandHandler(e){const [cmd,...args]=e.text.trim().split(/\s+/);let text;
 try{if(cmd==='!puntos'){const u=store.all('SELECT balance FROM users WHERE id=?',[e.user])[0];text=`${e.name}, tienes ${u?.balance||0} puntos`;}
 else if(cmd==='!play'){if(!spotify.status.connected)throw Error('Spotify no está conectado');const found=await spotify.search(args.join(' '));if(!found[0])throw Error('No encontré esa canción');const queue=store.get('songQueue')||[];if(queue.filter(s=>s.user===e.user).length>=3)throw Error('Ya tienes tres solicitudes pendientes');if(queue.some(s=>s.uri===found[0].uri))throw Error('La canción ya está en la cola');queue.push({...found[0],requestId:crypto.randomUUID(),user:e.user,requestedBy:e.name});store.set('songQueue',queue);text=`${e.name}, añadí ${found[0].name} a solicitudes WITI BOT`;}
 else if(cmd==='!revocar'){let q=store.get('songQueue')||[];const i=q.findIndex(s=>s.user===e.user);if(i<0)throw Error('No tienes solicitudes pendientes');q.splice(i,1);store.set('songQueue',q);text=`${e.name}, retiré tu solicitud pendiente`;}
 else return;
 }catch(err){text=err.message;}
 // This is an overlay response. It is never labeled as a TikTok chat send.
 for(const o of store.list('overlays').filter(o=>o.kind==='actions').slice(0,1))server.emit(o.id,{type:'action',text,name:e.name,avatar:e.avatar});store.log({event:'command-response',user:e.user,simulated:false,results:[{action:'overlay',status:'Respuesta preparada para overlay; no enviada al chat TikTok',message:text}]});
}
function handle(name,fn){ipcMain.handle(name,async(event,...args)=>{if(event.sender!==win?.webContents||!event.senderFrame?.url.startsWith('file://'))throw Error('Origen no autorizado');try{return {ok:true,value:await fn(...args)};}catch(e){return {ok:false,error:e.message};}});}
app.whenReady().then(async()=>{
 const dir=app.getPath('userData');mediaDir=path.join(dir,'media');fs.mkdirSync(mediaDir,{recursive:true});store=await Store.open(dir);if(!store.get('v2SoundMigration')){for(const rule of store.list('rules'))if(rule.actions?.some(a=>a.type==='sound'&&/^witi-\d{3}\.wav$/.test(a.sound||'')))store.save('rules',{...rule,enabled:false});store.set('v2SoundMigration',true);}installBundledMedia(store,mediaDir);if(!store.get('copperThemeV1')){const a=store.get('appearance')||{};store.set('appearance',normalizeAppearance({...a,accent:(!a.accent||a.accent==='#9c70ff')?'#f2a66f':a.accent}));store.set('copperThemeV1',true);}installGallery(store);liveState=new LiveState(store);
 server=await startOverlayServer(store,mediaDir,{state:stateNow});engine=new Engine(store,runAction);
 updates=new Updates({config:release,version:app.getVersion(),dir:path.join(dir,'updates'),change:s=>notify('update',s)});
 spotify=new Spotify({store,secretGet,secretSet,open:u=>shell.openExternal(u),change:(s,m)=>{if(m)liveState.music=m;notify('connection',{kind:'spotify',state:s});}});
 tiktok=new TikTokReader({store,secretGet,event:receive,status:s=>notify('connection',{kind:'tiktok',state:s})});
 identity=new TikTokLogin({store,secretGet,secretSet,open:u=>shell.openExternal(u),change:s=>notify('connection',{kind:'identity',state:s})});
 handle('open-service',async id=>{const urls={spotify:'https://developer.spotify.com/dashboard',tiktok:'https://developers.tiktok.com/apps/',euler:'https://www.eulerstream.com/',soundinstants:'https://soundinstants.com/',github:'https://github.com/new?name=WITI-BOT'};if(!urls[id])throw Error('Servicio desconocido');await shell.openExternal(urls[id]);});
 handle('snapshot',snapshot);handle('profile',p=>{if(!p||typeof p.name!=='string'||p.name.length>100)throw Error('Perfil inválido');store.set('profile',{name:p.name});});
 handle('save-rule',r=>store.save('rules',validateRule(r,store.list('overlays').map(o=>o.id))));handle('delete-rule',id=>store.remove('rules',id));
 handle('save-overlay',o=>{const saved=store.save('overlays',validateOverlay(o));server.refresh();return saved;});
 handle('create-template',id=>{const o=fromTemplate(id);store.save('overlays',o);server.refresh();return o;});
 handle('duplicate-overlay',id=>{const o=store.list('overlays').find(o=>o.id===id);if(!o)throw Error('Pantalla no encontrada');return store.save('overlays',{...o,id:crypto.randomUUID(),name:o.name+' · Copia'});});
 handle('delete-overlay',id=>{if(store.list('rules').some(r=>r.actions.some(a=>a.overlay===id)))throw Error('Esta pantalla se usa en una regla; cambia la regla primero');store.remove('overlays',id);});
 handle('export-overlay',async id=>{const o=store.list('overlays').find(o=>o.id===id);if(!o)throw Error('Pantalla no encontrada');const r=await dialog.showSaveDialog(win,{defaultPath:'WITI_Overlay.json'});if(!r.canceled)fs.writeFileSync(r.filePath,JSON.stringify({...o,id:undefined},null,2));});
 handle('import-overlay',async()=>{const r=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Overlay JSON',extensions:['json']}]});if(r.canceled)return;const f=r.filePaths[0];if(fs.statSync(f).size>100000)throw Error('Archivo demasiado grande');const o=validateOverlay({...JSON.parse(fs.readFileSync(f,'utf8')),id:crypto.randomUUID()});store.save('overlays',o);return o;});
 handle('copy-overlay',id=>{if(!store.list('overlays').some(o=>o.id===id))throw Error('Pantalla desconocida');clipboard.writeText(server.url(id));});
 handle('simulate',async e=>{if(!e||!['follow','share','gift','like','comment','command','manual','subscription'].includes(e.type))throw Error('Evento inválido');const event={id:crypto.randomUUID(),type:e.type,user:'usuario-prueba',name:'Usuario de prueba',avatar:'',text:String(e.text||'').slice(0,500),gift:String(e.gift||'').slice(0,100),count:Number(e.count)||10,coins:Number(e.coins)||50,simulated:true};server.broadcast({type:'live',event});return engine.receive(event);});
 handle('preview-overlay',id=>{const o=store.list('overlays').find(x=>x.id===id);if(!o)throw Error('Overlay no encontrado');server.emit(id,{type:'demo',state:demoState()});if(o.kind==='actions')server.emit(id,{type:'action',name:'Witi · Prueba',text:'Gracias por apoyar el directo',simulated:true});});
 handle('open-overlay',async(id,preview=false)=>{if(!store.list('overlays').some(x=>x.id===id))throw Error('Overlay no encontrado');await shell.openExternal(server.url(id,!!preview));});
 handle('credit',d=>store.credit(String(d.user||'').slice(0,100),String(d.user||'').slice(0,100),d.amount,'manual:'+crypto.randomUUID()));handle('timer',(op,value)=>store.changeTimer(op,value));
 async function importFiles(multiple=false,audio=false){const r=await dialog.showOpenDialog(win,{properties:multiple?['openFile','multiSelections']:['openFile'],filters:[{name:audio?'Audios':'Multimedia',extensions:audio?['wav','mp3','ogg']:['png','jpg','jpeg','webp','gif','mp4','webm','mp3','wav','ogg']}]});if(r.canceled)return multiple?[]:null;const list=[];for(const file of r.filePaths.slice(0,500)){if(fs.statSync(file).size>100*1024*1024)throw Error('Máximo 100 MB por archivo');const ext=path.extname(file).toLowerCase();if(!/^\.(png|jpe?g|webp|gif|mp4|webm|mp3|wav|ogg)$/.test(ext))throw Error('Formato inválido');const buf=fs.readFileSync(file),id=crypto.createHash('sha256').update(buf).digest('hex')+ext;fs.writeFileSync(path.join(mediaDir,id),buf);list.push({id,name:path.basename(file),file:id,category:'Importados',origin:'Importación del usuario',license:'Responsabilidad y permisos del usuario'});}if(audio){const existing=store.get('importedSounds')||[];for(const item of list)if(!existing.some(s=>s.id===item.id))existing.push(item);store.set('importedSounds',existing);}return multiple?list:list[0];}
 handle('media-import',()=>importFiles());handle('audio-import',()=>importFiles(true,true));handle('sound-list',soundList);
 // An older local installation can contain a user's own MP3/WAV/OGG collection.
 // Folder selection is explicit. Never traverse symlinks or read unrelated formats.
 handle('audio-import-folder',async()=>{
   const picked=await dialog.showOpenDialog(win,{properties:['openDirectory'],title:'Seleccionar biblioteca de sonidos de WITI BOT anterior'});
   if(picked.canceled)return [];
   const files=[],folders=[{dir:picked.filePaths[0],depth:0}];
   while(folders.length&&files.length<500){
     const {dir,depth}=folders.shift();
     for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
       const full=path.join(dir,entry.name);if(entry.isSymbolicLink())continue;
       if(entry.isDirectory()&&depth<5){folders.push({dir:full,depth:depth+1});continue;}
       if(entry.isFile()&&/\.(mp3|wav|ogg)$/i.test(entry.name)&&fs.statSync(full).size<=100*1024*1024)files.push(full);
       if(files.length>=500)break;
     }
   }
   const owned=store.get('importedSounds')||[],added=[];
   for(const file of files){const ext=path.extname(file).toLowerCase(),bytes=fs.readFileSync(file),id=crypto.createHash('sha256').update(bytes).digest('hex')+ext;
     if(owned.some(s=>s.id===id))continue;
     fs.writeFileSync(path.join(mediaDir,id),bytes);
     const clip={id,name:path.basename(file,ext),file:id,category:'Recuperados de WITI BOT',origin:'Biblioteca anterior seleccionada por el usuario',license:'Permisos del usuario'};
     owned.push(clip);added.push(clip);
   }
   store.set('importedSounds',owned);return added;
 });
 handle('sound-metadata',d=>{if(!d||typeof d.id!=='string'||!soundList().some(x=>x.id===d.id))throw Error('Audio desconocido');const meta=store.get('soundMetadata')||{};meta[d.id]={favorite:!!d.favorite,...(d.name?{name:String(d.name).trim().slice(0,90)}:{}),...(d.category?{category:String(d.category).trim().slice(0,50)}:{})};store.set('soundMetadata',meta);return meta[d.id];});
 handle('sound-delete',id=>{const owned=(store.get('importedSounds')||[]);const index=owned.findIndex(s=>s.id===id);if(index<0)throw Error('Solo se pueden eliminar sonidos importados');const item=owned[index];if(store.list('rules').some(r=>r.actions.some(a=>a.media===item.file||a.sound===item.file)))throw Error('Este sonido está en una regla: cambia esa regla antes de eliminarlo');owned.splice(index,1);store.set('importedSounds',owned);const meta=store.get('soundMetadata')||{};delete meta[id];store.set('soundMetadata',meta);if(!(owned.some(s=>s.file===item.file)))try{fs.unlinkSync(path.join(mediaDir,item.file));}catch{}return true;});
 handle('voice-list',()=>VOICES);
 handle('voice-synthesize',options=>synthesize(options));
 handle('obs-connect',async d=>{if(d.password)secretSet('obs',d.password);try{await obs.disconnect();}catch{}await obs.connect('ws://127.0.0.1:4455',d.password||secretGet('obs'));obsConnected=true;return obs.call('GetSceneList');});
 obs.on('ConnectionClosed',()=>{obsConnected=false;notify('obs-disconnected',{});});handle('obs-scenes',async()=>{if(!obsConnected)throw Error('OBS desconectado');return obs.call('GetSceneList');});handle('obs-scene',async s=>{if(!obsConnected)throw Error('OBS desconectado');return obs.call('SetCurrentProgramScene',{sceneName:s});});
 handle('obs-add-overlay',async d=>{if(!obsConnected)throw Error('Conecta OBS primero');const o=store.list('overlays').find(x=>x.id===d.id);if(!o)throw Error('Pantalla desconocida');const scene=await obs.call('GetCurrentProgramScene');const r=await dialog.showMessageBox(win,{buttons:['Cancelar','Añadir a OBS'],defaultId:0,cancelId:0,message:`¿Crear la fuente «${o.name}» en la escena «${scene.currentProgramSceneName}»?`});if(r.response!==1)return;const name='WITI · '+o.name+' · '+o.id.slice(0,4);await obs.call('CreateInput',{sceneName:scene.currentProgramSceneName,inputName:name,inputKind:'browser_source',inputSettings:{url:server.url(o.id),width:o.width||800,height:o.height||450,shutdown:false},sceneItemEnabled:true});const result=await obs.call('GetInputSettings',{inputName:name});if(result.inputSettings.url!==server.url(o.id))throw Error('OBS no confirmó la URL de la fuente');return name;});
 handle('spotify-login',id=>spotify.connect(id));handle('spotify-logout',()=>spotify.logout());handle('spotify-control',op=>spotify.playback(op));handle('spotify-search',q=>spotify.search(q));
 handle('song-add',song=>{if(!song||!/^spotify:track:[a-zA-Z\d]{22}$/.test(song.uri||''))throw Error('Canción inválida');const q=store.get('songQueue')||[];if(q.some(s=>s.uri===song.uri))throw Error('La canción ya está en solicitudes');q.push({id:String(song.id),uri:song.uri,name:String(song.name).slice(0,200),artist:String(song.artist).slice(0,200),requestId:crypto.randomUUID(),user:'owner',requestedBy:'Creador'});store.set('songQueue',q);});
 handle('song-remove',id=>store.set('songQueue',(store.get('songQueue')||[]).filter(s=>s.requestId!==id)));
 handle('song-send',async id=>{const q=store.get('songQueue')||[],song=q.find(s=>s.requestId===id);if(!song)throw Error('Solicitud no encontrada');await spotify.enqueue(song.uri);store.set('songQueue',q.filter(s=>s.requestId!==id));return 'Spotify confirmó la incorporación a su cola';});
 handle('gift-import-images',async()=>{const selected=await dialog.showOpenDialog(win,{properties:['openDirectory'],title:'Importar imágenes de regalos'});if(selected.canceled)return 0;const dir=selected.filePaths[0];const expected=new Set(require('../assets/gifts/catalog.json').gifts.map(g=>g.imageFile));const images=store.get('giftImageFiles')||{};let count=0;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(!entry.isFile()||!expected.has(entry.name))continue;const file=path.join(dir,entry.name);if(fs.statSync(file).size>1048576)continue;const bytes=fs.readFileSync(file);if(bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP')continue;const name=crypto.createHash('sha256').update(bytes).digest('hex')+'.webp';const target=path.join(mediaDir,name);if(!fs.existsSync(target))fs.writeFileSync(target,bytes);images[entry.name]=name;count++;}store.set('giftImageFiles',images);return count;});
 handle('appearance-set',a=>{const appearance=normalizeAppearance(a);store.set('appearance',appearance);return appearance;});
 handle('shortcuts-set',data=>{const allowed=new Set(['overlays','rules','sounds','gifts','connections','tts','stop']);if(!data||typeof data!=='object'||Object.keys(data).some(k=>!allowed.has(k)))throw Error('Atajos no válidos');const used=new Set();const clean={};for(const [key,value]of Object.entries(data)){const code=String(value).toUpperCase().replace(/\s/g,'');if(!/^(CTRL\+)?(ALT\+)?(SHIFT\+)?[A-Z0-9]$/.test(code)||used.has(code))throw Error('Combinación de teclas duplicada o no válida');used.add(code);clean[key]=code;}store.set('shortcuts',clean);return clean;});
 handle('tiktok-connect',async d=>{if(d.apiKey)secretSet('euler',d.apiKey);return tiktok.connect(d.username);});handle('tiktok-disconnect',()=>tiktok.disconnect());handle('gift-catalog',async()=>{let online=[];if(tiktok.state.connected){try{online=await tiktok.gifts();}catch{}}const files=store.get('giftImageFiles')||{};const urls=Object.fromEntries(Object.entries(files).map(([name,id])=>[name,server.asset(id)]));return mergedCatalog(online,urls);});
 handle('tiktok-login',d=>identity.connect(d.clientKey,d.clientSecret));handle('tiktok-logout',()=>identity.logout());
 handle('point-settings',d=>{if(!Number.isFinite(d.perCoin)||!Number.isFinite(d.perFollow)||d.perCoin<0||d.perCoin>10000||d.perFollow<0||d.perFollow>100000)throw Error('Valores de puntos inválidos');store.set('pointSettings',{enabled:!!d.enabled,perCoin:d.perCoin,perFollow:d.perFollow});});
 handle('tts-settings',d=>{if(typeof d.prefix!=='string'||d.prefix.length>10)throw Error('Prefijo inválido');if(!['local','online'].includes(d.engine||'local'))throw Error('Motor de voz desconocido');if(d.voice&&typeof d.voice!=='string')throw Error('Voz inválida');store.set('ttsSettings',{enabled:!!d.enabled,prefix:d.prefix,readName:!!d.readName,engine:d.engine||'local',voice:d.voice||'',rate:Math.min(2,Math.max(0.5,Number(d.rate)||1)),pitch:Math.min(2,Math.max(0,Number(d.pitch)??1)),random:!!d.random});});
 handle('reset-live',async()=>{const r=await dialog.showMessageBox(win,{buttons:['Cancelar','Reiniciar estadísticas'],defaultId:0,cancelId:0,message:'¿Reiniciar contadores, rankings de likes/regalos y votos? Tus puntos y transacciones se conservan.'});if(r.response===1)liveState.reset();});
 handle('wheel-spin',async id=>{const o=store.list('overlays').find(x=>x.id===id&&x.kind==='wheel');if(!o)throw Error('Elige una ruleta');const winner=pickPrize(o.prizes);server.emit(id,{type:'wheel',winner,spinning:true});store.log({event:'wheel',user:'owner',results:[{action:'manual',status:winner}]});return winner;});
 handle('live-lock',v=>{liveLock=!!v;return locked();});handle('stop',()=>{notify('stop',{});server.broadcast({type:'stop'});});
 handle('backup',async()=>{const r=await dialog.showSaveDialog(win,{defaultPath:'WITI_BOT_Backup.sqlite'});if(!r.canceled){store.flush();fs.copyFileSync(store.file,r.filePath);return 'Copia SQLite guardada. Copia también la carpeta media para conservar tus recursos.';}});
 handle('export-logs',async()=>{const r=await dialog.showSaveDialog(win,{defaultPath:'WITI_BOT_Diagnostico.json'});if(!r.canceled)fs.writeFileSync(r.filePath,JSON.stringify({version:app.getVersion(),platform:process.platform,logs:store.snapshot().logs},null,2));});
 handle('update-check',()=>updates.check());handle('update-download',()=>updates.download());
 handle('update-install',async()=>{if(locked())throw Error('Termina el LIVE y desactiva el bloqueo antes de actualizar');const file=updates.verifiedInstaller();const r=await dialog.showMessageBox(win,{type:'question',buttons:['Cancelar','Actualizar y cerrar WITI BOT'],defaultId:0,cancelId:0,message:'La firma del manifiesto y el SHA-256 del instalador fueron verificados. ¿Guardar copia de datos y abrir el asistente de actualización?'});if(r.response!==1)return;store.backup();const p=spawn(file,[],{detached:true,stdio:'ignore',shell:false});p.once('error',()=>notify('update',{status:'Windows no pudo abrir el instalador'}));p.once('spawn',()=>{p.unref();app.quit();});});
 win=new BrowserWindow({width:1480,height:980,minWidth:1050,minHeight:720,title:'WITI BOT',backgroundColor:'#101817',icon:path.join(__dirname,'../build/icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.session.setPermissionRequestHandler((wc,p,cb)=>cb(false));
 await win.loadFile(path.join(__dirname,'../renderer/index.html'));spotify.restore();identity.restore();
 autoUpdate=setTimeout(()=>updates.check().catch(()=>{}),5000);autoUpdate.unref();const period=setInterval(()=>updates.check().catch(()=>{}),6*3600000);period.unref();
}).catch(e=>{dialog.showErrorBox('WITI BOT no pudo iniciar',e.message);app.quit();});
app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>{clearTimeout(autoUpdate);spotify?.close();identity?.close();tiktok?.disconnect();liveState?.close();server?.close();try{store?.flush();}catch{}});
