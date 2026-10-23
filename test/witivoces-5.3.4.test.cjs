'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {VOICES,synthesize}=require('../src/voices.cjs');
const {normalizeTts}=require('../src/chat-policy.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const validAudio=()=>({ok:true,status:200,text:async()=>JSON.stringify({success:true,data:Buffer.alloc(600,1).toString('base64')})});

test('WitiVoces mantiene los siete identificadores clásicos y se ofrece al abrir la página',()=>{
 assert.deepEqual(VOICES.map(v=>v.name),['Álex','Julio','Mateo','Alejandra','Mariana','Super Mamá','Optimus MX']);
 const html=read('renderer/index.html');
 assert.match(html,/<option value="online">WitiVoces/);
 assert.ok(html.indexOf('<option value="online">WitiVoces')<html.indexOf('<option value="local">Windows'));
 assert.match(read('renderer/app.js'),/t.engine\|\|'online'/);
});
test('restaura voz WitiVoces guardada aunque el motor antiguo diga local',()=>{
 assert.equal(normalizeTts({voice:'es_mx_002',engine:'local'}).engine,'online');
 assert.equal(normalizeTts({voice:'es_female_f6'}).engine,'online');
 assert.equal(normalizeTts({engine:'local',voice:'Microsoft Helena'}).engine,'local');
 assert.equal(normalizeTts({}).engine,'online');
});
test('si el primer servidor falla, usa el segundo sin cambiar el ID de la voz',async()=>{
 const requests=[];
 const result=await synthesize({voice:'es_mx_002',text:'Hola a todos'}, {fetcher:async(url,args)=>{requests.push({url,body:JSON.parse(args.body)});return requests.length===1?{ok:false,status:503}:validAudio();}});
 assert.equal(requests.length,2);
 assert(requests.every(x=>x.body.voice==='es_mx_002'));
 assert.match(result.provider,/WitiVoces/);
});
test('la espera máxima remota se corta si un proveedor deja una conexión colgada',async()=>{
 const start=Date.now();let count=0;
 await assert.rejects(()=>synthesize({voice:'es_002',text:'Hola'}, {fetcher:()=>{count++;return new Promise(()=>{});},timeouts:[110,110]}),/Windows/);
 assert.equal(count,2);
 assert(Date.now()-start<1000);
});
test('el TTS de los comentarios reduce cola antigua sin cancelar mensajes manuales',()=>{
 const main=read('src/main.cjs');
 assert.match(main,/source:isComment\?'live-comment':'manual'/);
 assert.match(main,/active=new Set/);
 assert.match(main,/older\.slice\(0,Math\.max\(0,older\.length-1\)\)/);
});
test('playback tiene límites de espera, permite cortar el audio y conserva live + OBS',()=>{
 const renderer=read('renderer/app.js');
 assert.match(renderer,/abortActiveVoice/);
 assert.match(renderer,/remoteUnavailableUntil=Date\.now\(\)\+10000/);
 assert.doesNotMatch(renderer,/Usando voz de Windows/);
 assert.match(renderer,/WitiVoces no disponible/);
 assert.match(read('src/main.cjs'),/new TikTokReader/);
 assert.match(read('src/main.cjs'),/refreshBrowserSources/);
});
