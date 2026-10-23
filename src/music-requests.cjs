'use strict';
const crypto=require('node:crypto');
function rememberRequest(store,song,person){const requests=store.get('spotifyRequests')||[],requestId=crypto.randomUUID();requests.push({...song,requestId,requestedBy:person.name||person.user||'Creador',requestedByAvatar:person.avatar||'',at:Date.now()});store.set('spotifyRequests',requests.slice(-100));return requestId;}
function forgetRequest(store,requestId){store.set('spotifyRequests',(store.get('spotifyRequests')||[]).filter(r=>r.requestId!==requestId));}
function reconcile(store,m){const old=store.get('musicRequestPlayback')||{};const changed=m.uri&&(old.uri!==m.uri||(Number(old.progress)>10000&&Number(m.progress)<1500));let current=old.current||null;
 if(changed){const pending=store.get('spotifyRequests')||[],i=pending.findIndex(r=>r.uri===m.uri);current=i>=0?pending.splice(i,1)[0]:null;if(i>=0)store.set('spotifyRequests',pending);}
 if(m.uri)store.set('musicRequestPlayback',{uri:m.uri,progress:m.progress,current});return {...m,...(current&&current.uri===m.uri?{requestedBy:current.requestedBy,requestedByAvatar:current.requestedByAvatar}:{})};}
function freshRequests(store){return (store.get('spotifyRequests')||[]).filter(r=>r?.name&&Date.now()-Number(r.at||0)<21600000).sort((a,b)=>(a.at||0)-(b.at||0));}
function consumeDuplicates(list,counts){const out=[];for(const item of list||[]){const uri=String(item?.uri||'');if(uri&&counts.get(uri)>0){counts.set(uri,counts.get(uri)-1);continue;}out.push(item);}return out;}
function musicState(store,m={}){
 const requests=freshRequests(store).map(r=>({...r,queueOrigin:'request',priority:true}));
 const counts=new Map();for(const r of requests)counts.set(String(r.uri||''),(counts.get(String(r.uri||''))||0)+1);
 const spotifyQueue=consumeDuplicates((m.spotifyQueue||[]).map(t=>({...t,queueOrigin:'spotify',priority:false})),counts);
 const queue=[...requests,...spotifyQueue].slice(0,3);
 return {...m,queue,queueSource:requests.length?'Prioridad WITI + Spotify':'Cola de Spotify',priorityRequests:requests.length};
}
module.exports={rememberRequest,forgetRequest,reconcile,musicState};
