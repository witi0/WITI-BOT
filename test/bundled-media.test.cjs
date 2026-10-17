'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {Store,validateRule}=require('../src/core.cjs'),{installBundledMedia,audioPayload}=require('../src/bundled-media.cjs'),{mergedCatalog}=require('../src/gifts.cjs'),{startOverlayServer}=require('../src/overlay.cjs');
async function setup(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'witi-bundle-')),store=await Store.open(dir);t.after(()=>{store.db.close();fs.rmSync(dir,{recursive:true,force:true});});return {dir,store,media:path.join(dir,'media')};}
test('colección completa lista al primer inicio: 120 audios sin imágenes; actualización conserva preferencias y borrados',async t=>{
 const {store,media}=await setup(t);assert.deepEqual(installBundledMedia(store,media),{sounds:120,images:0});const sounds=store.get('importedSounds'),art=store.get('giftImageFiles');assert.equal(sounds.length,120);assert.equal(Object.keys(art).length,0);assert.ok(sounds.some(s=>s.name==='MrBeast Rizz'&&s.duration>0));
 const mr=sounds.find(s=>s.name==='MrBeast Rizz');store.set('soundMetadata',{[mr.id]:{name:'Mi favorito',favorite:true}});store.set('importedSounds',sounds.filter(s=>s.id!==sounds[1].id));fs.unlinkSync(path.join(media,sounds[1].file));assert.equal(installBundledMedia(store,media).alreadyInstalled,true);assert.equal(store.get('importedSounds').length,119);assert.equal(store.get('soundMetadata')[mr.id].name,'Mi favorito');assert.ok(!fs.existsSync(path.join(media,sounds[1].file)));
 const srv=await startOverlayServer(store,media,{port:0});t.after(()=>srv.close());const mapped=mergedCatalog([],Object.fromEntries(Object.entries(art).map(([k,v])=>[k,srv.asset(v)])));assert.equal(mapped.gifts.filter(g=>!!g.image).length,0);for(const url of [srv.asset(mr.file)]){const r=await fetch(url);assert.equal(r.status,200);assert.ok((await r.arrayBuffer()).byteLength>100);}
});
test('reglas aceptan MP3 de la biblioteca y despachan a la ruta media; rechazan traversal',()=>{
 const sound='a'.repeat(64)+'.mp3',overlay='7b1decf3-156d-4247-a9ad-53aa651ff693';const a={type:'sound',sound,overlay};assert.equal(validateRule({name:'Meme',trigger:'gift',enabled:true,cooldown:0,actions:[a]},[overlay]).actions[0].sound,sound);assert.deepEqual(audioPayload(a),{media:sound,sound:undefined});assert.deepEqual(audioPayload({...a,sound:'witi-001.wav'}),{media:undefined,sound:'witi-001.wav'});assert.throws(()=>validateRule({name:'X',trigger:'gift',actions:[{...a,sound:'../../private.mp3'}]},[overlay]));
});
test('instalación nueva incluye ocho pantallas útiles y mantiene sus URLs al reabrir',async t=>{
 const {store,dir}=await setup(t),screens=store.list('overlays');assert.equal(screens.length,8);for(const kind of ['actions','music','topgifters','toplikes','goal','timer','chat','lastgift'])assert.ok(screens.some(o=>o.kind===kind));assert.ok(screens.every(o=>o.borderRgb&&o.color==='#f2a66f'));store.flush();const reopened=await Store.open(dir);try{assert.deepEqual(reopened.list('overlays').map(o=>o.id),screens.map(o=>o.id));}finally{reopened.db.close();}
});
test('rechaza manifiesto de medios alterado sin marcar instalación como completada',async t=>{
 const {store,dir,media}=await setup(t),bundle=path.join(dir,'bundle');fs.mkdirSync(path.join(bundle,'memes'),{recursive:true});fs.writeFileSync(path.join(bundle,'memes/x.mp3'),'corrupto');fs.writeFileSync(path.join(bundle,'manifest.json'),JSON.stringify({id:'invalid',sounds:[{path:'memes/x.mp3',sha256:'a'.repeat(64),size:8}],images:[]}));assert.throws(()=>installBundledMedia(store,media,bundle),/dañado/);assert.equal(store.get('installedMediaPack'),undefined);
});

test('actualización retira imágenes incluidas, conserva personalizadas y no restaura audios borrados',async t=>{
 const {store,media}=await setup(t),manifest=require('../assets/personal/manifest.json');fs.mkdirSync(media,{recursive:true});const [old,used]=manifest.retiredGiftImages,custom='f'.repeat(64)+'.webp';
 for(const id of [old,used,custom])fs.writeFileSync(path.join(media,id),'fixture');store.set('giftImageFiles',{'old.webp':old,'used.webp':used,'custom.webp':custom});store.save('rules',{id:'fixture',actions:[{type:'media',media:used}]});store.set('installedMediaPack',manifest.id);store.set('importedSounds',[]);
 assert.equal(installBundledMedia(store,media).alreadyInstalled,true);assert.deepEqual(store.get('giftImageFiles'),{'custom.webp':custom});assert.equal(fs.existsSync(path.join(media,old)),false);assert.equal(fs.existsSync(path.join(media,used)),true);assert.equal(fs.existsSync(path.join(media,custom)),true);assert.equal(store.get('importedSounds').length,0);
});
