const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {catalog,fromTemplate,validateOverlay,installGallery}=require('../src/gallery.cjs');
const {LiveState,demoState}=require('../src/live-state.cjs');
test('49 diseños disponibles; una instalación nueva no crea decenas de overlays automáticamente',()=>{
 const stored=new Map(),screens=Array.from({length:8},(_,i)=>({id:i,kind:'actions'}));
 const db={get:key=>stored.get(key),set:(key,val)=>stored.set(key,val),save:(_,item)=>screens.push(item)};
 installGallery(db);installGallery(db);
 assert.equal(screens.length,8);
 assert.equal(stored.get('galleryVersion'),3);
 assert.equal(catalog.length,49);
 assert.equal(catalog.filter(x=>x.kind==='topgift').length,1);
 assert.equal(catalog.filter(x=>x.kind==='topstreak').length,1);
});
test('presets visuales normalizados y valores fuera de rango rechazados',()=>{
 const o=validateOverlay({...fromTemplate('witi-36'),stylePreset:'broadcast',rgb:true,rgbSpeed:999});
 assert.equal(o.kind,'topstreak');assert.equal(o.stylePreset,'broadcast');assert.equal(o.rgbSpeed,60);
 assert.equal(validateOverlay({...o,stylePreset:'javascript:alert(1)'}).stylePreset,'glass');
});
test('el regalo de mayor valor y la mayor racha se calculan en el estado en vivo',()=>{
 const store={get:()=>null,set:()=>{}};
 const live=new LiveState(store);
 live.apply({type:'gift',user:'a',name:'Ana',gift:'1',giftName:'Rosa',count:40,coins:40});
 live.apply({type:'gift',user:'b',name:'Beto',gift:'2',giftName:'León',count:1,coins:29999});
 assert.equal(live.snapshot().topStreak.name,'Ana');assert.equal(live.snapshot().topStreak.count,40);
 assert.equal(live.snapshot().topGift.name,'Beto');assert.equal(live.snapshot().topGift.coins,29999);
 assert.equal(demoState().topGift.giftName,'León');live.close();
});
test('controles de regalos y overlays utilizan entradas de texto seguras y enlaces por pantalla',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../renderer/index.html'),'utf8');
 const js=fs.readFileSync(path.join(__dirname,'../renderer/studio-pro.js'),'utf8');
 for(const id of ['studioGalleryPane','studioMyPane','studioEditorPane','giftInspector','giftOrigin','giftSort','giftCost'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(js.includes("call('copy-overlay'"));assert.ok(js.includes("call('create-template'"));
 assert.ok(js.includes("call('save-overlay'"));assert.ok(js.includes("call('gift-catalog'")===false);
 assert.ok(!js.includes('innerHTML='));
});
