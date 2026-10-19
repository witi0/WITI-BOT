'use strict';
(()=>{
 const root=document.getElementById('feed'),status=document.getElementById('status');
 const tabs={chat:document.getElementById('chat'),activity:document.getElementById('activity')};
 const kind=new URLSearchParams(location.search).get('kind');
 let selection=kind==='activity'?'activity':'chat',events=[],connected=false;
 const make=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=String(value);return n;};
 const fallback='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" rx="8" fill="%23634d94"/%3E%3C/svg%3E';
 const render=()=>{
  status.textContent=connected?'● Conectado':'○ Sin conexión';root.replaceChildren();
  const list=events.filter(e=>selection==='chat'?['comment','command','commandresponse'].includes(e.type):!['comment','command','commandresponse'].includes(e.type)).slice(0,60);
  if(!list.length){root.append(make('div','empty',selection==='chat'?'Esperando mensajes del LIVE…':'Esperando regalos y acciones…'));return;}
  for(const e of list){
   const row=make('div','entry'),avatar=make('img');avatar.referrerPolicy='no-referrer';avatar.src=/^https:\/\//.test(e.avatar||'')?e.avatar:fallback;avatar.onerror=()=>{avatar.onerror=null;avatar.src=fallback;};
   const body=make('div','copy');body.append(make('b','',e.name||'Comunidad'));
   const line=['comment','command','commandresponse'].includes(e.type)?e.text:
    e.type==='gift'?((e.giftName||'Regalo')+' · '+(e.coins||0)+' monedas'):
    e.type==='like'&&e.likeMilestone?('Meta de '+e.likeMilestone.toLocaleString('es-MX')+' likes'):
    e.type==='like'?('Likes: '+(e.count||1)):
    ({follow:'Empezó a seguir',share:'Compartió el directo',subscription:'Nueva suscripción'}[e.type]||e.type);
   body.append(make('p','',line));row.append(avatar,body);
   if(e.type==='gift'){
    const gift=make('img','gift');gift.src=/^(https:\/\/|http:\/\/127\.0\.0\.1:\d+\/media\/)/.test(e.giftImage||'')?e.giftImage:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Ctext x="5" y="36" font-size="32"%3E%F0%9F%8E%81%3C/text%3E%3C/svg%3E';gift.referrerPolicy='no-referrer';gift.onerror=()=>gift.remove();row.append(gift,make('span','giftcount','×'+(e.count||1)));
   }
   root.append(row);
  }
 };
 const use=kind=>{selection=kind;for(const [k,b]of Object.entries(tabs))b.setAttribute('aria-selected',String(k===kind));render();};
 for(const [kind,b]of Object.entries(tabs))b.onclick=()=>use(kind);
 window.witi.on('live-hub',d=>{events=d.events||events;connected=!!d.connection?.connected;render();});
 window.witi.on('command-result',d=>{events.unshift({type:'commandresponse',name:d.name,text:d.text});events=events.slice(0,250);render();});
 window.witi.call('live-hub-snapshot').then(d=>{events=d.events||[];connected=!!d.connection?.connected;render();}).catch(()=>render());use(selection);
})();
