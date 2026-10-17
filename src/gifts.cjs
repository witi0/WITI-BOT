const fallback=require('../assets/gifts/catalog.json');
const {displayGiftName}=require('./gift-locale.cjs');
function normalizeLive(input){
 const items=Array.isArray(input)?input:input?.gifts||input?.data?.gifts||[];
 if(!Array.isArray(items))return [];
 const result=new Map();
 for(const gift of items){
  const id=String(gift.id??gift.giftId??'');
  const name=String(gift.name||gift.giftName||'').trim().slice(0,120);
  if(!/^\d+$/.test(id)||!name)continue;
  let image='';try{const url=new URL(gift.image?.urlList?.[0]||gift.image?.url_list?.[0]||gift.imageUrl||gift.image||'');if(url.protocol==='https:')image=url.href;}catch{}
  result.set(id,{id,name,displayName:displayGiftName(name),coins:Math.max(0,Number(gift.diamond_count??gift.diamondCount??gift.coins)||0),image,source:'live',regions:[]});
 }
 return [...result.values()];
}
function mergedCatalog(online,images={}){
 const live=normalizeLive(online);const names=new Set(live.map(x=>x.name.toLowerCase()+'|'+x.coins));
 const offline=fallback.gifts.filter(g=>!names.has(g.name.toLowerCase()+'|'+g.coins)).map(g=>({...g,displayName:displayGiftName(g.name),source:'reference',image:images[g.imageFile]||''}));
 return {source:live.length?'live+reference':'reference',updatedAt:fallback.updatedAt,totalLive:live.length,gifts:live.concat(offline)};
}
module.exports={normalizeLive,mergedCatalog};
