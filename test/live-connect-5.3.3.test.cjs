'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {TikTokReader}=require('../src/tiktok.cjs');
const sdk=require('../src/piratetok.cjs');

function fakeSocket(){
 const client=new EventEmitter();
 client.connect=async()=>({roomId:'123456789'});
 client.disconnect=async()=>{};
 return client;
}

test('el LIVE conecta aunque la notificación visual lance una excepción',async t=>{
 const errors=[];const before=console.warn;console.warn=(...args)=>errors.push(args.join(' '));
 t.after(()=>{console.warn=before;});
 const reader=new TikTokReader({store:{set(){}},event:()=>{},status:()=>{throw Error('Ventana desprendible cerrada');},connectionFactory:fakeSocket,eventTypes:sdk});
 t.after(()=>reader.disconnect());
 const state=await reader.connect('witimc');
 assert.equal(state.phase,'connected');
 assert.equal(state.connected,true);
 assert.ok(errors.some(e=>e.includes('Ventana desprendible cerrada')));
});

test('el chat conserva comentarios y regalos sin depender de eventos experimentales',async t=>{
 const events=[],socket=fakeSocket();
 const reader=new TikTokReader({store:{set(){}},event:e=>events.push(e),status:()=>{},connectionFactory:()=>socket,eventTypes:sdk});
 t.after(()=>reader.disconnect());
 await reader.connect('witimc');
 socket.emit('chat',{common:{msgId:'msg1'},content:'Ya estamos en LIVE',user:{uniqueId:'suscriptor',nickname:'Suscriptor'}});
 socket.emit('gift',{common:{msgId:'gift1'},giftId:'555',repeatCount:1,repeatEnd:true,gift:{id:'555',name:'Rosa',diamondCount:1},user:{uniqueId:'suscriptor',nickname:'Suscriptor'}});
 while(reader.queue.pending)await new Promise(setImmediate);
 assert.deepEqual(events.map(e=>e.type),['comment','gift']);
 assert.equal(events[0].text,'Ya estamos en LIVE');
 assert.equal(events[1].giftName,'Rosa');
});
