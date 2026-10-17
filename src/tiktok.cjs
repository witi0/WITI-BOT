const crypto=require('node:crypto');const {EventQueue}=require('./event-queue.cjs');
function normalize(type,d){const u=d.user||d;const gift=d.giftDetails||d.extendedGiftInfo||d.gift||{};const count=Math.max(1,Number(d.repeatCount||d.giftCount)||1);const id=String(d.common?.msgId||d.msgId||d.eventId||crypto.randomUUID());return {id:'tiktok:'+type+':'+id,type,user:String(u.userId||u.id||u.uniqueId||'desconocido'),name:String(u.nickname||u.uniqueId||'Espectador'),avatar:u.profilePicture?.url?.[0]||u.profilePicture?.urlList?.[0]||u.profilePictureUrl||'',text:String(d.comment||''),gift:String(d.giftId||gift.id||''),giftName:String(d.giftName||gift.name||'Regalo'),giftImage:(()=>{const u=gift.image?.urlList?.[0]||gift.image?.url_list?.[0]||gift.imageUrl||'';return typeof u==='string'&&/^https:\/\//.test(u)?u:'';})(),count:type==='like'?Number(d.likeCount)||1:count,coins:(Number(d.diamondCount||gift.diamondCount||gift.diamond_count)||0)*count,simulated:false,at:Date.now()};}
function finalGift(d){const type=Number(d.giftType||d.giftDetails?.giftType||d.extendedGiftInfo?.giftType);return type!==1||d.repeatEnd===true||d.repeatEnd===1||d.repeatEnd==='true';}
function cleanUsername(input){
 const raw=String(input||'').trim();
 const fromUrl=raw.match(/(?:https?:\/\/)?(?:www\.|m\.)?tiktok\.com\/@([A-Za-z0-9._]+)/i);
 return String(fromUrl?.[1]||raw).replace(/^@/,'').replace(/\/(?:live)?(?:[?#].*)?$/i,'').trim();
}
function classifyError(err,username){
 const raw=[err?.name,err?.message,err?.cause?.message].filter(Boolean).join(' · ').replace(/(sessionid|apiKey|signApiKey|token|secret)([=: ]+)[^\s&]+/ig,'$1$2[REDACTADO]').slice(0,450);
 const msg=raw.toLowerCase(),who='@'+username;
 if(/offline|not.?live|useroffline|livestream ended/.test(msg))return {code:'OFFLINE',message:`TikTok reportó que ${who} no está transmitiendo. Si sí estás en LIVE, podría ser un error temporal de TikTok.`,technical:raw};
 if(/not.?found|invalid.?user|404|user_not_found/.test(msg))return {code:'ACCOUNT',message:`TikTok no encontró ${who}. Revisa el @ exacto.`,technical:raw};
 if(/429|rate.?limit|too many requests/.test(msg))return {code:'LIMIT',message:'TikTok limitó las consultas. Se reintentará automáticamente.',technical:raw};
 if(/401|403|signature|euler|handshake|websocket|sign/i.test(msg))return {code:'HANDSHAKE',message:'No se completó la conexión al chat LIVE (firma o WebSocket). Se reintentará automáticamente.',technical:raw};
 if(/timeout|etimedout|enotfound|econnreset|network|socket hang up/i.test(msg))return {code:'NETWORK',message:'No se puede contactar el servicio de TikTok. Revisa la red; se reintentará.',technical:raw};
 return {code:'CONNECTION',message:`No se pudo abrir el chat LIVE de ${who}. Se reintentará automáticamente.`,technical:raw||'Error desconocido'};
}
class TikTokReader{
 constructor({event,status,secretGet,store,connectionFactory,eventTypes}){
  Object.assign(this,{event,status,secretGet,store,connectionFactory,eventTypes});this.queue=new EventQueue(event,{onError:()=>this.change({status:'Error al procesar un evento LIVE'})});
  this.connection=null;this.active=false;this.attempt=0;this.generation=0;this.retry=null;
  this.state={status:'Desconectado',connected:false,liveDetected:false,writeAvailable:false,source:'tiktok-live-connector (no oficial)',lastError:'',errorCode:'',nextRetryAt:null};
 }
 change(data){this.state={...this.state,...data};this.status({...this.state});}
 async connect(raw){
  const username=cleanUsername(raw);
  if(!/^[A-Za-z0-9._]{2,40}$/.test(username))throw Error('Escribe tu @usuario de TikTok o pega una URL tiktok.com/@usuario/live.');
  this.disconnect();this.active=true;this.username=username;this.attempt=0;this.store.set('tiktokUsername',username);
  return this.dial(++this.generation,true);
 }
 async probe(c){
  if(typeof c.fetchIsLive!=='function')return null;
  let timer;try{return await Promise.race([Promise.resolve().then(()=>c.fetchIsLive(this.username)).then(Boolean),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('probe timeout')),6500);})]);}
  catch{return null;}finally{clearTimeout(timer);}
 }
 async dial(generation,foreground=false,fallback=false,roomId=''){
  if(!this.active||generation!==this.generation)return this.state;
  const events=this.eventTypes||require('tiktok-live-connector');
  const {TikTokLiveConnection,WebcastEvent={},ControlEvent={}}=events;
  const apiKey=this.secretGet('euler')||undefined;
  const opts={...(apiKey?{signApiKey:apiKey}:{}),processInitialData:true,fetchRoomInfoOnConnect:!fallback,enableExtendedGiftInfo:!fallback};
  const c=this.connectionFactory?this.connectionFactory(this.username,opts):new TikTokLiveConnection(this.username,opts);
  const previous=this.connection;this.connection=c;if(previous&&previous!==c)try{Promise.resolve(previous.disconnect()).catch(()=>{});}catch{}
  this.change({status:`Buscando el LIVE de @${this.username}…`,username:this.username,connected:false,liveDetected:false,lastError:'',errorCode:'',nextRetryAt:null});
  const on=(kind,type)=>{if(!kind)return;c.on(kind,d=>{if(this.connection!==c||!this.active||generation!==this.generation)return;if(type==='gift'&&!finalGift(d))return;this.queue.enqueue(normalize(type,d));});};
  for(const [kind,type]of [[WebcastEvent.CHAT,'comment'],[WebcastEvent.GIFT,'gift'],[WebcastEvent.FOLLOW,'follow'],[WebcastEvent.SHARE,'share'],[WebcastEvent.LIKE,'like'],[WebcastEvent.SUBSCRIBE,'subscription']])on(kind,type);
  if(WebcastEvent.ROOM_USER)c.on(WebcastEvent.ROOM_USER,d=>{if(this.connection===c&&this.active)this.queue.enqueue({id:crypto.randomUUID(),type:'viewers',user:'system',viewers:Number(d.viewerCount||d.roomUserCount)||0,at:Date.now()});});
  c.on(ControlEvent.ERROR||'error',e=>{if(this.connection!==c)return;const details=classifyError(e,this.username);this.change({lastError:details.technical,errorCode:details.code,...(!this.state.connected?{status:details.message}:{})});});
  c.on(ControlEvent.DISCONNECTED||'disconnected',()=>{if(this.connection!==c||generation!==this.generation||!this.active)return;this.change({status:'El chat LIVE se desconectó; reconectando…',connected:false});this.schedule(generation);});
  try{
   const r=await c.connect(roomId||undefined);if(generation!==this.generation||!this.active||this.connection!==c){try{await c.disconnect();}catch{}return this.state;}
   clearTimeout(this.retry);this.retry=null;this.attempt=0;
   this.change({status:`LIVE conectado · @${this.username}`,connected:true,liveDetected:true,roomId:String(r?.roomId||c.roomId||''),username:this.username,lastError:'',errorCode:'',nextRetryAt:null});return this.state;
  }catch(e){
   if(generation!==this.generation||!this.active||this.connection!==c)return this.state;
   const err=classifyError(e,this.username);
   if(!fallback&&err.code!=='LIMIT'&&err.code!=='ACCOUNT'){
    const directRoomId=String(c.roomId||'');
    this.change({status:`Probando conexión alternativa al chat de @${this.username}…`,connected:false});
    return this.dial(generation,foreground,true,directRoomId);
   }
   // The probe is diagnostic only: a LIVE being online is not proof the chat WebSocket is connected.
   this.change({status:'Verificando si el LIVE sigue activo…',connected:false,errorCode:err.code,lastError:err.technical});
   const live=await this.probe(c);
   if(generation!==this.generation||!this.active||this.connection!==c)return this.state;
   this.change({connected:false,liveDetected:live===true,status:live===true?`LIVE detectado en @${this.username}, pero el chat no conectó. ${err.message}`:live===false?`TikTok no confirma un LIVE activo para @${this.username}. ${err.message}`:err.message,errorCode:err.code,lastError:err.technical,roomId:String(c.roomId||'')});
   this.schedule(generation);
   if(foreground)throw Error(this.state.status+(err.technical?' · Detalle: '+err.technical:''));
   return this.state;
  }
 }
 schedule(g){
  if(!this.active||g!==this.generation||this.retry)return;
  const delay=this.state.errorCode==='OFFLINE'?30000:Math.min(60000,3000*2**Math.min(5,this.attempt++));
  this.change({nextRetryAt:Date.now()+delay});
  this.retry=setTimeout(()=>{this.retry=null;if(this.active&&g===this.generation)this.dial(g).catch(e=>{this.change({lastError:String(e?.message||e).slice(0,450)});this.schedule(g);});},delay);
  this.retry.unref?.();
 }
 async gifts(){if(!this.connection||!this.state.connected)throw Error('Conecta primero un LIVE');const data=await this.connection.fetchAvailableGifts();const list=Array.isArray(data)?data:data?.gifts||[];return list.map(g=>({id:String(g.id),name:g.name||g.giftName||'Regalo',coins:Number(g.diamond_count||g.diamondCount)||0,image:g.image?.urlList?.[0]||g.image?.url_list?.[0]||''}));}
 disconnect(){this.active=false;this.generation++;clearTimeout(this.retry);this.retry=null;const c=this.connection;this.connection=null;if(c)try{Promise.resolve(c.disconnect()).catch(()=>{});}catch{}this.change({status:'Desconectado',connected:false,liveDetected:false,errorCode:'',lastError:'',nextRetryAt:null,roomId:''});}
}

module.exports={TikTokReader,normalize,finalGift,cleanUsername,classifyError};
