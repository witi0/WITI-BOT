(() => {
 'use strict';
 const $ = s => document.querySelector(s);
 const definitions=[['overlays','🎬 Abrir overlays','CTRL+ALT+O'],['rules','⚡ Abrir eventos','CTRL+ALT+E'],['sounds','🔊 Abrir sonidos','CTRL+ALT+S'],['gifts','🎁 Abrir regalos','CTRL+ALT+G'],['connections','🔌 Abrir conexiones','CTRL+ALT+C'],['tts','🎙️ Abrir voces','CTRL+ALT+V'],['stop','⏹️ Detener audios','CTRL+ALT+X']];
 let hotkeys=Object.fromEntries(definitions.map(([key,,shortcut])=>[key,shortcut]));
 function paint(a){document.body.classList.toggle('theme-rgb',a.rgb!==false);document.body.classList.toggle('reduce-motion',!!a.reducedMotion);$('#themeRgb').checked=a.rgb!==false;$('#reduceMotion').checked=!!a.reducedMotion;}
 function shortcutKey(e){const prefix=[e.ctrlKey?'CTRL':'',e.altKey?'ALT':'',e.shiftKey?'SHIFT':''].filter(Boolean).join('+');return (prefix?prefix+'+':'')+String(e.key).toUpperCase();}
 function renderShortcuts(){const rows=$('#shortcutRows');rows.replaceChildren();for(const [key,name] of definitions){const box=document.createElement('label'),label=document.createElement('span'),input=document.createElement('input');box.className='shortcut-key';label.textContent=name;input.dataset.key=key;input.value=hotkeys[key];input.readOnly=true;input.title='Seleccionar y presionar una combinación';input.addEventListener('keydown',e=>{if(e.key==='Tab')return;e.preventDefault();if(!/^[A-Za-z0-9]$/.test(e.key))return;input.value=shortcutKey(e);});box.append(label,input);rows.append(box);}}
 function hydrate(){window.witi.call('snapshot').then(s=>{paint(s.appearance||{rgb:true});hotkeys={...hotkeys,...s.shortcuts};renderShortcuts();}).catch(()=>{}).finally(()=>{document.getElementById('appSplash')?.classList.add('done');});}
 $('#appearanceForm').onsubmit=async e=>{e.preventDefault();try{const settings=await window.witi.call('appearance-set',{rgb:$('#themeRgb').checked,reducedMotion:$('#reduceMotion').checked});paint(settings);}catch(err){alert(err.message);}};
 $('#shortcutForm').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries([...document.querySelectorAll('#shortcutRows input')].map(i=>[i.dataset.key,i.value]));try{hotkeys=await window.witi.call('shortcuts-set',data);renderShortcuts();}catch(err){alert(err.message);}};
 $('#resetShortcuts').onclick=()=>{hotkeys=Object.fromEntries(definitions.map(([key,,v])=>[key,v]));renderShortcuts();};
 document.addEventListener('keydown',e=>{const tag=e.target?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag)||e.target?.isContentEditable)return;if(e.key==='Escape'&&document.querySelector('#updatePopup:not([hidden])'))return;const match=Object.entries(hotkeys).find(([,value])=>value===shortcutKey(e));if(!match)return;e.preventDefault();const name=match[0];if(name==='stop'){window.witi.call('stop').catch(()=>{});return;}document.querySelector('nav button[data-page="'+name+'"]')?.click();});
 document.querySelectorAll('nav button').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.page==='shortcuts')renderShortcuts();}));
 hydrate();
})();
