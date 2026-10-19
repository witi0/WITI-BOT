'use strict';
let screensSnapshot=null,screensSelected=null,screensColors=['#8652ff','#c292ff','#fcb7fb','#8298ff','#8652ff'];
function renderScreens(snapshot){
 if(!document.getElementById('screensList'))return;
 screensSnapshot=snapshot;
 const root=document.getElementById('screensList'),picker=document.getElementById('screensRgbTarget'),chosen=picker.value||screensSelected;
 root.replaceChildren();picker.replaceChildren();
 const list=(snapshot.overlays||[]).slice().sort((a,b)=>{
  const order=['chat','giftfeed','commandresponses','actions'];const idx=o=>order.includes(o.kind)?order.indexOf(o.kind):10;return idx(a)-idx(b);
 });
 for(const overlay of list){
  const block=document.createElement('article');block.className='screen-item';
  const tag=document.createElement('div');tag.className='screen-tag';tag.textContent=({chat:'Comentarios en LIVE',giftfeed:'Regalos',commandresponses:'Respuestas de comandos',actions:'Alertas visuales'}[overlay.kind]||'Pantalla OBS');
  const name=document.createElement('h3');name.textContent=overlay.name;const desc=document.createElement('p');desc.textContent=({chat:'Muestra quién comenta y el mensaje enviado',giftfeed:'Muestra icono, cantidad y nombre de quien donó',commandresponses:'Mensajes de /puntos, errores y respuestas con RGB',actions:'Alertas visuales, GIF, video y mensajes'}[overlay.kind]||'Overlay personalizado');
  const url=document.createElement('input');url.type='text';url.readOnly=true;url.value=snapshot.urls?.[overlay.id]||'';url.setAttribute('aria-label','Enlace OBS de '+overlay.name);url.onclick=()=>url.select();
  const buttons=document.createElement('div');buttons.className='screen-actions';
  const add=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=async()=>{try{await fn();}catch(e){screensStatus(e.message);}};buttons.append(b);return b;};
  add('Copiar URL',async()=>{await window.witi.call('copy-overlay',overlay.id);screensStatus('Enlace de '+overlay.name+' copiado. OBS → Fuente Navegador.');});
  const obs=add('Añadir a OBS',async()=>{const n=await window.witi.call('obs-add-overlay',{id:overlay.id});if(n)screensStatus('Fuente creada en OBS: '+n);});obs.disabled=!snapshot.obsConnected;obs.title=snapshot.obsConnected?'Añade fuente Navegador':'Conecta OBS antes de añadir automáticamente';
  add('Editar RGB',async()=>{picker.value=overlay.id;chooseScreens(overlay.id);document.getElementById('screensRgbTarget').scrollIntoView({behavior:'smooth',block:'center'});});
  block.append(tag,name,desc,url,buttons);root.append(block);
  const option=document.createElement('option');option.value=overlay.id;option.textContent=overlay.name;picker.append(option);
 }
 if(list.length){const id=list.some(o=>o.id===chosen)?chosen:list[0].id;picker.value=id;if(screensSelected!==id)chooseScreens(id);}else screensStatus('Sin pantallas: añade una desde Overlays.');
}
function screensStatus(s){const n=document.getElementById('screensStatus');if(n)n.textContent=s;}
function chooseScreens(id){
 const o=screensSnapshot?.overlays?.find(o=>o.id===id);if(!o)return;screensSelected=id;
 screensColors=Array.isArray(o.rgbColors)&&o.rgbColors.length>=2?o.rgbColors.slice():['#8652ff','#c292ff','#fcb7fb','#8298ff','#8652ff'];
 const $=id=>document.getElementById(id);$('screensRgbEnabled').checked=o.rgb!==false;$('screensRgbText').checked=o.textRgb!==false;$('screensRgbBorder').checked=o.borderRgb!==false;$('screensRgbTransparent').checked=!!o.transparent;
 $('screensRgbSpeed').value=Number(o.rgbSpeed)||3;$('screensRgbAngle').value=Number(o.rgbAngle)||90;$('screensRgbDirection').value=o.rgbDirection||'normal';paintScreens();
}
function paintScreens(){
 const root=document.getElementById('screensPalette'),swatch=document.getElementById('screensSwatch');if(!root||!swatch)return;root.replaceChildren();
 screensColors.forEach((c,i)=>{const label=document.createElement('label');label.textContent='Color '+(i+1);const inp=document.createElement('input');inp.type='color';inp.value=c;inp.oninput=()=>{screensColors[i]=inp.value;applyScreensGradient();};label.append(inp);root.append(label);});applyScreensGradient();
}
function applyScreensGradient(){const sw=document.getElementById('screensSwatch'),speed=document.getElementById('screensRgbSpeed');if(!sw)return;
 sw.style.backgroundImage=`linear-gradient(${Number(document.getElementById('screensRgbAngle').value)||90}deg,${screensColors.join(',')})`;
 sw.style.setProperty('--screens-speed',speed.value+'s');sw.style.animationDirection=document.getElementById('screensRgbDirection').value;
 document.getElementById('screensRgbSpeedOut').textContent=Number(speed.value).toFixed(1)+'s';
}
(()=>{const $=id=>document.getElementById(id);if(!$('screensList'))return;
 const enabled=document.createElement('label');enabled.innerHTML='<input type="checkbox" id="screensRgbEnabled" checked> Activar RGB de esta pantalla';$('screensRgbText').closest('label').before(enabled);
 $('screensRgbTarget').onchange=()=>chooseScreens($('screensRgbTarget').value);
 for(const id of ['screensRgbSpeed','screensRgbAngle','screensRgbDirection'])$(id).addEventListener('input',applyScreensGradient);
 $('screensAddColor').onclick=()=>{if(screensColors.length<12){screensColors.push('#cf9aff');paintScreens();}};
 $('screensRemoveColor').onclick=()=>{if(screensColors.length>2){screensColors.pop();paintScreens();}};
 $('screensRainbow').onclick=()=>{screensColors=['#ff0055','#ffbf00','#00ff88','#00f0ff','#4167ff','#ff45e2','#ff0055'];paintScreens();};
 $('screensPurple').onclick=()=>{screensColors=['#8652ff','#c292ff','#fcb7fb','#8298ff','#8652ff'];paintScreens();};
 $('screensChatPopout').onclick=()=>window.witi.call('open-live-popout','chat').catch(e=>screensStatus(e.message));
 $('screensGiftPopout').onclick=()=>window.witi.call('open-live-popout','activity').catch(e=>screensStatus(e.message));
 $('screensRefresh').onclick=()=>window.witi.call('snapshot').then(renderScreens).catch(e=>screensStatus(e.message));
 $('screensSaveRgb').onclick=async()=>{const o=screensSnapshot?.overlays?.find(o=>o.id===$('screensRgbTarget').value);if(!o)return;
  try{const textRgb=$('screensRgbText').checked,borderRgb=$('screensRgbBorder').checked;const out={...o,rgb:$('screensRgbEnabled').checked,textRgb,borderRgb,transparent:$('screensRgbTransparent').checked,rgbColors:screensColors.slice(),rgbSpeed:Number($('screensRgbSpeed').value),rgbAngle:Number($('screensRgbAngle').value),rgbDirection:$('screensRgbDirection').value};await window.witi.call('save-overlay',out);screensStatus('RGB de '+o.name+' guardado. OBS lo recibirá automáticamente.');screensSnapshot=await window.witi.call('snapshot');renderScreens(screensSnapshot);}catch(e){screensStatus('Error: '+e.message);}
 };
})();
