'use strict';
function rememberRequest(store,song,person){const requests=store.get('spotifyRequests')||[],requestId=require('node:crypto').randomUUID();requests.push({...song,requestId,requestedBy:person.name||person.user||'Creador',requestedByAvatar:person.avatar||'',at:Date.now()});store.set('spotifyRequests',requests.slice(-100));return requestId;}
function forgetRequest(store,requestId){store.set('spotifyRequests',(store.get('spotifyRequests')||[]).filter(r=>r.requestId!==requestId));}
function reconcile(store,m){const old=store.get('musicRequestPlayback')||{};const changed=m.uri&&(old.uri!==m.uri||(Number(old.progress)>10000&&Number(m.progress)<1500));let current=old.current||null;
 if(changed){const pending=store.get('spotifyRequests')||[],i=pending.findIndex(r=>r.uri===m.uri);current=i>=0?pending.splice(i,1)[0]:null;if(i>=0)store.set('spotifyRequests',pending);}
 if(m.uri)store.set('musicRequestPlayback',{uri:m.uri,progress:m.progress,current});return {...m,...(current&&current.uri===m.uri?{requestedBy:current.requestedBy,requestedByAvatar:current.requestedByAvatar}:{})};}
function musicState(store,m={}){const requests=(store.get('spotifyRequests')||[]).filter(r=>r.name&&Date.now()-r.at<21600000),manual=store.get('songQueue')||[],pending=[...requests,...manual].sort((a,b)=>(a.at||0)-(b.at||0));return {...m,queue:pending.slice(0,3),queueSource:'Solicitudes'};}
module.exports={rememberRequest,forgetRequest,reconcile,musicState};
