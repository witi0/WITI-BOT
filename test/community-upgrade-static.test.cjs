'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('los archivos modificados conservan sintaxis JavaScript compatible',()=>{
 for(const file of ['src/main.cjs','src/community.cjs','src/obs-reconnect.cjs','src/overlay.cjs','src/simulation.cjs','src/preload.cjs','renderer/app.js','renderer/studio.js','renderer/simulator.js','renderer/community-panel.js','renderer/widget.js']){
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file}),file);
 }
});
test('el panel de comunidad, la prueba de comandos y la restauracion OBS quedan conectados',()=>{
 const html=fs.readFileSync(path.join(root,'renderer/index.html'),'utf8');
 for(const id of ['communityCounter','communityDeleteAll','communitySearch','pointSettingsForm','perMinute','simCommandPreview','obsRefreshOverlays'])assert.ok(html.includes(id),id);
 const preload=fs.readFileSync(path.join(root,'src/preload.cjs'),'utf8');
 for(const action of ['community-credit','community-remove','community-clear','obs-refresh-overlays'])assert.ok(preload.includes(action),action);
 const main=fs.readFileSync(path.join(root,'src/main.cjs'),'utf8');
 assert.match(main,/communityMembers:community\?\.list/);assert.match(main,/refreshBrowserSources/);
});
