'use strict';
const designs={
 musicMinimal:{musicLayout:'minimal',showQueue:false,showCover:false,showAvatar:false,showTitle:false,width:800,height:200,fontSize:30},
 musicCompact:{musicLayout:'compact',showQueue:false,showAvatar:false,showTitle:false,width:720,height:200,fontSize:28},
 musicCover:{musicLayout:'cover',showQueue:false,showAvatar:false,showTitle:false,width:440,height:620,fontSize:32},
 musicTicker:{musicLayout:'ticker',showQueue:false,showAvatar:false,showTitle:false,width:1000,height:160,fontSize:26},
 musicVinyl:{musicLayout:'vinyl',showQueue:false,showTitle:false,width:800,height:310,fontSize:30},
 musicQueue:{musicLayout:'queue',showQueue:true,width:800,height:500,fontSize:28},
 nowPlaying:{musicLayout:'studio',width:800,height:450},
 topLikes:{width:700,height:520,fontSize:28,top:5},topDonors:{width:700,height:520,fontSize:28,top:5}
};
function designDefaults(key){return {...(designs[key]||{}),...(['nowPlaying','musicQueue','topLikes','topDonors','topPoints'].includes(key)?{referenceLayout:'reference',transparent:true,showTitle:false,showCover:true,showAvatar:true,showProfile:false,avatarSize:key==='topLikes'?64:90,width:key==='topLikes'?420:800,height:key==='topLikes'?1000:800}: {})};}
module.exports={designs,designDefaults};
