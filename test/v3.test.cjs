'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {displayGiftName}=require('../src/gift-locale.cjs');const {mergedCatalog,normalizeLive}=require('../src/gifts.cjs');const {DEFAULT_APPEARANCE}=require('../src/appearance.cjs');
test('regalos se ven en español y conservan el nombre original e ID para la alerta',()=>{
 const arr=normalizeLive([{id:111,name:'Heart Hands',coins:100,image:'https://example.com/gift.png'}]);
 assert.equal(arr[0].name,'Heart Hands');assert.equal(arr[0].displayName,'Corazón en las manos');assert.equal(arr[0].id,'111');
 const catalog=mergedCatalog([{id:222,name:'Healing Hands',coins:120}]);const gift=catalog.gifts[0];
 assert.equal(gift.id,'222');assert.equal(gift.name,'Healing Hands');assert.equal(gift.displayName,'Corazón en las manos');
 assert.equal(displayGiftName('Rose'),'Rosa');assert.equal(displayGiftName('Blue Heart'),'Corazón azul');
 assert.equal(displayGiftName('TikTok'),'TikTok');
});
test('stock tema violeta y sin barra de menú Electron',()=>{
 assert.equal(DEFAULT_APPEARANCE.accent,'#9464ff');assert.equal(DEFAULT_APPEARANCE.font,'segoe');
 const main=fs.readFileSync(path.join(__dirname,'../src/main.cjs'),'utf8');
 assert.match(main,/Menu\.setApplicationMenu\(null\)/);assert.match(main,/win\.removeMenu\(\)/);
 const css=fs.readFileSync(path.join(__dirname,'../renderer/studio-v3.css'),'utf8');
 assert.match(css,/data-rgb-mode=spectrum/);assert.match(css,/reduced-motion/);
});
test('biblioteca de regalos conserva id y nombre inglés cuando se usa una traducción visual',()=>{
 const gifts=mergedCatalog([]).gifts;
 assert.equal(gifts.length,1667);
 assert.equal(gifts.find(g=>g.name==='Rose').displayName,'Rosa');
 assert.equal(gifts.find(g=>g.name==='Hand Hearts').displayName,'Corazón en las manos');
 assert.ok(gifts.every(g=>typeof g.id==='string'&&typeof g.name==='string'&&typeof g.displayName==='string'));
});
