'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');const {LiveHub,safeEvent}=require('../src/live-hub.cjs');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('5.3.2 conserva la app Electron con popout independiente y resumen real',()=>{
 const pkg=require('../package.json');assert.equal(pkg.version,'5.3.2');assert.equal(pkg.main,'src/main.cjs');
 const html=read('renderer/index.html');const main=read('src/main.cjs');
 for(const name of ['cw-open-chat','cw-recent-events','cw-top-donors','cw-viewers','cw-gifts'])assert.ok(html.includes('id="'+name+'"'));
 assert.match(html,/live-dashboard-5\.3\.2\.js/);assert.match(html,/class="cw-logo-img" src="app-icon\.png"/);
 assert.match(main,/liveState:stateNow\(\)/);assert.match(main,/open-live-popout/);
});
test('5.3.2 el chat no renderiza likes ni compartidos y conserva filtros',()=>{
 const js=read('renderer/live-popout.js'),html=read('renderer/live-popout.html');
 assert.match(js,/activeTypes=new Set\(/);assert.doesNotMatch(js,/new Set\(\[[^\]]*'like'/);
 assert.doesNotMatch(js,/new Set\(\[[^\]]*'share'/);
 for(const kind of ['gift','follow','subscription','chest','comment'])assert.ok(html.includes('data-filter="'+kind+'"'));
 for(const id of ['topDonors','timeline','settingsPanel','autoScroll','statViewers'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/Visualización en tiempo real · solo lectura/); assert.match(js,/e\.giftImage/);assert.match(js,/gift-art/);assert.match(js,/chest-live\.svg/); assert.ok(read('renderer/index.html').includes('id="cw-inline-live-chat"'));assert.ok(read('renderer/index.html').includes('id="cw-hub-live-chat"'));
});
test('5.3.2 el pipeline acepta cofres sin inventar valores',()=>{
 const hub=new LiveHub({push:()=>{}});
 hub.ingest({id:'g',type:'gift',name:'Witi',coins:29999,count:1});
 hub.ingest({id:'c',type:'chest',name:'Espectador'});
 hub.ingest({id:'m',type:'member',name:'Invitado'});
 hub.ingest({id:'l',type:'like',count:10});
 assert.equal(hub.snapshot().counters.chest,1);assert.equal(hub.snapshot().counters.member,1);
 assert.equal(hub.snapshot().counters.gift,1);
 const e=safeEvent({type:'subscription',subscriptionMonths:4,avatar:'javascript:alert(1)'});assert.equal(e.subscriptionMonths,4);assert.equal(e.avatar,'');
});
test('5.3.2 icono suministrado está instalado como PNG e ICO multirresolución',()=>{
 const png=fs.readFileSync(path.join(root,'build/icon.png')),ico=fs.readFileSync(path.join(root,'build/icon.ico'));
 assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(ico.readUInt16LE(2),1);assert.ok(ico.readUInt16LE(4)>=4);
 assert.ok(fs.statSync(path.join(root,'renderer/app-icon.png')).size>10000);
});
