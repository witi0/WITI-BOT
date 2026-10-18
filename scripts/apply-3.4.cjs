'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,value)=>fs.writeFileSync(path.join(root,p),value,'utf8');
function updateMarkup(file){
 let value=read(file);
 const mark='<link rel="stylesheet" href="crafted.css">';
 if(!value.includes('href="apple-solid.css"')){
  if(!value.includes(mark))throw Error(`No se encontró el enlace crafted.css en ${file}`);
  value=value.replace(mark,mark+'<link rel="stylesheet" href="apple-solid.css">');
 }
 if(file==='renderer/index.html'){
  value=value.replaceAll('WITI BOT V3.3','WITI BOT V3.4').replaceAll('>V3.3<','>V3.4<');
 }
 return value;
}
function run(){
 for(const p of ['renderer/index.html','renderer/legacy12-overlays.html','renderer/widget.css','renderer/apple-solid.css','renderer/widget-apple.css','package.json','package-lock.json'])if(!fs.existsSync(path.join(root,p)))throw Error(`Falta ${p}`);
 const updates=new Map();
 for(const p of ['renderer/index.html','renderer/legacy12-overlays.html'])updates.set(p,updateMarkup(p));
 const marker='--witi-apple-widget-34:1';
 const widget=read('renderer/widget.css');
 updates.set('renderer/widget.css',widget.includes(marker)?widget:widget.trimEnd()+'\n\n'+read('renderer/widget-apple.css').trim()+'\n');
 const pkg=JSON.parse(read('package.json'));
 if(pkg.name!=='witi-bot')throw Error('El package.json no es de WITI BOT');
 if(!['3.3.0','3.4.0'].includes(pkg.version))throw Error(`Versión base inesperada: ${pkg.version}`);
 pkg.version='3.4.0';
 updates.set('package.json',JSON.stringify(pkg,null,2)+'\n');
 const lock=JSON.parse(read('package-lock.json'));
 if(lock.name!=='witi-bot'||!lock.packages?.[''])throw Error('El package-lock.json no es compatible');
 lock.version='3.4.0';lock.packages[''].version='3.4.0';
 updates.set('package-lock.json',JSON.stringify(lock,null,2)+'\n');
 for(const [p,value] of updates)if(read(p)!==value)write(p,value);
 process.stdout.write('WITI BOT 3.4.0: interfaz, overlays, widget y versiones actualizados.\n');
}
if(require.main===module){try{run()}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={run,updateMarkup};
