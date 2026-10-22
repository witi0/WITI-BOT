(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('home');if(!root||!window.witi)return;
const num=n=>Number(n||0).toLocaleString('es-MX');const validPic=s=>typeof s==='string'&&/^https:\/\//.test(s);
function add(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;}
let last='';function update(s){if(!s)return;const live=s.liveState||{},counts=s.counters||{},connection=s.connection||{};
$('cw-viewers').textContent=connection.connected&&Number.isFinite(+live.viewers)?num(live.viewers):'—';$('cw-messages').textContent=num(counts.chat);$('cw-gifts').textContent=num(live.gifts);$('cw-subs').textContent=num(live.subscribers);
$('cw-feed-status').textContent=connection.connected?'● En vivo':'● Sin conexión';
if($('cw-broadcast-name'))$('cw-broadcast-name').textContent=connection.username?('@'+connection.username):'Conecta tu cuenta de TikTok';
if($('cw-broadcast-phase'))$('cw-broadcast-phase').textContent=connection.connected?'Conectado':'Desconectado';
if($('cw-live-cover-label')){$('cw-live-cover-label').textContent=connection.connected?'EN VIVO':'SIN LIVE';$('cw-live-cover-label').classList.toggle('is-live',!!connection.connected);}
$('cw-feed-status').classList.toggle('is-online',!!connection.connected);
const events=(s.events||[]).filter(e=>!['like','share'].includes(e.type)).slice(0,5);const donors=(live.topgifters||[]).slice(0,3);const sig=JSON.stringify([events.map(e=>e.id),donors.map(d=>[d.user,d.coins]),connection.connected]);if(sig===last)return;last=sig;
const recent=$('cw-recent-events'),top=$('cw-top-donors');recent.replaceChildren();top.replaceChildren();
const names={gift:'envió un regalo',follow:'empezó a seguir',subscription:'se suscribió',comment:'comentó',command:'escribió un comando',chest:'abrió un cofre',member:'se unió'};
for(const e of events){const row=add('div','cw-recent-row'),name=add('span','',e.name||'Espectador'),action=add('em','',e.type==='gift'?(e.giftName||'Regalo')+' ×'+num(e.count||1):e.type==='comment'||e.type==='command'?e.text:names[e.type]||'Nueva actividad');row.append(name,action);recent.append(row);}if(!events.length)recent.textContent='Sin eventos recibidos.';
for(let i=0;i<donors.length;i++){const d=donors[i],row=add('div','cw-donor-row');row.append(add('span','cw-medal',i+1));if(validPic(d.avatar)){const img=add('img');img.src=d.avatar;img.alt='';img.referrerPolicy='no-referrer';row.append(img);}row.append(add('span','cw-donor-name',d.name||d.user||'Espectador'),add('b','',num(d.coins)+' monedas'));top.append(row);}if(!donors.length)top.textContent='Sin donaciones en esta sesión.';
}
$('cw-open-chat')?.addEventListener('click',async()=>{try{await window.witi.call('open-live-popout','chat');}catch(err){$('cw-feed-status').textContent=err.message;}});
const frames=()=>[$('cw-inline-live-chat'),$('cw-hub-live-chat')].filter(Boolean);
const forward=s=>{for(const frame of frames())if(frame.contentWindow)frame.contentWindow.postMessage({type:'witi-live-hub',snapshot:s},'*');};
const openPopout=async()=>{try{await window.witi.call('open-live-popout','chat');}catch(err){console.warn(err);}};
$('cw-separate-chat')?.addEventListener('click',openPopout);
$('cw-hub-separate-chat')?.addEventListener('click',openPopout);
const sendSnapshot=()=>window.witi.call('live-hub-snapshot').then(s=>{update(s);forward(s);}).catch(()=>{});
for(const frame of frames())frame.addEventListener('load',sendSnapshot);
window.addEventListener('message',ev=>{if(ev.data?.type==='witi-chat-ready'&&frames().some(f=>f.contentWindow===ev.source))sendSnapshot();});
window.witi.on('live-hub',s=>{update(s);forward(s);});
window.witi.on('command-result',d=>{for(const f of frames())f.contentWindow?.postMessage({type:'witi-command-result',event:d},'*');});
sendSnapshot();
})();
