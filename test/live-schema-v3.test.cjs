'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {TikTokReader,normalize}=require('../src/tiktok.cjs'),{LiveHub}=require('../src/live-hub.cjs'),{TtsPolicy}=require('../src/chat-policy.cjs');
test('protobuf actual: comentarios content se muestran y alimentan comandos y TTS',async t=>{
 const schema=await import('tiktok-live-proto/v3'),sdk=require('tiktok-live-connector');
 const socket=new EventEmitter();socket.connect=async()=>({roomId:'123456789'});socket.disconnect=async()=>{};let catalogRequests=0;socket.fetchAvailableGifts=async()=>{catalogRequests++;throw Error('Business plan required');};
 const hub=new LiveHub(),events=[],spoken=[],policy=new TtsPolicy();const reader=new TikTokReader({store:{set(){}},secretGet:()=>'',status:()=>{},eventTypes:sdk,connectionFactory:()=>socket,event:e=>{events.push(e);hub.ingest(e);const text=policy.text(e,{enabled:true,prefix:'.',readName:false,cooldown:0});if(text)spoken.push(text);}});t.after(()=>reader.disconnect());await reader.connect('witimc');
 const user={...schema.User.decode(new Uint8Array()),id:'123',nickname:'Witi'};
 for(const [i,content]of ['Hola comunidad','/play la chona','.Esto se debe leer'].entries()){
  const message={...schema.WebcastChatMessage.decode(new Uint8Array()),common:{...schema.CommonMessageData.decode(new Uint8Array()),msgId:String(i+1)},user,content};
  const encoded=schema.WebcastChatMessage.encode(message);const decoded=schema.WebcastChatMessage.decode(encoded.finish?encoded.finish():encoded);socket.emit(sdk.WebcastEvent.CHAT,decoded);
 }
 while(reader.queue.pending)await new Promise(setImmediate);
 assert.deepEqual(events.map(e=>e.text),['Hola comunidad','/play la chona','.Esto se debe leer']);assert.equal(hub.snapshot().events.find(e=>e.text.startsWith('/play')).user,'123');assert.deepEqual(spoken,['Esto se debe leer']);assert.equal(catalogRequests,0);assert.deepEqual(await reader.gifts(),[]);assert.equal(catalogRequests,0);
});
test('catálogo opcional no contamina el estado del socket; regalos llevan su propio nombre y valor',async t=>{
 const socket=new EventEmitter();socket.connect=async()=>({roomId:'123456789'});socket.disconnect=async()=>{};const events=[];
 const reader=new TikTokReader({store:{set(){}},secretGet:()=>'',status:()=>{},event: e=>events.push(e),eventTypes:require('tiktok-live-connector'),connectionFactory:()=>socket});t.after(()=>reader.disconnect());await reader.connect('witimc');
 socket.emit('error',{info:'Failed to fetch room gifts.',exception:Error('SignatureMissingTokensError: This endpoint requires a Business plan')});
 assert.equal(reader.state.connected,true);assert.equal(reader.state.errorCode,'');assert.equal(reader.state.lastError,'');assert.ok(reader.state.catalogWarning);
 socket.emit('gift',{common:{msgId:'g1'},giftId:'5655',repeatCount:3,repeatEnd:1,user:{id:'123',nickname:'Witi'},gift:{id:'5655',name:'Rose',diamondCount:1,type:1,image:{urlList:['https://example.com/rose.webp']}}});
 while(reader.queue.pending)await new Promise(setImmediate);
 assert.equal(events[0].giftName,'Rose');assert.equal(events[0].coins,3);assert.equal(events[0].giftImage,'https://example.com/rose.webp');assert.deepEqual(await reader.gifts(),[{id:'5655',name:'Rose',coins:1,image:'https://example.com/rose.webp'}]);
 socket.emit('error',{info:'Error while connecting',exception:Error('401 unauthorized')});assert.equal(reader.state.errorCode,'AUTH');
});
test('texto legacy sigue siendo compatible sin convertir objetos a texto',()=>{assert.equal(normalize('comment',{comment:'Legacy'}).text,'Legacy');assert.equal(normalize('comment',{content:'Actual',comment:''}).text,'Actual');assert.equal(normalize('comment',{content:{key:'invalid'},comment:'Texto válido'}).text,'Texto válido');});

test('el contador actual de likes usa count, sin sumar el total acumulado',async()=>{const s=await import('tiktok-live-proto/v3');const message={...s.WebcastLikeMessage.decode(new Uint8Array()),count:25,total:'10000'};const writer=s.WebcastLikeMessage.encode(message);const decoded=s.WebcastLikeMessage.decode(writer.finish?writer.finish():writer);assert.equal(normalize('like',decoded).count,25);assert.equal(normalize('like',{likeCount:7}).count,7);});
