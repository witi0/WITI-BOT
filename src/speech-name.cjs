"use strict";
function speechName(value){
 let name=String(value||'').normalize('NFKC').toLocaleLowerCase('es-MX');
 const small='ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡʏᴢ',plain='abcdefghijklmnopqrstuvwyz';name=[...name].map(c=>small.includes(c)?plain[small.indexOf(c)]:c).join('');
 name=name.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0F\u200D\u20E3]/gu,'');
 name=name.replace(/[^\p{L}\p{M}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
 return name.slice(0,100)||'usuario';
}
module.exports={speechName};
