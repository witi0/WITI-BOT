'use strict';
const VOICES=Object.freeze([
 {id:'es_mx_002',name:'Álex',gender:'Masculina',locale:'México'},
 {id:'es_male_m3',name:'Julio',gender:'Masculina',locale:'Latinoamérica'},
 {id:'es_002',name:'Mateo',gender:'Masculina',locale:'España'},
 {id:'es_female_f6',name:'Alejandra',gender:'Femenina',locale:'Latinoamérica'},
 {id:'es_female_fp1',name:'Mariana',gender:'Femenina',locale:'Latinoamérica'},
 {id:'es_mx_female_supermom',name:'Super Mamá',gender:'Femenina',locale:'México'},
 {id:'es_mx_male_transformer',name:'Optimus MX',gender:'Personaje',locale:'México'}
]);
const ENDPOINTS=Object.freeze(['https://tiktok-tts.weilnet.workers.dev/api/generation','https://tiktoktts.com/api/tiktok-tts']);
const TIMEOUTS_MS=[3000,3200];
const MAX_AUDIO=2500000;
const CACHE_TTL_MS=45000;
let preferredEndpoint=0;
const cached=new Map(),inflight=new Map();
function normalizeTtsText(value){
 if(typeof value!=='string')throw Error('Texto inválido');
 const clean=value.replace(/https?:\/\/\S+/gi,' ').replace(/(^|\s)@[\p{L}\p{N}._-]+/gu,'$1').replace(/\s+/g,' ').trim().slice(0,200);
 if(!clean)throw Error('Escribe un texto para probar la voz');return clean;
}
function decodeBase64(value){
 if(typeof value!=='string')return null;
 const data=value.replace(/^data:audio\/[\w.+-]+;base64,/i,'').replace(/\s+/g,'');
 if(!data||data.length>MAX_AUDIO*1.4||!/^[-_a-zA-Z0-9+/]+={0,2}$/.test(data))return null;
 const bytes=Buffer.from(data.replace(/-/g,'+').replace(/_/g,'/'),'base64');
 return bytes.length>=200&&bytes.length<=MAX_AUDIO?bytes:null;
}
function extractAudio(body){
 if(!body||typeof body!=='object'||body.success===false||body.error)return null;
 const variants=[body.data?.v_str,body.data?.audio,body.data?.audioBase64,body.data?.base64,body.data?.data,body.data,body.audio,body.audioBase64,body.audio_base64,body.base64,body.v_str,body.result?.data?.v_str,body.result?.data];
 for(const value of variants){const decoded=decodeBase64(value);if(decoded)return decoded;}
 return null;
}
function mimeOf(bytes){
 if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WAVE')return 'audio/wav';
 if(bytes.subarray(0,4).toString()==='OggS')return 'audio/ogg';
 return 'audio/mpeg';
}
async function requestAudio(fetcher,url,voice,text,timeout){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Math.max(250,timeout));
 try{
  const response=await Promise.race([fetcher(url,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({text,voice}),signal:controller.signal}),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('Tiempo agotado')),{once:true}))]);
  if(!response?.ok)throw Error('HTTP '+String(response?.status||'sin respuesta'));
  const raw=await Promise.race([response.text(),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('Tiempo agotado')),{once:true}))]);
  if(typeof raw!=='string'||raw.length>MAX_AUDIO*1.4)throw Error('Respuesta demasiado grande');
  let body;try{body=JSON.parse(raw);}catch{throw Error('Respuesta no compatible');}
  const bytes=extractAudio(body);
  if(!bytes)throw Error('Respuesta sin audio utilizable');
  return {bytes,mime:mimeOf(bytes)};
 }finally{clearTimeout(timer);controller.abort();}
}
async function synthesize({voice,text},options={}){
 if(!VOICES.some(v=>v.id===voice))throw Error('La voz no pertenece al catálogo antiguo WitiVoces');
 const clean=normalizeTtsText(text),fetcher=options.fetcher||fetch,custom=!!options.fetcher,key=voice+'\0'+clean;
 if(!custom){const found=cached.get(key);if(found&&Date.now()-found.at<CACHE_TTL_MS)return found.result;if(inflight.has(key))return inflight.get(key);}
 const job=(async()=>{
  const order=preferredEndpoint===0?[0,1]:[1,0];
  const result=await Promise.any(order.map((index,i)=>requestAudio(fetcher,ENDPOINTS[index],voice,clean,Math.max(250,Number(options.timeouts?.[i]||TIMEOUTS_MS[i]))).then(audio=>({...audio,index})))).catch(err=>{const detail=String(err.errors?.map(e=>e.message||e).join(' / ')||err.message||err).slice(0,180);throw Error('No se pudo generar WitiVoces: '+detail+'. Elige Windows manualmente si el proveedor está fuera de servicio');});
  if(!custom)preferredEndpoint=result.index;
  const output={mime:result.mime,data:result.bytes.toString('base64'),provider:'WitiVoces · TikTok TTS (servicio no oficial)',voice};
  if(!custom){cached.set(key,{at:Date.now(),result:output});while(cached.size>18)cached.delete(cached.keys().next().value);}
  return output;
 })();
 if(!custom)inflight.set(key,job);
 try{return await job;}finally{if(!custom)inflight.delete(key);}
}
module.exports={VOICES,normalizeTtsText,extractAudio,synthesize};
