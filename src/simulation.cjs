'use strict';
const crypto=require('node:crypto');
const {LiveState,demoState}=require('./live-state.cjs');
function buildSimulationEvent(input={},gifts=[]){
 if(!['follow','share','gift','like','comment','command','manual','subscription'].includes(input.type))throw Error('Evento inválido');
 const count=Number(input.count??1);if(!Number.isSafeInteger(count)||count<1||count>1000000)throw Error('Cantidad entre 1 y 1000000');
 const gift=input.type==='gift'?gifts.find(g=>String(g.id)===String(input.gift)||g.name===input.gift):null;
 if(input.type==='gift'&&!gift)throw Error('Selecciona un regalo del catálogo');
 const follower=input.type==='follow'?true:typeof input.follower==='boolean'?input.follower:null;
 return {id:'simulation:'+crypto.randomUUID(),type:input.type,user:String(input.user||'usuario-prueba').slice(0,100),name:String(input.name||'Usuario de prueba').slice(0,100),avatar:'',follower,roles:[...(follower===true?['follower']:[])],text:String(input.text||'').slice(0,500),gift:String(gift?.id||''),giftName:gift?.name||'',giftDisplayName:gift?.displayName||gift?.name||'',giftAliases:gift?[gift.name,gift.displayName].filter(Boolean):[],giftImage:gift?.image||'',count,coins:(Number(gift?.coins)||0)*count,simulated:true,at:Date.now()};
}
class Simulation{
 constructor(options){Object.assign(this,options);this.state=new LiveState({get:()=>null,set:()=>{}});this.state.close();this.active=false;}
 snapshot(){return this.active?{...this.state.snapshot(),simulated:true,music:demoState().music}:demoState();}
 reset(){this.state.reset();this.active=false;for(const key of this.engine.likes.keys())if(key.includes(':test:'))this.engine.likes.delete(key);for(const key of this.engine.cooldowns.keys())if(key.includes(':test:'))this.engine.cooldowns.delete(key);this.server.refresh();return true;}
 async send(input){
  const {mergedCatalog}=require('./gifts.cjs'),gifts=mergedCatalog(Object.values(this.store.get('observedGifts')||{})).gifts;
  const event=buildSimulationEvent(input,gifts);if(event.type==='gift'&&!event.giftImage)event.giftImage=this.giftImage?.(event)||'';
  this.active=true;this.state.apply(event);this.hub?.()?.ingest(event);this.server.refresh();this.server.previewAll?.({type:'live',event});
  const results=await this.engine.receive(event);
  if(event.type==='command'||event.type==='comment'&&/^[!/.]/.test(event.text)){const answer=await this.command({...event,type:'command',id:event.id+':command'});if(answer?.text)results.push({action:'command',status:'Respuesta entregada al overlay de pruebas',message:answer.text});else results.push({action:'command',status:'No coincide con ningún comando habilitado'});}
  const spoken=this.ttsPolicy.text(event,this.store.get('ttsSettings')||{},{...this.state.snapshot(),simulation:true});
  if(spoken){this.speech(spoken,event);results.push({action:'tts',status:'Comentario aceptado por el filtro TTS'});}
  else if(event.type==='comment')results.push({action:'tts',status:'Comentario omitido por la configuración TTS'});
  return results;
 }
}
module.exports={Simulation,buildSimulationEvent};
