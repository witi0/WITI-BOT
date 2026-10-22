'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {Store}=require('../src/core.cjs'),{Community,normalizePoints}=require('../src/community.cjs');
const {refreshBrowserSources}=require('../src/obs-reconnect.cjs');
const evt=(user,type,data={})=>({id:crypto.randomUUID(),user,name:user,type,at:Date.now(),...data});
test('registro automático exige seguimiento confirmado y una de tres formas de participación',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'witi-comunidad-'));
 const store=await Store.open(dir),community=new Community(store);
 try{
  store.set('pointSettings',{...normalizePoints(),enabled:true,audience:'community',perCoin:3,perLike:2,perShare:5});
  const send=e=>{community.observe(e);community.award(e);};
  send(evt('a','follow'));
  assert.equal(community.summary().registered,0);
  send(evt('a','like',{count:99}));assert.equal(community.summary().registered,0);
  send(evt('a','like',{count:1}));assert.equal(community.summary().registered,1);
  assert.equal(community.list()[0].balance,25);
  const like=evt('a','like',{count:100});send(like);community.award(like);
  assert.equal(community.list()[0].balance,27);
  send(evt('a','gift',{coins:2,count:1}));assert.equal(community.list()[0].balance,33);
  send(evt('a','share'));assert.equal(community.list()[0].balance,38);
  send(evt('b','gift',{count:1,coins:5,follower:false}));assert.equal(community.summary().registered,1);
  send(evt('b','follow'));assert.equal(community.summary().registered,2);
  send(evt('c','follow'));for(let i=0;i<9;i++)send(evt('c','comment',{text:'hola'}));assert.equal(community.summary().registered,2);
  send(evt('c','comment',{text:'hola'}));assert.equal(community.summary().registered,3);
  assert.equal(community.credit('a',5).balance,43);
  assert.throws(()=>community.credit('no-registrado',5),/todavía no está registrada/);
  assert.throws(()=>community.credit('a',-200),/Saldo insuficiente/);
  assert.equal(community.remove('b'),true);assert.equal(community.summary().registered,2);
  community.clear();assert.equal(community.summary().registered,0);
 }finally{community.close();store.db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('OBS solo recarga las fuentes del navegador propias y conserva ajustes',async()=>{
 const id=crypto.randomUUID(),known=`http://127.0.0.1:19381/overlay/${id}?token=secreto`,calls=[];
 const obs={async call(name,args){calls.push({name,args});if(name==='GetInputList')return {inputs:[{inputName:'WITI top'},{inputName:'Otra web'}]};if(name==='GetInputSettings')return {inputSettings:{url:args.inputName==='WITI top'?known:'https://youtube.com/',width:810,height:490}};if(name==='SetInputSettings'||name==='PressInputPropertiesButton')return {};throw Error(name);}};
 const result=await refreshBrowserSources(obs,{url:()=>known},{list:()=>[{id}]});
 assert.deepEqual(result,{refreshed:1,failed:0});
 const set=calls.filter(x=>x.name==='SetInputSettings');assert.equal(set.length,1);assert.equal(set[0].args.inputSettings.url,known);assert.ok(calls.some(c=>c.name==='PressInputPropertiesButton'&&c.args.propertyName==='refreshnocache'));assert.equal(set[0].args.inputSettings.width,810);
});
