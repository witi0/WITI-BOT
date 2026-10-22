'use strict';
(()=>{
 const byId=id=>document.getElementById(id);
 const node=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(className)e.className=className;return e;};
 const number=n=>Number(n||0).toLocaleString('es-MX');
 let installed=false;
 async function execute(name,...args){try{await window.witi.call(name,...args);await refresh();}catch(e){toast(e.message,true);}}
 function memberCard(member){
  const card=node('article',undefined,'community-member-card');
  const avatar=node('img');avatar.alt='';avatar.loading='lazy';avatar.referrerPolicy='no-referrer';avatar.src=/^https:\/\//.test(member.avatar||'')?member.avatar:'';avatar.onerror=()=>avatar.replaceWith(node('span','◉','community-empty-avatar'));if(!avatar.src)avatar.replaceWith(node('span','◉','community-empty-avatar'));else card.append(avatar);
  if(!card.querySelector('img'))card.prepend(node('span','◉','community-empty-avatar'));
  const details=node('div',undefined,'community-member-info'),title=node('strong',member.name||member.user);
  const stats=node('small',`${number(member.likes)} likes · ${number(member.comments)} comentarios · ${number(member.gifts)} regalos · ${number(member.shares)} compartidos`);
  const pointLabel=node('b',number(member.balance)+' puntos','community-point-value');
  details.append(title,node('span',member.user,'community-user-id'),stats,pointLabel);
  const controls=node('div',undefined,'community-member-controls');
  const qty=node('input');qty.type='number';qty.min='1';qty.max='1000000';qty.step='1';qty.value='10';qty.setAttribute('aria-label','Cantidad de puntos para '+member.name);
  const add=node('button','+ Dar'),subtract=node('button','− Quitar'),remove=node('button','Eliminar','community-remove');
  add.type=subtract.type=remove.type='button';add.onclick=()=>{const n=Number(qty.value);if(!Number.isSafeInteger(n)||n<1||n>1000000){toast('Cantidad entre 1 y 1,000,000',true);return;}execute('community-credit',{user:member.user,amount:n});};
  subtract.onclick=()=>{const n=Number(qty.value);if(!Number.isSafeInteger(n)||n<1||n>1000000){toast('Cantidad entre 1 y 1,000,000',true);return;}execute('community-credit',{user:member.user,amount:-n});};
  remove.onclick=()=>{if(confirm('¿Eliminar a '+member.name+' y borrar su historial de puntos? Esta acción no se puede deshacer.'))execute('community-remove',member.user);};
  controls.append(qty,add,subtract,remove);card.append(details,controls);return card;
 }
 function render(snapshot){
  if(!installed)install();const data=Array.isArray(snapshot?.communityMembers)?snapshot.communityMembers:[],summary=snapshot?.communitySummary||{};
  const last=summary.lastAward,detail=byId('pointsLastAward');if(detail)detail.textContent=last?`${last.user} · ${{follow:'Seguir',like:'Likes',comment:'Comentario',share:'Compartir',gift:'Regalo',subscription:'Suscripción'}[last.event]||last.event}: +${number(last.amount)} puntos · ${last.reason}`:'Esperando eventos reales…';const requirements=document.querySelector('.community-requirements');if(requirements)requirements.hidden=summary.audience!=='community';const status=byId('communityCounter');if(status)status.textContent=`${number(summary.registered??data.length)} registrados · ${number(summary.pending)} pendientes de cumplir requisitos`;
  const members=byId('userList');if(members){members.replaceChildren();const query=(byId('communitySearch')?.value||'').trim().toLocaleLowerCase('es');const filtered=data.filter(m=>!query||(m.name+' '+m.user).toLocaleLowerCase('es').includes(query));if(!filtered.length)members.append(node('p',data.length?'No hay miembros con ese nombre.':'Aún no hay integrantes registrados. Para entrar deben seguirte y completar 100 likes, enviar un regalo o escribir 10 comentarios.','muted'));else for(const m of filtered.slice(0,150))members.append(memberCard(m));if(filtered.length>150)members.append(node('p','Mostrando 150 de '+number(filtered.length)+' miembros. Usa la búsqueda para encontrar a los demás.','muted'));}
  const ledger=byId('ledgerList');if(ledger){ledger.replaceChildren();for(const t of (snapshot?.ledger||[]).slice(0,35)){const line=node('div',undefined,'community-ledger-row');line.append(node('span',t.user),node('strong',(t.amount>0?'+':'')+number(t.amount)),node('small','Saldo '+number(t.balance)));ledger.append(line);}if(!ledger.children.length)ledger.append(node('p','Sin movimientos todavía.','muted'));}
  const list=byId('communityNameChoices');if(list){list.replaceChildren();for(const m of data){const option=node('option');option.value=m.user;option.label=(m.name||m.user)+' · '+number(m.balance)+' puntos';list.append(option);}}
 }
 function install(){if(installed)return;installed=true;
  const search=byId('communitySearch');if(search)search.oninput=()=>{if(typeof state!=='undefined'&&state)render(state);};
  const wipe=byId('communityDeleteAll');if(wipe)wipe.onclick=()=>{const answer=prompt('Esta acción elimina los miembros registrados, sus balances y el historial correspondiente. Escribe BORRAR para confirmar:');if(answer==='BORRAR')execute('community-clear');};
  const go=byId('commandGoPoints');if(go)go.onclick=()=>document.querySelector('nav [data-page="community"]')?.click();
  const obs=byId('obsRefreshOverlays');if(obs)obs.onclick=async()=>{try{const result=await window.witi.call('obs-refresh-overlays');toast('Fuentes restauradas: '+result.refreshed+(result.failed?' · No recargadas: '+result.failed:''));}catch(e){toast(e.message,true);}};
  document.querySelector('nav [data-page="community"]')?.addEventListener('click',()=>{if(typeof refresh==='function')refresh().catch(()=>{});});
 }
 window.WitiCommunityPanel={render,install};install();if(typeof state!=='undefined'&&state)render(state);
})();
