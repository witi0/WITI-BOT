'use strict';
const number=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
function normalizeTts(s={}){
 const prefix=String(s.prefix??'.').slice(0,10),prefixEnabled=s.prefixEnabled!==false;
 if(prefixEnabled&&!prefix.trim())throw Error('Escribe un prefijo o desactiva el requisito de prefijo');
 return {enabled:!!s.enabled,prefixEnabled,prefix,readName:s.readName!==false,engine:s.engine==='online'?'online':'local',voice:String(s.voice||'').slice(0,150),rate:number(s.rate,.5,2,1),pitch:number(s.pitch,0,2,1),random:!!s.random,audience:['all','moderator','subscriber','topgifter','selected'].includes(s.audience)?s.audience:'all',allowedRoles:(s.allowedRoles||[]).filter(r=>['moderator','subscriber','topgifter'].includes(r)),minMemberLevel:Math.floor(number(s.minMemberLevel,0,100,0)),minGifterLevel:Math.floor(number(s.minGifterLevel,0,100,0)),topDonors:Math.floor(number(s.topDonors,0,20,0)),cooldown:Math.floor(number(s.cooldown,0,300,3)),maxLength:Math.floor(number(s.maxLength,20,500,300)),skipCommands:s.skipCommands!==false,blockedUsers:String(s.blockedUsers||'').slice(0,2000),blockedWords:String(s.blockedWords||'').slice(0,2000)};
}
function eligible(e,s={},context={}){
 const roles=e.roles||[],audience=s.audience||'all';
 if(audience==='selected'&&!(s.allowedRoles||[]).some(r=>roles.includes(r)))return false;
 if(!['all','selected'].includes(audience)&&!roles.includes(audience))return false;
 if(Number(s.minMemberLevel)>0&&!(e.memberLevel>=s.minMemberLevel))return false;
 if(Number(s.minGifterLevel)>0&&!(e.gifterLevel>=s.minGifterLevel))return false;
 if(Number(s.topDonors)>0&&!(context.topgifters||[]).slice(0,s.topDonors).some(u=>u.user===e.user))return false;
 const blocked=String(s.blockedUsers||'').toLowerCase().split(/[\s,]+/).filter(Boolean).map(x=>x.replace(/^@/,''));
 return ![e.user,e.uniqueId].filter(Boolean).some(u=>blocked.includes(String(u).toLowerCase().replace(/^@/,'')));
}
class TtsPolicy{
 constructor(){this.last=new Map();}
 text(e,input,context={}){
  const s=normalizeTts(input);if(!s.enabled||e.type!=='comment'||e.simulated||!eligible(e,s,context))return null;
  let text=String(e.text||'');if(s.prefixEnabled){if(!text.startsWith(s.prefix))return null;text=text.slice(s.prefix.length);}
  if(s.skipCommands&&/^[!/]/.test(text.trim()))return null;
  if(String(s.blockedWords).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).some(x=>text.toLowerCase().includes(x)))return null;
  text=text.replace(/https?:\/\/\S+/gi,'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,s.maxLength);if(!text)return null;
  const now=Date.now();if(now-(this.last.get(e.user)||0)<s.cooldown*1000)return null;
  this.last.set(e.user,now);if(this.last.size>5000)this.last.delete(this.last.keys().next().value);
  return (s.readName?e.name+': ':'')+text;
 }
}
module.exports={normalizeTts,eligible,TtsPolicy};
