'use strict';
function followerStatus(event={}){
 if(event.type==='follow')return true;
 const u=event.user&&typeof event.user==='object'?event.user:event;
 for(const v of [event.follower,u.follower,u.isFollower,event.isFollower])if(typeof v==='boolean')return v;
 const identity=event.userIdentity||u.userIdentity||{};
 if(typeof identity.isFollowerOfAnchor==='boolean')return identity.isFollowerOfAnchor;
 // followStatus relates the viewer to the anchor: 1 following, 2 mutual.
 const status=u.followInfo?.followStatus??u.followRole??event.followRole;
 if(status!==undefined&&status!==null&&status!==''){const n=Number(status);if(n===1||n===2)return true;}
 return (event.roles||[]).includes('follower')?true:null;
}
module.exports={followerStatus};
