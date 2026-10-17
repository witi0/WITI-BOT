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
const ENDPOINTS = ['https://tiktok-tts.weilnet.workers.dev/api/generation','https://tiktoktts.com/api/tiktok-tts'];
let lastAttempt = 0;
function normalizeTtsText(value){
 if(typeof value!=='string')throw Error('Texto inválido');
 const clean=value.replace(/https?:\/\/\S+/gi,' ').replace(/(^|\s)@[\p{L}\p{N}._-]+/gu,'$1').replace(/\s+/g,' ').trim().slice(0,200);
 if(!clean)throw Error('Escribe un texto para probar la voz');return clean;
}
async function synthesize({voice,text}, options={}){
 if(!VOICES.some(v=>v.id===voice))throw Error('La voz no pertenece al catálogo antiguo');
 const clean=normalizeTtsText(text), fetcher=options.fetcher||fetch;
 if(Date.now()-lastAttempt<1200 && !options.fetcher)throw Error('Espera un momento antes de generar otra voz');
 if(!options.fetcher)lastAttempt=Date.now();
 let lastError='Proveedor no disponible';
 for(const url of ENDPOINTS){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
  try{
   const response=await fetcher(url,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({text:clean,voice}),signal:controller.signal});
   if(!response.ok){lastError=`Proveedor respondió ${response.status}`;continue;}
   const raw=await response.text();if(raw.length>4000000)throw Error('Audio demasiado grande');
   let body;try{body=JSON.parse(raw);}catch{lastError='Respuesta no compatible';continue;}
   let b64=body.data||body.audio||body.audioBase64||body.audio_base64||body.base64;
   if(body.success===false){lastError=String(body.error||'Audio no generado').slice(0,140);continue;}
   if(typeof b64!=='string')continue;
   b64=b64.replace(/^data:audio\/[\w.+-]+;base64,/,'');
   if(!/^[a-zA-Z0-9+/\s]+={0,2}$/.test(b64))continue;
   const bytes=Buffer.from(b64,'base64');
   if(bytes.length<500||bytes.length>2000000)continue;
   return {mime:'audio/mpeg',data:bytes.toString('base64'),provider:'Comunitario no oficial',voice};
  }catch(e){lastError=e.name==='AbortError'?'Tiempo agotado':String(e.message||e).slice(0,140);}
  finally{clearTimeout(timer);}
 }
 throw Error(`No se pudo generar la voz online: ${lastError}. Usa una voz instalada en Windows como alternativa.`);
}
module.exports={VOICES,normalizeTtsText,synthesize};
