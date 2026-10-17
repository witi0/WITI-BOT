'use strict';
let studioCurrentTab='gallery';
let selectedGiftKey='';
let overlayEditBaseline='';
let draftPreviewTimer;
function previewOverlayDraft(){clearTimeout(draftPreviewTimer);const editing=$('#overlayForm').elements.id.value;if(!previewIsDemo||!editing||selectedPreview!==editing)return;draftPreviewTimer=setTimeout(()=>{if(selectedPreview!==editing||$('#overlayForm').elements.id.value!==editing)return;const frame=$('#overlayPreview'),url=frame.getAttribute('src');if(!url)return;const data=overlayFormData();frame.style.width=data.width+'px';frame.style.height=data.height+'px';const available=$('#previewViewport').clientWidth||800;frame.style.transform='scale('+Math.min(1,(available-30)/Math.max(200,data.width),320/Math.max(100,data.height))+')';frame.contentWindow?.postMessage({type:'WITI_PREVIEW_DRAFT',overlay:data},new URL(url).origin);},120);}
$('#overlayForm').addEventListener('input',previewOverlayDraft);
$('#overlayForm').addEventListener('change',previewOverlayDraft);
function overlayFormSignature(){return JSON.stringify(Array.from(new FormData($('#overlayForm')).entries()));}
function overlayHasChanges(){return !!overlayEditBaseline&&overlayFormSignature()!==overlayEditBaseline;}
function allowOverlayChange(){return !overlayHasChanges()||confirm('Tienes cambios sin guardar. ¿Descartarlos y continuar?');}
function overlayDirtyHint(){const dirty=overlayHasChanges();$('#overlaySaveHint').textContent=dirty?'Cambios sin guardar':'Diseño guardado';}
$('#overlayForm').addEventListener('input',overlayDirtyHint);
$('#overlayForm').addEventListener('change',overlayDirtyHint);
window.addEventListener('beforeunload',event=>{if(overlayHasChanges()){event.preventDefault();event.returnValue='';}});
const studioNames={actions:'Alertas',music:'Música',topgifters:'Top donadores',toplikes:'Top likes',topgift:'Regalo destacado',topstreak:'Mayor racha',ranking:'Ranking',chat:'Chat',giftfeed:'Regalos',goal:'Meta',giftcounter:'Contador',webcam:'Cámara',timer:'Temporizador',wheel:'Ruleta',lastfollow:'Último follow',lastgift:'Último regalo'};
function studioTab(tab){
 studioCurrentTab=tab;
 for(const b of document.querySelectorAll('[data-studio-tab]')){const active=b.dataset.studioTab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));}
 for(const [id,name] of [['studioGalleryPane','gallery'],['studioMyPane','mine'],['studioEditorPane','editor']])document.getElementById(id).hidden=tab!==name;
 const tools=document.querySelector('.studio-toolbar');tools.hidden=tab==='editor';
}
for(const b of document.querySelectorAll('[data-studio-tab]'))b.addEventListener('click',()=>studioTab(b.dataset.studioTab));
for(const b of document.querySelectorAll('#studioColorPresets [data-color]'))b.addEventListener('click',()=>{const f=document.getElementById('overlayForm');f.elements.color.value=b.dataset.color;f.elements.secondary.value=b.dataset.secondary;overlayDirtyHint();previewOverlayDraft();});
function studioMini(kind,color='#f2a66f',title=''){
 const mini=node('div',undefined,'studio-mini mini-'+kind);mini.style.setProperty('--mini-accent',color||'#f2a66f');
 const symbol={music:'♫',chat:'💬',webcam:'▣',goal:'♥',giftcounter:'🎁',topgift:'🏆',topstreak:'⚡',lastgift:'🎁',lastfollow:'✦',giftfeed:'🎁',fireworks:'✶',coinjar:'◉',ranking:'🥇',topgifters:'🥇',toplikes:'♥',timer:'◷',actions:'✦',wheel:'◴'}[kind]||'◈';
 mini.append(node('div',symbol,'mini-symbol'));
 if(kind==='webcam'){mini.append(node('div','CAM','mini-webcam'));}
 else if(kind==='goal'||kind==='giftcounter'){mini.append(node('div','META EN DIRECTO','mini-caption'));const bar=node('div',undefined,'mini-meter');bar.append(node('i'));mini.append(bar);}
 else if(['topgift','topstreak','ranking','topgifters','toplikes'].includes(kind)){mini.append(node('div',kind==='topstreak'?'COMBO DESTACADO':'TOP DEL LIVE','mini-caption'));for(let i=0;i<3;i++)mini.append(node('div','', 'mini-rank rank-'+i));}
 else if(kind==='music'){mini.append(node('div','EN REPRODUCCIÓN','mini-caption'),node('div',title||'Canción actual','mini-name'));const bar=node('div',undefined,'mini-meter');bar.append(node('i'));mini.append(bar);}
 else if(kind==='chat'){mini.append(node('div','@espectador · ¡Buen directo!','mini-bubble'),node('div','@comunidad · 💜','mini-bubble'));}
 else if(kind==='timer'){mini.append(node('div','00:14:52','mini-timer'));}
 else if(kind==='actions'){mini.append(node('div','¡GRACIAS POR EL REGALO!','mini-caption'));}
 else mini.append(node('div',title||studioNames[kind]||kind,'mini-name'));
 return mini;
}
function studioCardButton(label,fn,primary=false){const b=node('button',label,primary?'primary':'');b.type='button';b.addEventListener('click',e=>{e.stopPropagation();Promise.resolve().then(fn).catch(err=>toast(err.message,true));});return b;}
function beginOverlayEdit(o,preview=true){if(!allowOverlayChange())return;editOverlay(o);studioTab('editor');if(preview)previewOverlay(o);document.getElementById('studioEditorPane').scrollIntoView?.({behavior:'smooth',block:'start'});}
function renderTemplates(){
 const list=(state.catalog||[]).filter(matchesOverlay);const root=$('#templateList');root.replaceChildren();$('#studioGalleryCount').textContent=list.length+' diseños';
 for(const t of list){const b=node('article',undefined,'studio-design-card');b.append(studioMini(t.kind,'#f2a66f',t.name));const content=node('div',undefined,'studio-design-body');const cat=node('div',t.category,'studio-tag');content.append(cat,node('h3',t.name),node('p',t.description));const controls=node('div',undefined,'studio-card-actions');controls.append(studioCardButton('＋ Añadir a mi estudio',async()=>{if(!allowOverlayChange())return;overlayEditBaseline='';const o=await call('create-template',t.template);await refresh();beginOverlayEdit(o);toast('Overlay creado. Personaliza y guarda sus ajustes.');},true));content.append(controls);b.append(content);root.append(b);}
 if(!list.length)empty(root,'No se encontraron diseños. Cambia de categoría o prueba otro término.');
}
renderOverlays=function(){
 const root=$('#overlayList');root.replaceChildren();const list=(state.overlays||[]).filter(matchesOverlay);$('#myOverlaysCount').textContent=state.overlays.length;
 for(const o of list){const card=node('article',undefined,'studio-design-card studio-owned-card');card.append(studioMini(o.kind,o.color,o.name));const body=node('div',undefined,'studio-design-body');body.append(node('div',studioNames[o.kind]||o.kind,'studio-tag'),node('h3',o.name),node('p',(o.width||800)+' × '+(o.height||450)+' · Fuente Navegador'));const primary=node('div',undefined,'studio-card-actions');primary.append(studioCardButton('◈ Probar',()=>{previewIsDemo=true;beginOverlayEdit(o);},true),studioCardButton('✧ Personalizar',()=>beginOverlayEdit(o)),studioCardButton('↗ Copiar URL',async()=>{await call('copy-overlay',o.id);toast('Enlace copiado. Pégalo como fuente Navegador en OBS.');}));body.append(primary);const more=document.createElement('details');more.className='studio-more';more.append(node('summary','Más opciones'));const buttons=node('div',undefined,'studio-card-actions');buttons.append(studioCardButton('Añadir a OBS',async()=>{const name=await call('obs-add-overlay',{id:o.id});if(name)toast('Fuente añadida: '+name);}),studioCardButton('Duplicar',async()=>{await call('duplicate-overlay',o.id);await refresh();}),studioCardButton('Exportar',()=>call('export-overlay',o.id)),studioCardButton('Eliminar',async()=>{if(!confirm('¿Eliminar el overlay «'+o.name+'»?'))return;await call('delete-overlay',o.id);if($('#overlayForm').elements.id.value===o.id){overlayEditBaseline='';$('#overlayForm').reset();$('#overlayForm').elements.id.value='';studioTab('mine');}if(selectedPreview===o.id)selectedPreview=null;await refresh();}));more.append(buttons);body.append(more);card.append(body);root.append(card);}
 if(!list.length)empty(root,'No tienes overlays con estos filtros. Explora la galería para añadir uno.');
};
const previousRenderStudio=renderStudio;
renderStudio=function(){previousRenderStudio();$('#myOverlaysCount').textContent=state.overlays.length;};
const originalEditOverlay=editOverlay;
editOverlay=function(o){originalEditOverlay(o);const f=$('#overlayForm');if(f.elements.stylePreset)f.elements.stylePreset.value=o.stylePreset||'glass';overlayEditBaseline=overlayFormSignature();overlayDirtyHint();};
$('#clearOverlay').addEventListener('click',event=>{if(!allowOverlayChange()){event.stopImmediatePropagation();event.preventDefault();return;}overlayEditBaseline='';},true);
const originalPreviewOverlay=previewOverlay;
previewOverlay=function(o,scroll=false){originalPreviewOverlay(o,scroll);if(!overlayHasChanges())document.getElementById('overlaySaveHint').textContent=(o.width||800)+' × '+(o.height||450);};
$('#clearOverlay').addEventListener('click',()=>{studioTab('editor');overlayEditBaseline=overlayFormSignature();overlayDirtyHint();});
function safeGiftArt(g){const wrap=node('div',undefined,'gift-art');if(typeof g?.image==='string'&&(/^(https:\/\/|http:\/\/127\.0\.0\.1:)/).test(g.image)){const img=node('img');img.src=g.image;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';wrap.append(img);}else wrap.append(node('span','🎁'));return wrap;}
function selectGift(g){
 selectedGiftKey=g.source+':'+g.id;
 $('#giftInspectorArt').replaceChildren(safeGiftArt(g));$('#giftInspectorName').textContent=g.name;
 $('#giftInspectorPrice').textContent=Number(g.coins||0).toLocaleString('es-MX')+' monedas';
 $('#giftInspectorSource').textContent=(g.source==='live'?'Disponible en el LIVE conectado':'Catálogo de referencia')+' · ID '+g.id;
 $('#giftCreateAlert').disabled=false;$('#giftCreateCounter').disabled=false;
 document.querySelectorAll('.gift-tile').forEach(el=>{const selected=el.dataset.giftKey===selectedGiftKey;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});
}
function giftSelected(){return giftCache.find(g=>g.source+':'+g.id===selectedGiftKey);}
for(const id of ['giftOrigin','giftCost','giftSort'])document.getElementById(id).onchange=()=>{giftPage=0;renderGifts();};
$('#giftCreateAlert').addEventListener('click',()=>{const g=giftSelected();if(!g)return;clearRule();const f=$('#ruleForm');f.elements.trigger.value='gift';f.elements.name.value='Alerta · '+g.name;f.elements.match.value=g.source==='live'?String(g.id):g.name;document.querySelector('nav button[data-page="rules"]').click();$('#ruleForm').scrollIntoView?.({behavior:'smooth',block:'start'});toast('Regalo seleccionado. Elige las acciones y guarda la regla.');});
$('#giftCreateCounter').addEventListener('click',()=>{safe(async()=>{const g=giftSelected();if(!g)return;if(!allowOverlayChange())return;overlayEditBaseline='';const template=state.catalog.find(t=>t.kind==='giftcounter');if(!template)throw Error('No está disponible la plantilla de contador');const o=await call('create-template',template.template);const saved=await call('save-overlay',{...o,giftId:g.source==='live'?String(g.id):g.name,name:'Contador · '+g.name,target:100,goalStyle:'bar'});await refresh();document.querySelector('nav button[data-page="overlays"]').click();beginOverlayEdit(saved);toast('Contador creado. Elige el objetivo y copia su enlace a OBS.');})();});
function giftSearchKey(value){return String(value).trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-MX');}
renderGifts=function(){
 const root=$('#giftList'),q=giftSearchKey($('#giftSearch').value),mx=$('#giftsMX').checked;
 const origin=$('#giftOrigin').value,cost=$('#giftCost').value,sort=$('#giftSort').value;root.replaceChildren();
 let list=giftCache.filter(g=>{
  if(mx&&g.source!=='live'&&!g.regions?.includes('MX'))return false;
  if(origin!=='all'&&g.source!==origin)return false;
  if(q&&!giftSearchKey(g.name+' '+g.id+' '+g.coins).includes(q))return false;
  const coins=Number(g.coins)||0;
  if(cost==='1-99'&&(coins<1||coins>99))return false;
  if(cost==='100-999'&&(coins<100||coins>999))return false;
  if(cost==='1000-9999'&&(coins<1000||coins>9999))return false;
  if(cost==='10000+'&&coins<10000)return false;
  return true;
 });
 list=list.slice().sort((a,b)=>sort==='cheap'?a.coins-b.coins||a.name.localeCompare(b.name):sort==='expensive'?b.coins-a.coins||a.name.localeCompare(b.name):a.name.localeCompare(b.name,'es'));
 const total=Math.max(1,Math.ceil(list.length/24));giftPage=Math.min(giftPage,total-1);
 $('#giftResultSummary').textContent=list.length+' regalos encontrados';$('#giftPageStatus').textContent='Página '+(giftPage+1)+' de '+total;
 $('#giftPrevious').disabled=giftPage<=0;$('#giftNext').disabled=giftPage>=total-1;
 $('#giftSource').textContent=liveGifts?('● '+liveGifts+' regalos sincronizados con el LIVE · catálogo de referencia adicional'):('○ Catálogo de referencia · conecta TikTok para verificar regalos disponibles');
 for(const g of list.slice(giftPage*24,(giftPage+1)*24)){
  const card=node('button',undefined,'gift-tile');card.type='button';card.dataset.giftKey=g.source+':'+g.id;card.setAttribute('aria-label','Seleccionar '+g.name);
  card.append(safeGiftArt(g));card.append(node('strong',g.name),node('span',(Number(g.coins)||0).toLocaleString('es-MX')+' ◈','gift-cost'));card.append(node('small',g.source==='live'?'LIVE':'Referencia','gift-status '+(g.source==='live'?'live':'')));
  card.setAttribute('aria-pressed',String(card.dataset.giftKey===selectedGiftKey));card.classList.toggle('selected',card.dataset.giftKey===selectedGiftKey);card.onclick=()=>selectGift(g);root.append(card);
 }
 if(!list.length)empty(root,'No hay regalos con esos filtros. Prueba otro valor o búsqueda.');
 const selected=list.find(g=>g.source+':'+g.id===selectedGiftKey);if(!selected){selectedGiftKey='';$('#giftInspectorArt').replaceChildren(safeGiftArt(null));$('#giftInspectorSource').textContent='Elige un regalo para crear una alerta o un contador';$('#giftInspectorName').textContent='Selecciona un regalo';$('#giftInspectorPrice').textContent='— monedas';$('#giftCreateAlert').disabled=true;$('#giftCreateCounter').disabled=true;}
};
studioTab('gallery');
