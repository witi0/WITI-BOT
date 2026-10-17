'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {normalizeAppearance,DEFAULT_APPEARANCE}=require('../src/appearance.cjs');
const root=path.resolve(__dirname,'..');
test('la apariencia admite personalización sin modificar otros ajustes',()=>{
 const selected=normalizeAppearance({rgb:false,reducedMotion:true,accent:'#52C6F8',mode:'spectrum',speed:6,intensity:90,font:'trebuchet',compact:true});
 assert.deepEqual(selected,{rgb:false,reducedMotion:true,mode:'spectrum',accent:'#52c6f8',speed:6,intensity:90,font:'trebuchet',compact:true});
 assert.deepEqual(normalizeAppearance(),DEFAULT_APPEARANCE);
});
test('los ajustes fuera de rango se normalizan antes de persistir',()=>{
 const selected=normalizeAppearance({mode:'../../temp',accent:'javascript:alert(1)',font:'insegura',speed:-30,intensity:999});
 assert.equal(selected.mode,'aurora');assert.equal(selected.accent,DEFAULT_APPEARANCE.accent);assert.equal(selected.font,'bahnschrift');
 assert.equal(selected.speed,4);assert.equal(selected.intensity,100);
 assert.throws(()=>normalizeAppearance(null));
});
test('la interfaz incluye los controles RGB globales y la navegación rápida',()=>{
 const html=fs.readFileSync(path.join(root,'renderer/index.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'renderer/experience.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'renderer/experience.css'),'utf8');
 for(const id of ['appearancePreview','rgbMode','accentColor','rgbSpeedApp','rgbStrength','uiTypeface','compactUI','commandPalette','commandSearch','commandResults','commandTrigger'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/appearance-set/);assert.match(js,/event\.key\.toLowerCase\(\)==='k'/);assert.match(js,/command-result/);
 assert.match(css,/body\.theme-rgb \.(?:studio-design-card|primary)/);assert.match(css,/body:not\(\.theme-rgb\)/);assert.match(css,/prefers-reduced-motion/);
});
test('no se empaquetan archivos binarios de tipografía ni sonidos sintéticos',()=>{
 assert.equal(fs.existsSync(path.join(root,'renderer/fonts')),false);
 assert.equal(fs.existsSync(path.join(root,'assets/sounds')),false);
 const widget=fs.readFileSync(path.join(root,'renderer/widget.css'),'utf8');
 assert.doesNotMatch(widget,/woff2|@font-face/);
});
