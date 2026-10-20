'use strict';
const canonical=v=>String(v??'').normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es');
function matches(rule,event){return !rule.match||[event.text,event.gift,event.giftName,event.giftDisplayName,...(event.giftAliases||[])].some(v=>v!=null&&canonical(v)===canonical(rule.match));}
function selectRules(rules,event){const candidates=rules.filter(r=>r.enabled&&r.trigger===event.type&&matches(r,event));if(event.type!=='gift')return candidates;const specific=candidates.filter(r=>String(r.match||'').trim());return specific.length?specific:candidates;}
module.exports={selectRules};
