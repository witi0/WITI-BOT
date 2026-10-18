'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {LiveHub,safeEvent,priorityFor,LikeThreshold}=require('../src/live-hub.cjs');
test('eventos sanitizados, límite de registros y EPS',()=>{
 let now=20000;const hub=new LiveHub({clock:()=>now,limit:4,push:()=>{}});for(let i=0;i<10;i++){hub.ingest({type:'comment',id:String(i),user:'witi',name:'Witi',text:'Hola'});now+=100;}
 assert.equal(hub.snapshot().events.length,4);assert.equal(hub.snapshot().counters.total,10);assert.equal(hub.snapshot().eps,10);assert.equal(hub.snapshot().counters.chat,10);
});
test('latencia solo cuando proveedor envió timestamp válido',()=>{
 let now=100000;const hub=new LiveHub({clock:()=>now});hub.ingest({type:'gift',providerAt:99000,coins:2000,count:1,simulated:false});assert.equal(hub.snapshot().latencyMs,1000);
 hub.ingest({type:'follow',at:99900,simulated:true});assert.equal(hub.snapshot().latencyMs,null);
});
test('clasifica prioridades y no confunde conteo de regalos con monedas',()=>{
 assert.equal(priorityFor({type:'gift',coins:29999,count:1}),1);
 assert.equal(priorityFor({type:'gift',coins:1000,count:1000}),1);
 assert.equal(priorityFor({type:'gift',coins:1,count:1000}),3);
 assert.equal(priorityFor({type:'follow'}),2);
 assert.equal(priorityFor({type:'comment'}),3);
});
test('omite entradas peligrosas y roles desconocidos',()=>{
 const safe=safeEvent({type:'comment',avatar:'javascript:alert(1)',text:'x'.repeat(800),roles:['moderator','admin','subscriber']});
 assert.equal(safe.avatar,'');assert.equal(safe.text.length,500);assert.deepEqual(safe.roles,['moderator','subscriber']);
});

test('likes acumulados disparan una accion por cada 500, sin perder excedentes',()=>{const gate=new LikeThreshold(500);assert.equal(gate.add(200),0);assert.equal(gate.add(301),1);assert.equal(gate.carry,1);assert.equal(gate.add(999),2);assert.equal(gate.carry,0);});
