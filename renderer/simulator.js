'use strict';
(()=>{
 const form=document.getElementById('eventSimulator');if(!form)return;
 const $=id=>document.getElementById(id),make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 let gifts=[],selected=null,limit=64,busy=false;
 function renderGifts(){const term=$('simGiftSearch').value.trim().toLocaleLowerCase('es'),matches=gifts.filter(g=>(g.displayName+' '+g.name+' '+g.id).toLocaleLowerCase('es').includes(term)),root=$('simGiftList');root.replaceChildren();
  for(const gift of matches.slice(0,limit)){const b=make('button');b.type='button';b.className='simulator-gift';b.setAttribute('aria-pressed',String(selected?.id===gift.id));
   if(gift.image){const img=make('img');img.src=gift.image;img.alt='';img.referrerPolicy='no-referrer';img.loading='lazy';img.onerror=()=>img.remove();b.append(img);}else b.append(make('span','🎁'));
   b.append(make('strong',gift.displayName||gift.name),make('span',gift.coins+' monedas'));b.onclick=()=>{selected=gift;$('simGiftSelected').textContent=(gift.displayName||gift.name)+' · ID '+gift.id+' · '+gift.coins+' monedas';renderGifts();};root.append(b);
  }$('simGiftMore').hidden=matches.length<=limit;
 }
 function sync(){const type=form.elements.type.value;$('simGiftFields').hidden=type!=='gift';$('simTextField').hidden=!['comment','command'].includes(type);form.elements.count.closest('label').hidden=!['gift','like'].includes(type);}
 async function load(){try{const data=await call('gift-catalog');gifts=data.gifts||[];renderGifts();const snap=await call('snapshot');$('simPreviewLinks').replaceChildren();for(const overlay of snap.overlays||[]){const b=make('button','↗ '+overlay.name);b.type='button';b.onclick=()=>call('open-overlay',overlay.id,true).catch(e=>$('eventSimResult').textContent=e.message);$('simPreviewLinks').append(b);}}catch(e){$('eventSimResult').textContent=e.message;}}
 form.elements.type.onchange=sync;$('simGiftSearch').oninput=()=>{limit=64;renderGifts();};$('simGiftMore').onclick=()=>{limit+=64;renderGifts();};
 form.onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;const button=form.querySelector('[type=submit]');button.disabled=true;try{const f=form.elements,type=f.type.value;if(type==='gift'&&!selected)throw Error('Selecciona un regalo de la lista');const result=await call('simulate',{type,user:f.user.value,name:f.name.value,text:f.text.value,count:['gift','like'].includes(type)?Number(f.count.value):1,gift:selected?.id,follower:f.follower.value==='unknown'?null:f.follower.value==='true'});$('eventSimResult').textContent='SIMULADO · '+(type==='gift'?(selected.displayName||selected.name)+' × '+f.count.value:type==='like'?f.count.value+' likes de '+f.name.value:type)+'\n'+(result.length?result.map(r=>r.action+': '+r.status+(r.message?' · '+r.message:'')).join('\n'):'No hay reglas activas para este evento. Puedes crearlas en Eventos y acciones.');}catch(e){$('eventSimResult').textContent=e.message;}finally{busy=false;button.disabled=false;}};
 $('simReset').onclick=async()=>{try{await call('simulation-reset');$('eventSimResult').textContent='Simulación reiniciada. Los contadores reales se conservan.';}catch(e){$('eventSimResult').textContent=e.message;}};
 document.querySelector('nav [data-page=simulator]').addEventListener('click',load);sync();
})();
