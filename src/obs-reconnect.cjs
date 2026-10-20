'use strict';
async function refreshBrowserSources(obs,server,store){
 const known=new Set(store.list('overlays').map(o=>o.id)),gifts=new Set(store.list('rules').filter(r=>r.trigger==='gift').map(r=>r.id));
 const inputList=await obs.call('GetInputList',{inputKind:'browser_source'});
 let refreshed=0,failed=0;
 for(const input of inputList.inputs||[]){
  try{
   const data=await obs.call('GetInputSettings',{inputName:input.inputName});
   const value=String(data.inputSettings?.url||'');let url;
   try{url=new URL(value);}catch{continue;}
   const match=/^\/(overlay|gift-alert)\/([0-9a-f-]{36})$/i.exec(url.pathname);
   if(!match||!(match[1]==='overlay'?known:gifts).has(match[2])||!['127.0.0.1','localhost'].includes(url.hostname))continue;
   const actual=new URL(match[1]==='overlay'?server.url(match[2]):server.ruleUrl(match[2]));
   if(url.port!==actual.port)continue;
   const settings={...data.inputSettings};
   settings.url=actual.href;
   settings.shutdown=false;
   await obs.call('SetInputSettings',{inputName:input.inputName,inputSettings:settings,overlay:true});
   await obs.call('PressInputPropertiesButton',{inputName:input.inputName,propertyName:'refreshnocache'});
   refreshed++;
  }catch{failed++;}
 }
 return {refreshed,failed};
}
module.exports={refreshBrowserSources};
