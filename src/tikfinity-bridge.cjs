'use strict';
const {normalize,finalGift}=require('./tiktok.cjs');
// TikFinity's documented Event API is local to its Windows app.
class TikfinityBridge{
 constructor({event,status,socketFactory=url=>new WebSocket(url)}){Object.assign(this,{event,status,socketFactory});this.generation=0;this.state={connected:false,bridgeConnected:false,phase:'idle',status:'Desconectado',source:'TikFinity Event API'};}
 change(s){this.state={...this.state,...s};this.status(this.state);}
 connect(){this.disconnect();this.active=true;this.attempt=0;this.dial(this.generation);return this.state;}
 dial(g){if(!this.active||g!==this.generation)return;this.change({connected:false,bridgeConnected:false,phase:'connecting',status:'Conectando con TikFinity local (21213)…'});const socket=this.socketFactory('ws://127.0.0.1:21213/');this.socket=socket;const current=()=>this.active&&this.generation===g&&this.socket===socket;
  socket.addEventListener('open',()=>{if(!current())return;this.attempt=0;this.change({bridgeConnected:true,phase:'waiting',status:'TikFinity local abierto. Esperando un evento del LIVE.',errorCode:''});});
  socket.addEventListener('message',message=>{if(!current())return;let packet;try{packet=JSON.parse(String(message.data));}catch{return;}
   const types={chat:'comment',gift:'gift',follow:'follow',share:'share',like:'like',subscribe:'subscription',subNotify:'subscription'};const type=types[packet.event],d=packet.data||{};
   if(packet.event==='disconnected'||packet.event==='streamEnd'){this.change({connected:false,liveDetected:false,phase:'waiting',status:'TikFinity informa que el LIVE está desconectado'});return;}
   if(!type||type==='gift'&&!finalGift(d))return;
   const e=normalize(type,d);this.change({connected:true,liveDetected:true,bridgeConnected:true,phase:'connected',status:'Recibiendo eventos LIVE desde TikFinity',lastEventAt:Date.now()});Promise.resolve(this.event(e)).catch(()=>{});
  });
  socket.addEventListener('error',()=>{if(current())this.change({errorCode:'LOCAL_API',status:'No se pudo abrir la Event API. Abre TikFinity para Windows, conecta tu LIVE y habilita la Event API.'});});
  socket.addEventListener('close',()=>{if(!current())return;const delay=Math.min(30000,2000*2**Math.min(4,this.attempt++));this.change({connected:false,bridgeConnected:false,phase:'waiting',status:'TikFinity local desconectado. Reintentando…',nextRetryAt:Date.now()+delay});this.retry=setTimeout(()=>this.dial(g),delay);this.retry.unref?.();});
 }
 disconnect(){this.active=false;this.generation++;clearTimeout(this.retry);const s=this.socket;this.socket=null;try{s?.close();}catch{}this.change({connected:false,bridgeConnected:false,liveDetected:false,phase:'idle',status:'Desconectado',nextRetryAt:null});}
}
module.exports={TikfinityBridge};
