'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const script=path.join(__dirname,'../scripts/apply-3.4.cjs');
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'witi-3.4-'));
 fs.mkdirSync(path.join(root,'renderer'));
 const put=(p,s)=>fs.writeFileSync(path.join(root,p),s);
 put('renderer/index.html','<link rel="stylesheet" href="crafted.css">WITI BOT V3.3 <span>V3.3</span>');
 put('renderer/legacy12-overlays.html','<link rel="stylesheet" href="crafted.css">');
 put('renderer/widget.css','.card{border:1px solid red}');
 put('renderer/apple-solid.css',':root{--apple-blue:#0a84ff}');
 put('renderer/widget-apple.css',':root{--witi-apple-widget-34:1}');
 put('package.json',JSON.stringify({name:'witi-bot',version:'3.3.0',scripts:{start:'electron .'}}));
 put('package-lock.json',JSON.stringify({name:'witi-bot',version:'3.3.0',packages:{'':{name:'witi-bot',version:'3.3.0'}}}));
 return root;
}
test('3.4 aplica los cambios a los tres destinos y conserva contenido existente',t=>{
 const dir=fixture();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const run=()=>spawnSync(process.execPath,[script,dir],{encoding:'utf8'});
 assert.equal(run().status,0);
 for(const name of ['renderer/index.html','renderer/legacy12-overlays.html']){
  const text=fs.readFileSync(path.join(dir,name),'utf8');
  assert.match(text,/href="crafted\.css"><link rel="stylesheet" href="apple-solid\.css">/);
 }
 const widget=fs.readFileSync(path.join(dir,'renderer/widget.css'),'utf8');
 assert.match(widget,/border:1px solid red/);
 assert.match(widget,/--witi-apple-widget-34:1/);
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'package-lock.json'))).packages[''].version,'3.4.0');
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'package.json'))).version,'3.4.0');
 assert.match(fs.readFileSync(path.join(dir,'renderer/index.html'),'utf8'),/WITI BOT V3.4/);
 const before=['renderer/index.html','renderer/legacy12-overlays.html','renderer/widget.css','package.json','package-lock.json'].map(p=>fs.readFileSync(path.join(dir,p),'utf8'));
 assert.equal(run().status,0);
 assert.deepEqual(['renderer/index.html','renderer/legacy12-overlays.html','renderer/widget.css','package.json','package-lock.json'].map(p=>fs.readFileSync(path.join(dir,p),'utf8')),before);
});
test('3.4 rechaza repositorios de otro producto sin modificar archivos',t=>{
 const dir=fixture();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const pkg=path.join(dir,'package.json');fs.writeFileSync(pkg,JSON.stringify({name:'otro',version:'1.0.0'}));
 const before=fs.readFileSync(path.join(dir,'renderer/index.html'),'utf8');
 assert.notEqual(spawnSync(process.execPath,[script,dir],{encoding:'utf8'}).status,0);
 assert.equal(fs.readFileSync(path.join(dir,'renderer/index.html'),'utf8'),before);
});
