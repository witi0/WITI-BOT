/* Bridge to the source-accurate 12.2 Overlay Studio, without exposing Electron APIs to the child frame. */
(()=>{
 const frame=document.getElementById('legacy12StudioFrame');if(!frame)return;
 const mapped={nowPlaying:'music',musicMinimal:'music',musicCompact:'music',musicCover:'music',musicTicker:'music',musicVinyl:'music',musicQueue:'music',timer:'timer',extensibleTimer:'timer',topLikes:'toplikes',topDonors:'topgifters',topPoints:'ranking',giftAlert:'actions',followAlert:'actions',subscribeAlert:'actions',latestFollower:'lastfollow',lastGift:'lastgift',recentEvents:'chat',recentGifts:'giftfeed',chat:'chat',commandResponse:'commands',stats:'stats',liveStatus:'stats',viewerCounter:'stats',likeCounter:'stats',coinCounter:'stats',celebrations:'likefountain',likeGoal:'goal',giftGoal:'goal'};
 let cache=null;
 async function snapshot(){cache=await window.witi.call('snapshot');return cache;}
 function findSource(def){return(cache?.overlays||[]).find(x=>x.legacy12Key===def)||(cache?.overlays||[]).find(x=>x.name===def);}
 async function ensure(def,description){
   await snapshot();let found=findSource(def);if(found){if(found.kind==='music'&&!found.musicLayout){const defaults=await window.witi.call('overlay-design-defaults',def);found=await window.witi.call('save-overlay',{...defaults,...found,musicLayout:defaults.musicLayout||'studio'});}return found;}
   const kind=mapped[def];if(!kind)throw Error('Esta fuente no está disponible');
   const template=cache.catalog.find(x=>x.legacy12Key===def)||cache.catalog.find(x=>x.kind===kind&&(def==='giftGoal'?x.metric==='coins':def==='likeGoal'?x.metric==='likes':true));
   if(!template)throw Error('No hay una plantilla compatible con '+def);
   let created=await window.witi.call('create-template',template.template);
   const overlay={...created,legacy12Key:def,name:description||def,legacy12Origin:'WITI BOT 12.2',...await window.witi.call('overlay-design-defaults',def),...
      (def==='giftGoal'?{kind:'goal',metric:'coins'}:def==='likeGoal'?{kind:'goal',metric:'likes'}:{})};
   try{created=await window.witi.call('save-overlay',overlay);}catch(e){/* Created template is still usable if customization fails. */}
   await snapshot();return created;
 }
 async function request(type,data){
   switch(type){
    case 'snapshot':return snapshot();
    case 'ensure':return ensure(data.key,data.name);
    case 'save':{const source=await ensure(data.key,data.name);const saved=await window.witi.call('save-overlay',{...source,...data.overlay,id:source.id,legacy12Key:data.key});await snapshot();return saved;}
    case 'favorite':{const id=data.key;const prefs=new Set((await snapshot()).legacy12Favorites||[]);prefs.has(id)?prefs.delete(id):prefs.add(id);await window.witi.call('legacy12-favorites',[...prefs]);await snapshot();return [...prefs];}
    case 'copy':{const s=await ensure(data.key,data.name);await window.witi.call('copy-overlay',s.id);return{url:cache.urls[s.id]};}
    case 'open':{const s=await ensure(data.key,data.name);await window.witi.call('open-overlay',s.id,false);return true;}
    case 'test':{const s=await ensure(data.key,data.name);await window.witi.call('preview-overlay',s.id);return true;}
    case 'copyGift':{await window.witi.call('copy-gift-overlay',data.id);await snapshot();return true;}
    case 'testGift':return window.witi.call('test-gift-rule',{id:data.id,count:1});
    case 'navigate':{if(!['gifts','rules'].includes(data.page))throw Error('Sección no permitida');document.querySelector('nav [data-page="'+data.page+'"]')?.click();return true;}
    default:throw Error('Acción de overlays desconocida');
   }
 }
 window.addEventListener('message',async ev=>{
   if(ev.source!==frame.contentWindow||!ev.data||ev.data.channel!=='WITI12_REQUEST')return;
   const {id,type,data={}}=ev.data;
   if(!Number.isSafeInteger(id)||id<1||id>999999999)return;
   try{const result=await request(type,data);ev.source.postMessage({channel:'WITI12_RESPONSE',id,ok:true,result},'*');}
   catch(err){ev.source.postMessage({channel:'WITI12_RESPONSE',id,ok:false,error:String(err?.message||err)},'*');}
 });
 const signal=async()=>{if(!frame.contentWindow||!document.querySelector('#overlays.page.active'))return;try{frame.contentWindow.postMessage({channel:'WITI12_PUSH',snapshot:await snapshot()},'*');}catch{}};
 window.witi.on('connection',signal);
 document.querySelector('nav [data-page="overlays"]')?.addEventListener('click',()=>setTimeout(signal,180));
})();
