'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const renderer=path.resolve(__dirname,'../renderer');
const read=(p)=>fs.readFileSync(path.join(renderer,p),'utf8');
const html=read('index.html'),css=read('creator-workspace.css'),js=read('creator-workspace.js');
test('Creator Workspace se abre dentro de Electron, no solo en la vista HTML separada',()=>{
 const pkg=require('../package.json');
 assert.equal(pkg.main,'src/main.cjs');
 assert.equal(pkg.version,'5.3.1');
 assert.match(html,/href="creator-workspace\.css"/);
 assert.match(html,/src="creator-workspace\.js"/);
 assert.match(html,/cw-sidebar/);
 assert.match(html,/cw-hero/);
 assert.match(html,/Centro de operaciones/);
});
test('Se conservan las 18 páginas de Electron y sus accesos originales',()=>{
 for(const page of ['home','livehub','rules','overlays','screens','commands','music','sounds','simulator','gifts','community','timer','connections','tts','logs','settings','shortcuts','contributors']){
  assert.match(html,new RegExp(`id="${page}"[^>]*class="[^"]*page|class="[^"]*page[^"]*"[^>]*id="${page}"`));
  assert.match(html,new RegExp(`data-page="${page}"`));
 }
 for(const id of ['profileForm','simForm','ruleForm','overlayForm','community','obsStatus','stop','commandTrigger','liveConnectionBadge','version']) assert.match(html,new RegExp(`id="${id}"`));
});
test('El diseño mantiene el contraste industrial y respeta las preferencias de movimiento',()=>{
 assert.match(css,/#0a0a0c/i);
 assert.match(css,/#141417/i);
 assert.match(css,/#10b981/i);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(js,/stiffness|const k=380/);
 assert.match(js,/new MutationObserver\(updateLive\)/);
 assert.doesNotMatch(js,/\bfetch\(/);
});
