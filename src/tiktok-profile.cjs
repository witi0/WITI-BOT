'use strict';
function cleanUsername(input){
 const raw=String(input||'').normalize('NFKC').trim();
 if(/^https?:\/\//i.test(raw)||/^(?:www\.|m\.)?tiktok\.com\//i.test(raw)){
  try{const u=new URL(/^https?:\/\//i.test(raw)?raw:'https://'+raw);if(!['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(u.hostname.toLowerCase()))return '';return decodeURIComponent(u.pathname).match(/^\/@([A-Za-z0-9._]+)(?:\/live)?\/?$/i)?.[1]||'';}catch{return '';}
 }
 return raw.replace(/^[@＠]/,'');
}
function scriptBodies(html){return [...String(html).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);}
function tryJson(text){try{return JSON.parse(String(text).replace(/("(?:roomId|room_id|id_str)"\s*:\s*)(\d{16,})(?=\s*[,}])/g,'$1"$2"'));}catch{return null;}}
function normalizeUrl(value){const out=String(value||'').replace(/\\u002F/g,'/').replace(/\\\//g,'/');return /^https?:\/\//i.test(out)?out:'';}
function avatarOf(obj){
 if(!obj||typeof obj!=='object')return '';
 for(const key of ['avatarLarger','avatarMedium','avatarThumb','avatar_url','avatarUrl','avatar']){
  const v=obj[key];
  if(typeof v==='string'&&/^https?:\/\//i.test(v))return v;
  if(v&&typeof v==='object'){
   const nested=v.urlList?.[0]||v.url_list?.[0]||v.url||v.src;
   if(typeof nested==='string'&&/^https?:\/\//i.test(nested))return nested;
  }
 }
 for(const key of ['images','avatarList']){
  const list=obj[key];
  const first=Array.isArray(list)&&list[0];
  if(typeof first==='string'&&/^https?:\/\//i.test(first))return first;
 }
 return '';
}
function profileFromObject(obj,expected){
 if(!obj||typeof obj!=='object')return null;
 const candidates=[obj,obj.user,obj.author,obj.owner].filter(Boolean);
 for(const item of candidates){
  const uid=String(item?.uniqueId||item?.unique_id||item?.displayId||'').toLowerCase();
  if(uid&&uid===expected){
   const avatar=avatarOf(item)||avatarOf(obj);
   const displayName=String(item?.nickname||item?.display_name||item?.displayName||obj?.nickname||'').trim();
   if(avatar||displayName)return {username:expected,displayName,avatar};
  }
 }
 return null;
}
function walk(root,expected,seen=new Set()){
 if(!root||typeof root!=='object'||seen.has(root))return null;
 seen.add(root);
 const hit=profileFromObject(root,expected);if(hit)return hit;
 if(Array.isArray(root)){for(const item of root){const r=walk(item,expected,seen);if(r)return r;}return null;}
 for(const value of Object.values(root)){const r=walk(value,expected,seen);if(r)return r;}
 return null;
}
function parseProfilePage(html,username){
 const expected=cleanUsername(username).toLowerCase();
 if(!expected)return null;
 for(const body of scriptBodies(html)){
  const data=tryJson(body);if(!data)continue;
  const hit=walk(data,expected);if(hit)return hit;
 }
 const page=String(html);
 const avatarRegexes=[/"avatar(?:Larger|Medium|Thumb|_url|Url)?"\s*:\s*"(https?:[^"\\]+(?:\\.[^"\\]*)*)"/i,/"avatar"\s*:\s*\{[^}]*"urlList"\s*:\s*\[\s*"(https?:[^"\\]+(?:\\.[^"\\]*)*)"/i,/property=["']og:image["']\s+content=["']([^"']+)["']/i];
 let avatar='';for(const rx of avatarRegexes){const m=page.match(rx);if(m){avatar=normalizeUrl(m[1]);if(avatar)break;}}
 const display=(page.match(/"nickname"\s*:\s*"([^"\\]+(?:\\.[^"\\]*)*)"/i)||[])[1]||'';
 if(avatar||display)return {username:expected,displayName:String(display).replace(/\\u002F/g,'/'),avatar};
 return null;
}
async function resolvePublicProfile(username,{signal}={}){
 const user=cleanUsername(username);if(!/^[A-Za-z0-9._]{2,40}$/.test(user))throw Error('Usuario TikTok inválido');
 const abort=AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(6500)]);
 const res=await fetch('https://www.tiktok.com/@'+encodeURIComponent(user),{signal:abort,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36','Accept-Language':'es-MX,es;q=0.9,en;q=0.7'}});
 if(!res.ok)throw Error('Perfil TikTok: HTTP '+res.status);
 const html=await res.text();
 const profile=parseProfilePage(html,user);
 if(!profile)throw Error('No se pudo leer la foto pública de TikTok');
 return profile;
}
module.exports={cleanUsername,parseProfilePage,resolvePublicProfile};
