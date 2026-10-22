'use strict';
(()=>{
const $=id=>document.getElementById(id),timeline=$('timeline'),filterBar=$('filters');
const activeTypes=new Set(['comment','command','commandresponse','gift','follow','subscription','chest','member']);
const shortTime=at=>{const n=Number(at);return n?new Date(n).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}):'';};
const number=n=>Number(n||0).toLocaleString('es-MX');const safeUrl=url=>typeof url==='string'&&(/^https:\/\//.test(url)||/^http:\/\/127\.0\.0\.1:\d+\/media\/[^?#]+\?token=[a-f0-9]+$/i.test(url));
const placeholder='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" rx="32" fill="%23332943"/%3E%3Ccircle cx="32" cy="25" r="11" fill="%23a68cbe"/%3E%3Cpath d="M10 59a22 22 0 0 1 44 0Z" fill="%23a68cbe"/%3E%3C/svg%3E';
const mk=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el;};
function avatar(url,cls='avatar'){const img=mk('img',cls);img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.src=safeUrl(url)?url:placeholder;img.onerror=()=>{img.onerror=null;img.src=placeholder;};return img;}
function badge(name,label){const b=mk('span','role '+name,label);return b;}
let events=[],responses=[],live={},connection={},counters={},currentFilter='all',follow=true,showSettings=false,lastSignature='',lastConnected=false;
function eventKind(e){return e.type==='command'?'comment':e.type;}
function visible(e){const k=eventKind(e);if(!activeTypes.has(k))return false;if(currentFilter==='all')return true;if(currentFilter==='comment')return ['comment','commandresponse'].includes(k);return k===currentFilter;}
function makeRow(e){
 const type=eventKind(e),row=mk('div','entry '+type+(e.simulated?' is-test':''));row.dataset.kind=type;
 row.append(avatar(e.avatar));const body=mk('div','copy'),line=mk('div','line');
 line.append(mk('span','nick',e.name||e.user||'Espectador'));
 const roles=Array.isArray(e.roles)?e.roles:[];
 if(roles.includes('moderator'))line.append(badge('moderator','MOD'));
 if(roles.includes('subscriber'))line.append(badge('subscriber','SUB'));
 if(roles.includes('topgifter'))line.append(badge('topgifter','TOP'));
 const level=Number(e.memberLevel||e.gifterLevel)||0;
 if(level)line.append(badge('level','▲ '+level));
 if(e.simulated)line.append(badge('test','SIMULACIÓN'));
 const eventText=mk('span','event-text');
 if(type==='gift'){
  eventText.textContent='envió '+(e.giftName||e.gift||'un regalo');
 }else if(type==='chest'){
  eventText.textContent=e.chestAction||'activó un cofre';
 }else if(type==='subscription'){
  eventText.textContent='se suscribió'+(Number(e.subscriptionMonths)>0?' · '+number(e.subscriptionMonths)+' meses':'');
 }else if(type==='follow')eventText.textContent='te ha seguido';
 else if(type==='member')eventText.textContent='se unió como miembro';
 else eventText.textContent=e.text||'';
 line.append(eventText);body.append(line);row.append(body);
 if(type==='gift'){
  const gift=mk('div','gift-preview');
  const art=mk('img','gift-art');art.alt='Imagen del regalo '+(e.giftName||'');
  if(safeUrl(e.giftImage)){art.src=e.giftImage;art.referrerPolicy='no-referrer';art.onerror=()=>{art.onerror=null;art.src='gift-live.svg';};}
  else art.src='gift-live.svg';
  gift.append(art,mk('b','gift-qty','×'+number(e.count||1)));row.append(gift);
 }
 if(type==='chest'){
  const chest=mk('img','chest-art');chest.alt='Cofre';chest.src='chest-live.svg';row.append(chest);
 }
 row.append(mk('time','when',shortTime(e.at||e.receivedAt)));
 return row;
}
function renderFeed(){const all=[...events,...responses].filter(visible).sort((a,b)=>(b.at||b.receivedAt||0)-(a.at||a.receivedAt||0)).slice(-160);const signature=JSON.stringify([currentFilter,[...activeTypes].sort(),all.map(e=>[e.id,e.type,e.count,e.giftName,e.text]),all.length]);if(signature===lastSignature)return;lastSignature=signature;
 const previousScroll=timeline.scrollTop;const previousTop=timeline.scrollTop<55;
 const fragment=document.createDocumentFragment();for(const event of all)fragment.append(makeRow(event));if(!all.length)fragment.append(mk('div','empty',connection.connected?'Esperando actividad nueva…':'Conecta tu cuenta de TikTok para ver el chat.'));
 timeline.replaceChildren(fragment);$('feedCount').textContent=number(all.length)+' eventos';if(follow&&(previousTop||!timeline.dataset.hasScrolled)){timeline.scrollTop=0;}else timeline.scrollTop=previousScroll;
}
function renderRanks(){const root=$('topDonors'),rank=(live.topgifters||[]).slice(0,3);root.replaceChildren();if(!rank.length){root.textContent='Todavía no hay regalos en esta sesión.';return;}
 for(let i=0;i<rank.length;i++){const person=rank[i],row=mk('div','donor'),medal=mk('span','donor-number'+(i===1?' silver':i===2?' bronze':''),i+1),copy=mk('div','donor-copy');copy.append(mk('b','',person.name||person.user||'Espectador'),mk('span','',number(person.coins)+' monedas'));row.append(medal,avatar(person.avatar,'donor-avatar'),copy);root.append(row);}
}
function update(s){if(!s)return;events=s.events||events;live=s.liveState||live;connection=s.connection||connection;counters=s.counters||counters;const state=$('status'),online=!!connection.connected,waiting=['checking','connecting','waiting'].includes(connection.phase);state.textContent=online?'● Conectado':waiting?'● '+(connection.status||'Conectando'):'○ Sin conexión';state.title=connection.status||'';state.classList.toggle('online',online);state.classList.toggle('waiting',waiting&&!online);$('liveIndicator').textContent=online?'EN VIVO':'SIN LIVE';$('liveIndicator').classList.toggle('on',online);$('statViewers').textContent=online&&Number.isFinite(Number(live.viewers))?number(live.viewers):'—';$('statMessages').textContent=number(counters.chat);$('statGifts').textContent=number(live.gifts);$('statSubs').textContent=number(live.subscribers);const start=Number(live.sessionStartedAt);$('liveDuration').textContent=online&&start&&start<=Date.now()?(()=>{let seconds=Math.floor((Date.now()-start)/1000);const hrs=Math.floor(seconds/3600),min=Math.floor(seconds%3600/60);return `${String(hrs).padStart(2,'0')}:${String(min).padStart(2,'0')}`;})():'—';if(lastConnected!==online){lastConnected=online;lastSignature='';}renderRanks();renderFeed();}
filterBar.addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;currentFilter=b.dataset.filter;for(const x of filterBar.querySelectorAll('button'))x.setAttribute('aria-pressed',String(x===b));lastSignature='';renderFeed();});
$('settingsToggle').onclick=()=>{showSettings=!showSettings;$('settingsPanel').hidden=!showSettings;$('settingsToggle').setAttribute('aria-expanded',String(showSettings));};
$('settingsPanel').addEventListener('change',e=>{const input=e.target.closest('input[data-kind]');if(!input)return;if(input.checked)activeTypes.add(input.dataset.kind);else activeTypes.delete(input.dataset.kind);lastSignature='';renderFeed();});
$('autoScroll').onclick=()=>{follow=!follow;$('autoScroll').setAttribute('aria-pressed',String(follow));$('autoScroll').title=follow?'Pausar seguimiento automático':'Reactivar seguimiento automático';if(follow)timeline.scrollTop=0;};
$('goLatest').onclick=()=>{follow=true;$('autoScroll').setAttribute('aria-pressed','true');timeline.scrollTop=0;};
timeline.addEventListener('scroll',()=>{if(timeline.scrollTop>6)timeline.dataset.hasScrolled='true';},{passive:true});
if(new URLSearchParams(location.search).get('embedded')==='1')document.body.classList.add('embedded');
window.addEventListener('message',ev=>{if(ev.source!==window.parent || ev.data?.type!=='witi-live-hub')return;update(ev.data.snapshot);});
if(window.witi?.on)window.witi.on('live-hub',update);
const handleCommandResult=d=>{if(!d)return;const at=Number(d.at)||Date.now();responses.unshift({id:'response:'+at+':'+(d.name||''),type:'commandresponse',name:d.name||'WITI BOT',text:d.text||'',avatar:d.avatar||'',at});responses=responses.slice(0,30);lastSignature='';renderFeed();};
if(window.witi?.on)window.witi.on('command-result',handleCommandResult);
window.addEventListener('message',ev=>{if(ev.source===window.parent&&ev.data?.type==='witi-command-result')handleCommandResult(ev.data.event);});
if(window.witi?.call)window.witi.call('live-hub-snapshot').then(update).catch(err=>{$('status').textContent='Sin conexión';console.warn('WITI BOT: snapshot no disponible',err.message);renderFeed();});
else window.parent?.postMessage({type:'witi-chat-ready'},'*');
})();
