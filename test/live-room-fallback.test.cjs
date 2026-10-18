'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {TikTokReader,classifyError,errorText}=require('../src/tiktok.cjs');
const {parseLivePage}=require('../src/room-resolver.cjs');
const sdk={WebcastEvent:{CHAT:'chat',STREAM_END:'streamEnd'},ControlEvent:{ERROR:'error',DISCONNECTED:'disconnected'}};
function setup(t,options){const r=new TikTokReader({event(){},status(){},secretGet:()=>'',store:{set(){}},eventTypes:sdk,...options});t.after(()=>r.disconnect());return r;}
const script=(data,id='__UNIVERSAL_DATA_FOR_REHYDRATION__')=>`<script id="${id}" type="application/json">${JSON.stringify(data)}</script>`;
test('sala moderna se resuelve para el propietario, conservando IDs de 19 dígitos',()=>{
 const html=script({__DEFAULT_SCOPE__:{'webcast.app':{liveRoomUserInfo:{user:{uniqueId:'witimc',roomId:'7451123456789012345'},liveRoom:{status:2}}}}});
 assert.equal(parseLivePage(html,'witimc').roomId,'7451123456789012345');
 assert.equal(parseLivePage(html,'otro'),null);
 const numeric=html.replace('"roomId":"7451123456789012345"','"roomId":7451123456789012345');
 assert.equal(parseLivePage(numeric,'witimc').roomId,'7451123456789012345');
});
test('no confunde salas recomendadas ni un perfil offline con un directo activo',()=>{
 assert.equal(parseLivePage(script({recommendations:[{user:{uniqueId:'witimc',roomId:'7451123456789012345'},status:2}]}),'witimc'),null);
 const page=script({LiveRoom:{liveRoomUserInfo:{user:{uniqueId:'WitiMC',roomId:'0'},liveRoom:{status:4}}}},'SIGI_STATE');
 assert.equal(parseLivePage(page,'witimc').live,false);
 assert.equal(parseLivePage('<script id="SIGI_STATE">invalid</script>','witimc'),null);
});
test('fallback cambia la sala al resolver moderno y conecta con un ID explícito',async t=>{
 let attempts=0,resolved=0;const passed=[];
 const r=setup(t,{roomResolver:async()=>{resolved++;return {roomId:'7451123456789012345',live:true};},connectionFactory:()=>{const c=new EventEmitter();c.disconnect=async()=>{};c.connect=async room=>{passed.push(room);if(++attempts===1)throw Error('Failed to retrieve Room ID from all sources.');return {roomId:room};};return c;}});
 await r.connect('@witimc');assert.equal(resolved,1);assert.deepEqual(passed,[undefined,'7451123456789012345']);assert.equal(r.state.connected,true);
});
test('cancelar la resolución alternativa no abre otra conexión',async t=>{
 let release,calls=0;const r=setup(t,{roomResolver:()=>new Promise(r=>release=r),connectionFactory:()=>{calls++;const c=new EventEmitter();c.disconnect=async()=>{};c.connect=async()=>{throw Error('UserOfflineError');};return c;}});
 const pending=r.connect('witimc');while(!release)await new Promise(r=>setImmediate(r));r.disconnect();release({roomId:'7451123456789012345',live:true});await pending;assert.equal(calls,1);assert.equal(r.state.connected,false);
});
test('errores de rutas anidadas preservan el motivo y redactan credenciales',()=>{
 const e={message:'Failed to retrieve Room ID from all sources.',requestErrs:[Error('403 blocked token=private')]};
 assert.equal(classifyError(e,'witimc').code,'ROOM_LOOKUP');assert.match(errorText(e),/403/);assert.doesNotMatch(errorText(e),/private/);
});
test('fin del directo cambia el estado y programa una búsqueda posterior',async t=>{
 const c=new EventEmitter();c.disconnect=async()=>{};c.connect=async()=>({roomId:'7451123456789012345'});
 const r=setup(t,{connectionFactory:()=>c});await r.connect('witimc');c.emit('streamEnd');assert.equal(r.state.connected,false);assert.equal(r.state.liveStatus,'offline');assert.ok(r.state.nextRetryAt>Date.now());
});
