const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
async function verifyInstaller(outDir){
 const {getPath7za}=require('app-builder-lib/out/toolsets/7zip');const seven=await getPath7za();const pkg=require('../package.json');const file=path.join(outDir,`WITI_BOT_Setup_v${pkg.version}.exe`),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'witi-installer-check-'));const run=args=>execFileSync(seven,args,{encoding:'utf8',maxBuffer:8*1024*1024});
 try{
  run(['t',file]);run(['e',file,'-o'+tmp,'$PLUGINSDIR/app-64.7z','-y']);const payload=path.join(tmp,'app-64.7z');run(['t',payload]);const list=run(['l','-slt',payload]);
  if(!/Path = WITI BOT\.exe[\r\n]/.test(list)||!list.includes('app.asar'))throw Error('Faltan ejecutable o recursos en el instalador');
  if(/Path = \.(?:electron|WITI BOT)\.exe/.test(list))throw Error('El instalador contiene copias temporales de ejecutables');
  run(['e',payload,'-o'+tmp,'resources/app.asar','-y']);const asarFile=path.join(tmp,'app.asar');const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(hash(asarFile)!==hash(path.join(outDir,'win-unpacked/resources/app.asar')))throw Error('Los recursos del instalador no coinciden con el build');
  const asar=require('@electron/asar'),files=asar.listPackage(asarFile);const wavs=files.filter(f=>/\/assets\/sounds\/witi-\d{3}\.wav$/.test(f));if(wavs.length!==0)throw Error('El instalador contiene efectos retirados');for(const name of ['/src/gallery.cjs','/src/spotify.cjs','/src/tiktok.cjs','/src/tiktok-login.cjs','/src/updates.cjs','/renderer/widget.js','/renderer/studio.js'])if(!files.includes(name))throw Error('Falta '+name);if(files.some(f=>/PRIVATE|\.pem$/.test(f)))throw Error('Se encontró un archivo privado en el instalador');
  const manifest=JSON.parse(asar.extractFile(asarFile,'assets/personal/manifest.json'));let verified=0;for(const item of [...manifest.sounds,...manifest.images]){const bytes=asar.extractFile(asarFile,'assets/personal/'+item.path);if(bytes.length!==item.size||crypto.createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Recurso empaquetado dañado: '+item.path);verified++;}
  const result={bundledAudioCount:manifest.sounds.length,bundledGiftImages:manifest.images.length,bundledResourcesVerified:verified,version:pkg.version,file:path.basename(file),bytes:fs.statSync(file).size,sha256:hash(file),nsisIntegrity:true,payloadIntegrity:true,resourcesMatchBuild:true,bundledWavCount:wavs.length,privateKeyBundled:false,windowsExecutionTest:'NOT_RUN'};fs.writeFileSync(path.join(outDir,'verification.json'),JSON.stringify(result,null,2)+'\n');return result;
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
if(require.main===module)verifyInstaller(path.resolve(process.argv[2]||'dist')).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={verifyInstaller};
