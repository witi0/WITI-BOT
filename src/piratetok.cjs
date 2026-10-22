'use strict';
const {EventEmitter}=require('node:events');
// Import the ESM package lazily: Electron's main process is CommonJS.
const loadPirateTok=()=>import('piratetok-live-js');
const WebcastEvent={CHAT:'chat',GIFT:'gift',FOLLOW:'follow',SHARE:'share',LIKE:'like',SUB_NOTIFY:'subNotify',ROOM_USER:'roomUserSeq',TREASURE_BOX:'treasureBox',TREASURE_BOX_OPEN:'treasureBoxOpen',MEMBER_JOIN:'memberJoin',STREAM_END:'liveEnded'};
const ControlEvent={ERROR:'error',DISCONNECTED:'disconnected'};
class TikTokLiveConnection extends EventEmitter{
 constructor(username,{loader=loadPirateTok}={}){super();this.username=username;this.loader=loader;this.cancelled=false;this.client=null;this.roomId='';this.startedAt=0;this.ended=false;}
 async connect(){
  this.startedAt=Date.now();const sdk=await this.loader();if(this.cancelled)throw Object.assign(Error('Conexión cancelada'),{code:'CANCELLED'});
  const client=new sdk.TikTokLiveClient(this.username).timeout(10000).maxRetries(0).language('es').region('MX');this.client=client;
  // Reader owns reconnect/backoff. Ignore PirateTok's early "connected": it
  // means room discovery, not a completed WebSocket handshake.
  client.on('connected',()=>{if(this.cancelled)client.disconnect();});
  for(const kind of [...Object.values(WebcastEvent),'subscriptionNotify'])client.on(kind,data=>{
   if(this.cancelled||this.ended)return;
   const stamp=Number(data?.common?.createTime||0);const at=stamp<1e11?stamp*1000:stamp;
   if(at&&at<this.startedAt-2000)return;
   if(kind==='subscriptionNotify'){
    // This is a separate protocol message, not the subNotify alias.
    this.emit('subNotify',{...data,user:data?.user||data?.sender});return;
   }
   this.emit(kind,kind==='subNotify'?{...data,user:data?.user||data?.sender}:data);
  });
  client.on('error',e=>{if(!this.cancelled)this.emit('error',e);});
  client.on('disconnected',()=>{this.ended=true;if(!this.cancelled)this.emit('disconnected');});
  try{const roomId=await client.connect();if(this.ended&&!this.cancelled)throw Error('WebSocket cerrado durante la conexión');if(this.cancelled){client.disconnect();throw Object.assign(Error('Conexión cancelada'),{code:'CANCELLED'});}this.roomId=String(roomId);return {roomId:this.roomId};}
  catch(e){client.disconnect();throw e;}
 }
 async fetchIsLive(){const sdk=await this.loader();try{const room=await sdk.checkOnline(this.username,5000);this.roomId=String(room.roomId);return true;}catch(e){if(e?.name==='HostNotOnlineError')return false;throw e;}}
 disconnect(){this.cancelled=true;this.client?.disconnect();}
}
module.exports={TikTokLiveConnection,WebcastEvent,ControlEvent,nativeRoomDiscovery:true};
