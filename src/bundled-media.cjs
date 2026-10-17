'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function installBundledMedia(store,mediaDir,bundleDir=path.join(__dirname,'../assets/personal')){
 const file=path.join(bundleDir,'manifest.json');if(!fs.existsSync(file))return {sounds:0,images:0};
 const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
 fs.mkdirSync(mediaDir,{recursive:true});
 if(store.get('installedMediaPack')===manifest.id)return {sounds:0,images:0,alreadyInstalled:true};
 const sounds=store.get('importedSounds')||[],images=store.get('giftImageFiles')||{},meta=store.get('soundMetadata')||{};
 const allowedImages=new Set(require('../assets/gifts/catalog.json').gifts.map(g=>g.imageFile));
 let added=0,art=0;
 function copy(item,kind){
  const pattern=kind==='sounds'?/^memes\/[a-z\d_-]+\.mp3$/:/^gifts\/[a-z\d'-]+\.webp$/;
  if(!pattern.test(item.path)||!/^[a-f\d]{64}$/.test(item.sha256))throw Error('Recurso incluido inválido');
  const bytes=fs.readFileSync(path.join(bundleDir,item.path));
  if(bytes.length!==item.size||crypto.createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Recurso incluido dañado: '+item.path);
  if(kind==='images'&&(bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP'))throw Error('Imagen incluida inválida');
  const name=item.sha256+path.extname(item.path),target=path.join(mediaDir,name);
  if(!fs.existsSync(target))fs.writeFileSync(target,bytes,{mode:0o600});
  return name;
 }
 for(const item of manifest.sounds){const expected=item.sha256+path.extname(item.path);if(store.get('installedMediaPack')&&!sounds.some(s=>s.id===expected))continue;const id=copy(item,'sounds');if(sounds.some(s=>s.id===id))continue;sounds.push({id,file:id,name:item.name,category:'Memes de WITI BOT',origin:'Colección de Witi',duration:item.duration,bundled:true});if(/mr.?beast/i.test(item.name)&&!meta[id])meta[id]={favorite:true};added++;}
 for(const item of manifest.images){const filename=path.basename(item.path);if(!allowedImages.has(filename))continue;const id=copy(item,'images');if(!images[filename])images[filename]=id;art++;}
 store.set('importedSounds',sounds);store.set('soundMetadata',meta);store.set('giftImageFiles',images);store.set('installedMediaPack',manifest.id);
 return {sounds:added,images:art};
}
function audioPayload(a){const legacy=a.type==='sound'&&/^witi-\d{3}\.wav$/.test(a.sound||'');return {media:a.type==='sound'&&!legacy?a.sound:a.media,sound:legacy?a.sound:undefined};}
module.exports={installBundledMedia,audioPayload};
