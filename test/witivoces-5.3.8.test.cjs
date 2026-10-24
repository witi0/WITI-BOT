'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {synthesize,extractAudio}=require('../src/voices.cjs');
const root=path.resolve(__dirname,'..');
const source=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');
const audio=()=>Buffer.concat([Buffer.from([0x49,0x44,0x33,0x04,0,0]),Buffer.alloc(600,4)]);
test('WitiVoces decodifica objetos data.v_str en vez de tratarlos como JSON inválido',()=>{
 const b=audio();assert.deepEqual(extractAudio({success:true,data:{v_str:b.toString('base64')}}),b);
 assert.deepEqual(extractAudio({success:true,data:b.toString('base64')}),b);
 assert.equal(extractAudio({success:false,data:b.toString('base64')}),null);
});
test('WitiVoces decodifica WAV sin etiquetarlo como MP3',async()=>{
 const wav=Buffer.concat([Buffer.from('RIFF'),Buffer.alloc(4),Buffer.from('WAVE'),Buffer.alloc(600)]);
 const result=await synthesize({voice:'es_mx_002',text:'Prueba'}, {fetcher:async()=>({ok:true,text:async()=>JSON.stringify({success:true,data:{v_str:wav.toString('base64')}})})});
 assert.equal(result.mime,'audio/wav');assert.equal(result.voice,'es_mx_002');
});
test('No se impone cooldown global tras error remoto; cada intento conserva su voz',async()=>{
 const bad=()=>Promise.resolve({ok:false,status:503});
 for(let i=0;i<2;i++)await assert.rejects(()=>synthesize({voice:i?'es_002':'es_mx_002',text:'Hola'}, {fetcher:bad,timeouts:[500,500]}),/WitiVoces/);
 assert.doesNotMatch(source('renderer/app.js'),/remoteUnavailableUntil/);
});
test('Probar voz no depende de tts-test, silenciado ni cola',()=>{
 const code=source('renderer/app.js');const from=code.indexOf("$('#ttsPlay').onclick");const to=code.indexOf("$('#ttsStop')",from);const body=code.slice(from,to);
 assert.match(body,/speakOnline\(text\)/);assert.match(body,/speakLocal\(text\)/);assert.doesNotMatch(body,/call\('tts-test'/);
});
test('Se reduce backlog TTS y las llamadas usan el mismo sintetizador en caché',()=>{
 const main=source('src/main.cjs');assert.match(main,/for\(const row of older\)/);assert.match(main,/synthesize\(\{voice:settings.voice,text\}\)\.catch/);
 const preload=source('src/preload.cjs');assert.match(preload,/voice-local-synthesize/);
});
test('La reproducción local tiene ruta SAPI sin alterar el motor online',()=>{
 const local=source('src/windows-speech.cjs');assert.match(local,/System\.Speech/);assert.match(local,/es-\*/);assert.match(source('renderer/app.js'),/voice-local-synthesize/);
});

test('El scheduler interrumpe comentarios activos que superan el umbral de latencia',()=>{
 const playback=source('src/playback.cjs');assert.match(playback,/dropStaleLiveComment/);assert.match(playback,/stale-live-comment/);
 const main=source('src/main.cjs');assert.match(main,/dropStaleLiveComment\?\.\(9000\)/);
});
