'use strict';
const {EventEmitter}=require('node:events');
const ALLOWED=new Set(['comment','gift','follow','share','like','subscription','command']);
function priorityFor(event={}){
 if(event.type==='gift'){
  const coins=Math.max(0,Number(event.coins)||0);
  return coins>=1000?1:coins>=50?2:3;
 }
 if(event.type==='subscription'||event.type==='follow'||event.type==='share')return 2;
 return 3;
}
function safeEvent(e={}){
 const roles=Array.isArray(e.roles)?e.roles.filter(x=>['moderator','subscriber','topgifter'].includes(x)).slice(0,3):[];
 return {uniqueId:String(e.uniqueId||''),memberLevel:Number(e.memberLevel)||0,gifterLevel:Number(e.gifterLevel)||0,id:String(e.id||'').slice(0,150),type:ALLOWED.has(e.type)?e.type:'comment',user:String(e.user||'').slice(0,80),name:String(e.name||'Espectador').slice(0,100),avatar:/^https:\/\//.test(e.avatar||'')?e.avatar:'',text:String(e.text||'').slice(0,500),gift:String(e.gift||'').slice(0,100),giftName:String(e.giftName||'Regalo').slice(0,100),giftImage:(/^https:\/\//.test(e.giftImage||'')||/^http:\/\/127\.0\.0\.1:\d+\/media\/[a-f0-9]{64}\.webp\?token=[a-f0-9]+$/.test(e.giftImage||''))?e.giftImage:'',count:Math.min(100000,Math.max(1,Number(e.count)||1)),coins:Math.min(100000000,Math.max(0,Number(e.coins)||0)),roles,simulated:!!e.simulated,at:Number(e.at)||Date.now(),providerAt:Number(e.providerAt)||null,receivedAt:Date.now()};
}
class LiveHub extends EventEmitter{
 constructor({push=()=>{},clock=()=>Date.now(),limit=250}={}){super();this.push=push;this.clock=clock;this.limit=limit;this.events=[];this.times=[];this.connection={connected:false,status:'Sin conectar',phase:'idle'};this.counters={total:0,chat:0,gift:0,follow:0,share:0,like:0,subscription:0};this.lastPush=0;this.pending=false;this.likeTotal=0;this.likeMilestone=0;}
 ingest(raw){if(!raw||!ALLOWED.has(raw.type))return null;const e=safeEvent(raw);const now=this.clock();if(e.type==='like'){this.likeTotal+=e.count;const milestone=Math.floor(this.likeTotal/1000)*1000;if(milestone<=this.likeMilestone){this.counters.total++;this.counters.like++;this.times.push(now);while(this.times.length&&this.times[0]<now-10000)this.times.shift();this.flush();return e;}this.likeMilestone=milestone;e.likeMilestone=milestone;e.name='Comunidad';e.avatar='';}this.events.unshift(e);if(this.events.length>this.limit)this.events.length=this.limit;this.counters.total++;this.counters[e.type==='comment'?'chat':e.type]++;this.times.push(now);while(this.times.length&&this.times[0]<now-10000)this.times.shift();this.emit('event',e);this.flush();return e;}
 updateConnection(s={}){this.connection={connected:!!s.connected,liveDetected:!!s.liveDetected,status:String(s.status||'Sin conectar').slice(0,250),phase:String(s.phase||'idle'),errorCode:String(s.errorCode||''),catalogWarning:String(s.catalogWarning||''),lastError:String(s.lastError||''),nextRetryAt:s.nextRetryAt||null,username:s.username||'',lastEventAt:s.lastEventAt||null,roomId:s.roomId||null,requiresAuthorization:!!s.requiresAuthorization};this.flush(true);}
 snapshot(){const now=this.clock();while(this.times.length&&this.times[0]<now-10000)this.times.shift();const recent=this.times.filter(t=>t>=now-1000).length;const newest=this.events[0];const delay=(newest&&!newest.simulated&&newest.providerAt&&newest.providerAt<=now&&now-newest.providerAt<120000)?now-newest.providerAt:null;return {connection:this.connection,counters:{...this.counters},eps:recent,rate10s:Math.round(this.times.length/10*10)/10,latencyMs:delay,events:this.events.slice(0,this.limit),sampledAt:now};}
 flush(force=false){const now=this.clock();if(!force&&now-this.lastPush<140){if(!this.pending){this.pending=true;setTimeout(()=>{this.pending=false;this.flush(true);},150).unref?.();}return;}this.lastPush=now;this.push(this.snapshot());}
}
class LikeThreshold{constructor(step=500){this.step=Math.max(1,Number(step)||500);this.carry=0;}add(value){this.carry+=Math.max(0,Number(value)||0);const triggers=Math.floor(this.carry/this.step);this.carry%=this.step;return Math.min(10000,triggers);}}
module.exports={LiveHub,safeEvent,priorityFor,LikeThreshold};
