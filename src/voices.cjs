'use strict';
// Recovered catalog identifiers from the user's previous WITI BOT v12.2.
// The service is unofficial and can disappear; Windows voices remain available offline.
const VOICES = Object.freeze([
  {id:'es_mx_002',name:'Álex',gender:'Masculina',locale:'México'},
  {id:'es_male_m3',name:'Julio',gender:'Masculina',locale:'Latinoamérica'},
  {id:'es_002',name:'Mateo',gender:'Masculina',locale:'España'},
  {id:'es_female_f6',name:'Alejandra',gender:'Femenina',locale:'Latinoamérica'},
  {id:'es_female_fp1',name:'Mariana',gender:'Femenina',locale:'Latinoamérica'},
  {id:'es_mx_female_supermom',name:'Super Mamá',gender:'Femenina',locale:'México'},
  {id:'es_mx_male_transformer',name:'Optimus MX',gender:'Personaje',locale:'México'},
]);
const ENDPOINTS = Object.freeze([
 'https://tiktoktts.com/api/tiktok-tts',
 'https://tiktok-tts.weilnet.workers.dev/api/generation'
]);
// WitiVoces are remote TikTok-style voices. No server is guaranteed to be online.
const FAILED_BACKOFF_MS=10000;
const TIMEOUTS_MS=[1300,1700];
let unavailableUntil=0;
let preferredEndpoint=0;
function normalizeTtsText(value){
 if(typeof value!=='string')throw Error('Texto inválido');
 const clean=value.replace(/https?:\/\/\S+/gi,' ').replace(/(^|\s)@[\p{L}\p{N}._-]+/gu,'$1').replace(/\s+/g,' ').trim().slice(0,200);
 if(!clean)throw Error('Escribe un texto para probar la voz');return clean;
}
function extractAudio(body){
 if(!body||typeof body!=='object'||body.success===false)return null;
 let b64=body.data||body.audio||body.audioBase64||body.audio_base64||body.base64||body?.data?.v_str;
 if(typeof b64!=='string')return null;
 b64=b64.replace(/^data:audio\/[\w.+-]+;base64,/, '').replace(/\s+/g,'');
 if(!/^[a-zA-Z0-9+/]+={0,2}$/.test(b64))return null;
 const bytes=Buffer.from(b64,'base64');
 if(bytes.length<500||bytes.length>2000000)return null;
 return bytes;
}
async function requestAudio(fetcher,url,voice,text,timeout){
 const controller=new AbortController();
 let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Tiempo agotado'));},timeout);});
 try{
  const response=await Promise.race([
   fetcher(url,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({text,voice}),signal:controller.signal}),
   deadline
  ]);
  if(!response?.ok)throw Error(`Proveedor respondió ${response?.status||'sin respuesta'}`);
  const raw=await Promise.race([
   response.text(),
   deadline
  ]);
  if(typeof raw!=='string'||raw.length>4000000)throw Error('Respuesta demasiado grande');
  let body;try{body=JSON.parse(raw);}catch{throw Error('Respuesta no compatible');}
  const bytes=extractAudio(body);
  if(!bytes)throw Error('El proveedor no entregó audio válido');
  return bytes;
 }finally{clearTimeout(timer);controller.abort();}
}
async function synthesize({voice,text},options={}){
 if(!VOICES.some(v=>v.id===voice))throw Error('La voz no pertenece al catálogo antiguo');
 const clean=normalizeTtsText(text), fetcher=options.fetcher||fetch;
 const injected=!!options.fetcher;
 if(!injected&&Date.now()<unavailableUntil)throw Error('WitiVoces temporalmente sin respuesta. Elige Windows manualmente si deseas voz local.');
 let lastError='Proveedor no disponible';
 const order=preferredEndpoint===0?[0,1]:[1,0];
 try{
  const result=await Promise.any(order.map((index,i)=>requestAudio(fetcher,ENDPOINTS[index],voice,clean,Math.max(100,Number(options.timeouts?.[i]||TIMEOUTS_MS[i]))).then(bytes=>({bytes,index}))));
  if(!injected){preferredEndpoint=result.index;unavailableUntil=0;}
  return {mime:'audio/mpeg',data:result.bytes.toString('base64'),provider:'WitiVoces · comunidad (no oficial)',voice};
 }catch(err){lastError=String(err.errors?.map(e=>e.message||e).join(' / ')||err.message||err).slice(0,150);}
 if(!injected)unavailableUntil=Date.now()+FAILED_BACKOFF_MS;
 throw Error(`WitiVoces sin respuesta: ${lastError}. Elige Windows manualmente si deseas voz local.`);
}
module.exports={VOICES,normalizeTtsText,synthesize};
