'use strict';
function parseLivePage(html, username) {
 const expected=String(username).toLowerCase();
 for(const match of String(html).matchAll(/<script\b[^>]*\bid=["'](?:SIGI_STATE|__UNIVERSAL_DATA_FOR_REHYDRATION__)["'][^>]*>([\s\S]*?)<\/script>/gi)){
  let data;try{data=JSON.parse(match[1].replace(/("(?:roomId|room_id|id_str)"\s*:\s*)(\d{16,})(?=\s*[,}])/g,'$1"$2"'));}catch{continue;}
  const scope=data?.__DEFAULT_SCOPE__?.['webcast.app']||data?.__DEFAULT_SCOPE__?.['webcast.app-context']||data;
  const roots=[scope?.LiveRoom?.liveRoomUserInfo,scope?.liveRoomUserInfo,scope?.liveRoom,scope?.userInfo];
  for(const info of roots){
   if(!info)continue;const user=info.user||info.owner||{},room=info.liveRoom||info.roomInfo||{};
   const uniqueId=String(user.uniqueId||user.unique_id||info.uniqueId||'').toLowerCase();
   if(uniqueId!==expected)continue;
   const status=Number(room.status??info.status),roomId=String(user.roomId||user.room_id||room.id_str||room.id||info.roomId||'');
   if(status===4)return {roomId:'',live:false,source:'Página pública de TikTok'};
   if(/^\d{6,25}$/.test(roomId)&&Number(roomId)>0)return {roomId,live:status===2?true:null,source:'Página pública de TikTok'};
  }
 }
 return null;
}
async function resolvePublicRoom(username,{signal}={}){
 const abort=AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(6500)]);
 const response=await fetch('https://www.tiktok.com/@'+encodeURIComponent(username)+'/live',{signal:abort,redirect:'error',headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36','Accept-Language':'es-MX,es;q=0.9,en;q=0.7'}});
 if(!response.ok)throw Error('Consulta pública TikTok: HTTP '+response.status);
 const reader=response.body.getReader();let html='',size=0;const decoder=new TextDecoder();
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>5000000)throw Error('Respuesta TikTok demasiado grande');html+=decoder.decode(value,{stream:true});}html+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
 return parseLivePage(html,username);
}
module.exports={parseLivePage,resolvePublicRoom};
