(()=>{
'use strict';
const form=document.querySelector('#ttsSettingsForm'),fields=form.elements;let settingsLoaded=false,commands=[];
const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
function renderCommands(){const root=document.querySelector('#commandRows');root.replaceChildren();commands.forEach((c,i)=>{
 const row=make('fieldset');row.className='command-config';const title=make('legend',c.name||'Nuevo comando');row.append(title);
 const grid=make('div');grid.className='command-grid';
 function input(label,key,type='text'){const l=make('label',label),el=make('input');el.type=type;if(type==='checkbox')el.checked=!!c[key];else el.value=c[key]??'';if(type==='number'){el.min=0;el.max=key==='cost'?1000000:3600;}el.oninput=()=>c[key]=type==='checkbox'?el.checked:type==='number'?Number(el.value):el.value;l.append(el);grid.append(l);}
 input('Activado','enabled','checkbox');input('Comando','name');const alias=make('label','Alias (comas)'),aliasInput=make('input');aliasInput.value=(c.aliases||[]).join(', ');aliasInput.oninput=()=>c.aliases=aliasInput.value.split(',').map(x=>x.trim()).filter(Boolean);alias.append(aliasInput);grid.append(alias);
 function select(label,key,options){const l=make('label',label),el=make('select');for(const [value,text]of options){const o=make('option',text);o.value=value;el.append(o);}el.value=c[key];el.onchange=()=>c[key]=el.value;l.append(el);grid.append(l);}
 select('Acción','action',[['play','Añadir música a Spotify'],['points','Consultar puntos'],['skip','Saltar canción'],['tts','Leer texto en voz alta'],['reply','Respuesta personalizada']]);input('Costo en puntos','cost','number');input('Recarga / usuario (s)','cooldown','number');select('Permisos','audience',[['all','Todos'],['moderator','Moderadores'],['subscriber','Suscriptores'],['topgifter','Top gifters']]);input('Respuesta: {user}, {args}, {points}','text');
 const remove=make('button','Eliminar');remove.type='button';remove.onclick=()=>{commands.splice(i,1);renderCommands();};grid.append(remove);row.append(grid);root.append(row);
 });}
async function load(){try{const s=await window.witi.call('snapshot');if(settingsLoaded)return;settingsLoaded=true;const t=s.ttsSettings||{};
 for(const k of ['prefixEnabled','skipCommands'])fields[k].checked=t[k]!==false;
 for(const k of ['audience','topDonors','minMemberLevel','minGifterLevel','cooldown','maxLength','blockedUsers','blockedWords'])fields[k].value=t[k]??({audience:'all',cooldown:3,maxLength:300,blockedUsers:'',blockedWords:''}[k]??0);
 ['moderator','subscriber','topgifter'].forEach((r,i)=>fields[['roleMod','roleSub','roleTop'][i]].checked=(t.allowedRoles||[]).includes(r));
 document.querySelector('#audioSettingsForm').elements.gapMs.value=s.audioSettings?.gapMs||0;document.querySelector('#audioSettingsForm').elements.interruptCritical.checked=s.audioSettings?.interruptCritical!==false;commands=structuredClone(s.commands||[]);renderCommands();fields.prefix.disabled=!fields.prefixEnabled.checked;
 }catch(e){document.querySelector('#commandSaveStatus').textContent=e.message;}}
fields.prefixEnabled.onchange=()=>fields.prefix.disabled=!fields.prefixEnabled.checked;
form.onsubmit=async e=>{e.preventDefault();const d={};for(const k of ['enabled','prefixEnabled','readName','skipCommands'])d[k]=fields[k].checked;for(const k of ['prefix','audience','blockedUsers','blockedWords'])d[k]=fields[k].value;for(const k of ['minMemberLevel','minGifterLevel','topDonors','cooldown','maxLength'])d[k]=Number(fields[k].value);d.allowedRoles=['moderator','subscriber','topgifter'].filter((r,i)=>fields[['roleMod','roleSub','roleTop'][i]].checked);Object.assign(d,{engine:document.querySelector('#voiceEngine').value,voice:document.querySelector('#voiceList').value,rate:Number(document.querySelector('#rate').value),pitch:Number(document.querySelector('#pitch').value),random:document.querySelector('#randomVoice').checked});try{await window.witi.call('tts-settings',d);document.querySelector('#voiceStatus').textContent='Preferencias de lectura guardadas';}catch(err){document.querySelector('#voiceStatus').textContent=err.message;}};
document.querySelector('#commandAdd').onclick=()=>{commands.push({name:'/nuevo'+(commands.length+1),aliases:[],action:'reply',cost:0,cooldown:5,audience:'all',enabled:false,text:'Hola {user}'});renderCommands();};
document.querySelector('#commandSave').onclick=async()=>{const status=document.querySelector('#commandSaveStatus');try{commands=await window.witi.call('commands-save',commands);renderCommands();status.textContent='Comandos guardados';}catch(e){status.textContent=e.message;}};
window.witi.on('command-result',d=>document.querySelector('#commandResult').textContent=d.name+' · '+d.text);
document.querySelector('#audioSettingsForm').onsubmit=async e=>{e.preventDefault();try{await window.witi.call('audio-settings',{gapMs:Number(e.target.elements.gapMs.value),interruptCritical:e.target.elements.interruptCritical.checked});document.querySelector('#audioSettingsStatus').textContent='Guardado';}catch(err){document.querySelector('#audioSettingsStatus').textContent=err.message;}};
load();
})();
