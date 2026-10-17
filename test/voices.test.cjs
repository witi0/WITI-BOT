'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {VOICES,normalizeTtsText,synthesize}=require('../src/voices.cjs');
test('the seven previous WITI BOT voices are available as catalog entries',()=>{
 assert.equal(VOICES.length,7);for(const id of ['es_mx_002','es_male_m3','es_002','es_female_f6','es_female_fp1','es_mx_female_supermom','es_mx_male_transformer'])assert.ok(VOICES.some(v=>v.id===id));
});
test('TTS does not speak mentions or URLs and limits text',()=>{
 assert.equal(normalizeTtsText('  Hola @witi https://example.com/hola  feliz  '),'Hola feliz');assert.equal(normalizeTtsText('x'.repeat(700)).length,200);
 assert.throws(()=>normalizeTtsText('https://example.com'),/texto/i);
});
test('remote service response validation accepts legitimate base64 MP3 data',async()=>{
 const response={ok:true,text:async()=>JSON.stringify({success:true,data:Buffer.alloc(700,1).toString('base64')})};
 const result=await synthesize({voice:'es_mx_002',text:'Hola'}, {fetcher:async()=>response});
 assert.equal(result.mime,'audio/mpeg');assert.equal(Buffer.from(result.data,'base64').length,700);
});
test('invalid voice ids are rejected without sending HTTP requests',async()=>{
 let called=false;await assert.rejects(()=>synthesize({voice:'unknown',text:'Hola'},{fetcher:()=>{called=true;}}),/catálogo antiguo/);assert.equal(called,false);
});
test('failed providers report honest offline fallback guidance',async()=>{
 await assert.rejects(()=>synthesize({voice:'es_mx_002',text:'Hola'},{fetcher:async()=>({ok:false,status:503})}),/Windows/);
});
