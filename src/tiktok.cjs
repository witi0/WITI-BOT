const crypto=require('node:crypto');const {EventQueue}=require('./event-queue.cjs');
function normalize(type,d){const u=d.user||d;const gift=d.giftDetails||d.extendedGiftInfo||d.gift||{};const count=Math.max(1,Number(d.repeatCount||d.giftCount)||1);const id=String(d.common?.msgId||d.msgId||d.eventId||crypto.randomUUID());return {id:'tiktok:'+type+':'+id,type,user:String(u.userId||u.id||u.uniqueId||'desconocido'),name:String(u.nickname||u.uniqueId||'Espectador'),avatar:u.profilePicture?.url?.[0]||u.profilePicture?.urlList?.[0]||u.profilePictureUrl||'',text:String(d.comment||''),gift:String(d.giftId||gift.id||''),giftName:String(d.giftName||gift.name||'Regalo'),giftImage:(()=>{const u=gift.image?.urlList?.[0]||gift.image?.url_list?.[0]||gift.imageUrl||'';return typeof u==='string'&&/^https:\/\//.test(u)?u:'';})(),count:type==='like'?Number(d.likeCount)||1:count,coins:(Number(d.diamondCount||gift.diamondCount||gift.diamond_count)||0)*count,simulated:false,at:Date.now()};}
function finalGift(d){const type=Number(d.giftType||d.giftDetails?.giftType||d.extendedGiftInfo?.giftType);return type!==1||d.repeatEnd===true||d.repeatEnd===1||d.repeatEnd==='true';}
function cleanUsername(input){
 const raw=String(input||'').normalize('NFKC').trim();
 if(/^https?:\/\//i.test(raw)||/^(?:www\.|m\.)?tiktok\.com\//i.test(raw)){
  try{const u=new URL(/^https?:\/\//i.test(raw)?raw:'https://'+raw);if(!['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(u.hostname.toLowerCase()))return '';return decodeURIComponent(u.pathname).match(/^\/@([A-Za-z0-9._]+)(?:\/live)?\/?$/i)?.[1]||'';}catch{return '';}
 }
 return raw.replace(/^[@＠]/,'');
}
function cleanRoomId(value){const room=String(value||'').trim();if(room&&!/^\d{6,25}$/.test(room))throw Error('El ID de sala debe contener solo dígitos. Puedes dejarlo vacío.');return room;}
function errorText(err,secrets=[]){
 const seen=new Set(),parts=[];function visit(e,depth=0){if(!e||depth>4||seen.has(e))return;if(typeof e==='string'){parts.push(e);return;}seen.add(e);for(const field of ['name','message','code','statusCode','reason'])if(e[field])parts.push(String(e[field]));for(const k of ['cause','exception','error'])visit(e[k],depth+1);for(const child of Array.isArray(e.errors)?e.errors:[])visit(child,depth+1);}visit(err);
 let text=parts.join(' · ').replace(/\bBearer\s+[^\s,;"']+/ig,'Bearer [REDACTADO]').replace(/((?:sessionid|sessionid_ss|api[-_]?key|signApiKey|token|secret|authorization|cookie)["']?\s*[:=]\s*["']?)[^\s&,;"']+/ig,'$1[REDACTADO]');for(const secret of secrets.filter(Boolean))text=text.replaceAll(String(secret),'[REDACTADO]').replaceAll(encodeURIComponent(String(secret)),'[REDACTADO]');return text.slice(0,900);
}
function classifyError(err,username,secrets=[]){
 const raw=errorText(err,secrets),msg=raw.toLowerCase(),who='@'+username;
 const serverDelay=Number(err?.retryAfter)||Number(err?.response?.headers?.['retry-after'])*1000||0;
 const result=(code,message,extra={})=>({code,message,technical:raw||'Error sin detalle',retryAfterMs:Number.isFinite(serverDelay)?Math.max(0,Math.min(86400000,serverDelay)):0,...extra});
 if(/429|rate.?limit|too many requests|signature.*limit/.test(msg))return result('LIMIT','El proveedor limitó las conexiones. Se respetará su tiempo de espera.');
 if(/401|premiumfeature|missing.?tokens|invalid.?api.?key|api.?key.*(?:required|invalid|missing)|unauthori[sz]ed/.test(msg))return result('AUTH','El proveedor solicita autorización o una clave válida. Agrégala en la configuración avanzada.',{requiresAuthorization:true});
 if(/useroffline|offline|isn.t online|not.?live|livestream ended/.test(msg))return result('OFFLINE',`TikTok no confirma un LIVE activo para ${who}. Se volverá a comprobar.`);
 if(/invaliduniqueid|invalid.?user|user_not_found|user.*not.?found/.test(msg))return result('ACCOUNT',`No se reconoce ${who}. Usa el @ de la cuenta, no el nombre que aparece en pantalla.`);
 if(/timeout|timedout|enotfound|econnreset|network|socket hang up|connect_timeout/.test(msg))return result('NETWORK','La consulta o conexión tardó demasiado. Se reintentará sin bloquear la aplicación.');
 if(/403|captcha|challenge|access.?denied|forbidden/.test(msg))return result('ACCESS','TikTok o el proveedor rechazó el acceso. Esto no demuestra que el LIVE esté apagado.');
 if(/signature|euler|handshake|websocket|signapi/.test(msg))return result('HANDSHAKE','Se encontró un problema al abrir el chat LIVE. Revisa el diagnóstico del proveedor.');
 return result('CONNECTION',`No se pudo completar la conexión al LIVE de ${who}. Se reintentará.`);
}
function bounded(task,ms,signal){return new Promise((resolve,reject)=>{let timer;const stop=()=>{const e=Error('Conexión cancelada');e.code='CANCELLED';finish(reject,e);};const finish=(fn,value)=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);fn(value);};if(signal?.aborted){stop();return;}signal?.addEventListener('abort',stop,{once:true});timer=setTimeout(()=>{const e=Error('CONNECT_TIMEOUT');e.code='CONNECT_TIMEOUT';finish(reject,e);},ms);Promise.resolve().then(task).then(v=>finish(resolve,v),e=>finish(reject,e));});}
class TikTokReader{
 constructor({event,status,secretGet,store,connectionFactory,eventTypes,timeoutMs=25000,probeTimeoutMs=5000}){
  Object.assign(this,{event,status,secretGet,store,connectionFactory,eventTypes,timeoutMs,probeTimeoutMs});this.queue=new EventQueue(event,{onError:()=>this.change({status:'No se pudo procesar un evento LIVE'})});this.connection=null;this.active=false;this.attempt=0;this.generation=0;this.retry=null;this.inFlight=null;this.abort=null;
  this.state={status:'Desconectado',phase:'idle',connected:false,liveDetected:false,liveStatus:'unknown',writeAvailable:false,source:'tiktok-live-connector (no oficial)',lastError:'',errorCode:'',nextRetryAt:null,requiresAuthorization:false};
 }
 change(data){this.state={...this.state,...data};this.status({...this.state});}
 async connect(raw,room=''){
  const username=cleanUsername(raw),roomId=cleanRoomId(room);if(!/^[A-Za-z0-9._]{2,40}$/.test(username))throw Error('Escribe tu @usuario exacto o una URL tiktok.com/@usuario/live.');
  this.disconnect();this.active=true;this.username=username;this.manualRoomId=roomId;this.attempt=0;this.store.set('tiktokUsername',username);return this.dial(this.generation,true);
 }
 async probe(c,signal){
  const checks=[];
  if(typeof c.fetchIsLive==='function')checks.push(bounded(()=>c.fetchIsLive(this.username),this.probeTimeoutMs,signal).then(v=>typeof v==='boolean'?v:null).catch(()=>null));
  if(c.roomId&&typeof c.fetchRoomInfo==='function')checks.push(bounded(()=>c.fetchRoomInfo(c.roomId),this.probeTimeoutMs,signal).then(info=>{const status=Number(info?.data?.status??info?.status);return status===2?true:status===4?false:null;}).catch(()=>null));
  const results=await Promise.all(checks);return results.includes(true)?true:results.includes(false)?false:null;
 }
 dial(g,foreground=false){if(!this.active||g!==this.generation)return Promise.resolve(this.state);if(this.inFlight)return this.inFlight;const pending=this.run(g,foreground);this.inFlight=pending;pending.finally(()=>{if(this.inFlight===pending)this.inFlight=null;}).catch(()=>{});return pending;}
 async run(g,foreground){
  const sdk=this.eventTypes||require('tiktok-live-connector'),{WebcastEvent={},ControlEvent={}}=sdk,apiKey=this.secretGet('euler')||undefined;let lastError,roomId=this.manualRoomId||'';
  this.abort=new AbortController();const signal=this.abort.signal;
  for(let strategy=0;strategy<2;strategy++){
   if(!this.active||g!==this.generation)return this.state;
   const opts={signApiKey:apiKey,processInitialData:false,fetchRoomInfoOnConnect:false,enableExtendedGiftInfo:false,webClientOptions:{timeout:{request:10000},retry:{limit:0}},wsClientOptions:{handshakeTimeout:10000}};
   if(!this.connectionFactory&&sdk.SignConfig)sdk.SignConfig.apiKey=apiKey;
   let c;try{c=this.connectionFactory?this.connectionFactory(this.username,opts):new sdk.TikTokLiveConnection(this.username,opts);}catch(e){const err=classifyError(e,this.username,[apiKey]);this.change({phase:'waiting',connected:false,status:err.message,errorCode:err.code,lastError:err.technical,requiresAuthorization:!!err.requiresAuthorization});this.schedule(g);if(foreground)throw Error(err.message);return this.state;}this.connection=c;
   this.change({status:(strategy?'Reintentando la resolución del LIVE de @':'Buscando el LIVE de @')+this.username+'…',phase:'connecting',username:this.username,connected:false,liveDetected:false,liveStatus:'unknown',errorCode:'',lastError:'',nextRetryAt:null,requiresAuthorization:false});
   const current=()=>this.connection===c&&this.active&&g===this.generation;
   const on=(kind,type)=>{if(kind)c.on(kind,d=>{if(!current()||type==='gift'&&!finalGift(d))return;this.state.lastEventAt=Date.now();this.queue.enqueue(normalize(type,d));});};
   for(const [kind,type]of [[WebcastEvent.CHAT,'comment'],[WebcastEvent.GIFT,'gift'],[WebcastEvent.FOLLOW,'follow'],[WebcastEvent.SHARE,'share'],[WebcastEvent.LIKE,'like'],[WebcastEvent.SUBSCRIBE,'subscription']])on(kind,type);
   if(WebcastEvent.ROOM_USER)c.on(WebcastEvent.ROOM_USER,d=>{if(current())this.queue.enqueue({id:crypto.randomUUID(),type:'viewers',user:'system',viewers:Number(d.viewerCount||d.roomUserCount)||0,at:Date.now()});});
   c.on(ControlEvent.ERROR||'error',e=>{if(!current())return;const d=classifyError(e,this.username,[apiKey]);this.change({errorCode:d.code,lastError:d.technical});});
   c.on(ControlEvent.DISCONNECTED||'disconnected',()=>{if(!current()||this.state.phase!=='connected')return;this.change({status:'Se perdió la conexión del chat; se reintentará.',phase:'waiting',connected:false,liveDetected:false,liveStatus:'unknown'});this.schedule(g);});
   try{
    const attempt=Promise.resolve().then(()=>{if(!current())throw Object.assign(Error('cancelled'),{code:'CANCELLED'});return c.connect(roomId||undefined);});attempt.then(()=>{if(!current())Promise.resolve(c.disconnect()).catch(()=>{});},()=>{});
    const result=await bounded(()=>attempt,this.timeoutMs,signal);if(!current()){await Promise.resolve(c.disconnect()).catch(()=>{});return this.state;}
    clearTimeout(this.retry);this.retry=null;this.attempt=0;this.change({status:'LIVE conectado · @'+this.username,phase:'connected',connected:true,liveDetected:true,liveStatus:'online',roomId:String(result?.roomId||c.roomId||''),nextRetryAt:null,errorCode:'',lastError:'',requiresAuthorization:false});return this.state;
   }catch(e){
    if(!current()||e.code==='CANCELLED')return this.state;lastError=classifyError(e,this.username,[apiKey]);roomId=String(c.roomId||roomId||'');
    if(strategy===0&&!roomId&&['OFFLINE','CONNECTION'].includes(lastError.code)){this.connection=null;await Promise.resolve(c.disconnect()).catch(()=>{});continue;}
    this.change({phase:'checking',status:'Comprobando el estado del LIVE…',roomId});const live=await this.probe(c,signal);if(!current())return this.state;
    if(live===true&&lastError.code==='OFFLINE')lastError={...lastError,code:'ROOM_LOOKUP',message:'El directo está activo, pero falló la apertura de su chat.'};
    this.change({phase:lastError.requiresAuthorization?'authorization':'waiting',connected:false,liveDetected:live===true,liveStatus:live===true?'online':live===false?'offline':'unknown',status:(live===true?'LIVE detectado; el chat no conectó. ':live===false?'No hay un LIVE confirmado. ':'Estado del LIVE sin confirmar. ')+lastError.message,errorCode:lastError.code,lastError:lastError.technical,requiresAuthorization:!!lastError.requiresAuthorization,retryAfterMs:lastError.retryAfterMs});
    this.connection=null;await Promise.resolve(c.disconnect()).catch(()=>{});if(!this.active||g!==this.generation)return this.state;this.schedule(g);if(foreground)throw Error(this.state.status);return this.state;
   }
  }
  return this.state;
 }
 schedule(g){
  if(!this.active||g!==this.generation||this.retry||this.state.requiresAuthorization||this.state.errorCode==='ACCOUNT')return;
  const minimum=this.state.errorCode==='OFFLINE'||this.state.errorCode==='LIMIT'?30000:Math.min(60000,3000*2**Math.min(5,this.attempt++));const delay=Math.max(minimum,Number(this.state.retryAfterMs)||0);this.change({nextRetryAt:Date.now()+delay});this.retry=setTimeout(()=>{this.retry=null;if(this.active&&g===this.generation)this.dial(g).catch(()=>{});},delay);this.retry.unref?.();
 }
 async gifts(){if(!this.connection||!this.state.connected)throw Error('Conecta primero un LIVE');const data=await bounded(()=>this.connection.fetchAvailableGifts(),10000,this.abort?.signal);const list=Array.isArray(data)?data:data?.gifts||data?.data?.gifts||[];return list.map(g=>({id:String(g.id),name:g.name||g.giftName||'Regalo',coins:Number(g.diamond_count||g.diamondCount)||0,image:g.image?.urlList?.[0]||g.image?.url_list?.[0]||''}));}
 disconnect(){this.active=false;this.generation++;this.abort?.abort();clearTimeout(this.retry);this.retry=null;this.inFlight=null;const c=this.connection;this.connection=null;if(c)try{Promise.resolve(c.disconnect()).catch(()=>{});}catch{}this.change({status:'Desconectado',phase:'idle',connected:false,liveDetected:false,liveStatus:'unknown',roomId:'',errorCode:'',lastError:'',nextRetryAt:null,requiresAuthorization:false});}
}
module.exports={TikTokReader,normalize,finalGift,cleanUsername,cleanRoomId,classifyError,errorText,bounded};
