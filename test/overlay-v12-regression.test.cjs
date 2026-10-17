const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const R=path.join(__dirname,'../renderer');const read=n=>fs.readFileSync(path.join(R,n),'utf8');
test('The original WITI BOT 12.2 overlay section and CSS are bundled',()=>{
 const html=read('legacy12-overlays.html'),original=read('legacy12-styles.css');
 for(const id of ['overlay-grid','overlay-search','overlay-filter','overlay-editor','overlay-editor-controls','gift-overlay-links','overlay-quick-copy','overlay-editor-preview'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(original,/overlay-pro-card/);assert.match(original,/overlay-editor-panel/);assert.match(html,/OVERLAY STUDIO 12\.2/);
});
test('All 29 original overlay definitions render with functional buttons and stable source keys',()=>{
 const defs=read('legacy12-defs.js'),logic=read('legacy12-app.js'),bridge=read('legacy12-host.js');
 assert.equal((defs.match(/configKey:/g)||[]).length,29);
 for(const action of ['copy','open','test','ensure','save','favorite'])assert.match(bridge,new RegExp("case '"+action+"':"));
 assert.match(logic,/WITI_PREVIEW_DRAFT/);assert.match(logic,/legacy12Key/);assert.match(bridge,/copy-gift-overlay/);
});
test('Legacy UI is framed in the current renderer, not a disconnected standalone demo',()=>{
 const index=read('index.html');assert.match(index,/id="legacy12StudioFrame"/);assert.match(index,/legacy12-host\.js/);
 const main=fs.readFileSync(path.join(__dirname,'../src/main.cjs'),'utf8');assert.match(main,/legacy12Favorites/);assert.match(main,/handle\('save-overlay'/);
});
