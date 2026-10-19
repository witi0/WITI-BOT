function initial(){return {likes:0,follows:0,shares:0,coins:0,gifts:0,subscribers:0,viewers:0,chat:[],feed:[],people:{},giftCounts:{},giftNameCounts:{},topGift:null,topStreak:null,last:{},votes:{}};}
class LiveState{
 constructor(store){this.store=store;this.data={...initial(),...(store.get('liveState')||{})};this.music={connected:false,source:'none'};this.dirty=false;this.interval=setInterval(()=>{if(this.dirty){store.set('liveState',this.data);this.dirty=false;}},3000);this.interval.unref();}
 apply(e){const d=this.data;if(e.type==='viewers'){d.viewers=e.viewers;return;}const p=d.people[e.user]||{user:e.user,name:e.name||e.user,avatar:e.avatar||'',likes:0,coins:0,gifts:0};p.name=e.name||p.name;if(e.avatar)p.avatar=e.avatar;d.people[e.user]=p;
 if(e.type==='like'){const n=Math.max(0,Number(e.count)||1);d.likes+=n;p.likes+=n;}
 if(e.type==='follow')d.follows++;
 if(e.type==='share')d.shares++;
 if(e.type==='subscription')d.subscribers++;
 if(e.type==='gift'){const n=Math.max(1,Number(e.count)||1),coins=Math.max(0,Number(e.coins)||0);d.gifts+=n;d.coins+=coins;p.coins+=coins;p.gifts+=n;d.giftCounts[e.gift]=(d.giftCounts[e.gift]||0)+n;const name=String(e.giftName||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');if(name){d.giftNameCounts[name]=(d.giftNameCounts[name]||0)+n;}d.feed.unshift(e);d.feed=d.feed.slice(0,12);if(!d.topGift||coins>Number(d.topGift.coins||0))d.topGift={...e};if(!d.topStreak||n>Number(d.topStreak.count||0))d.topStreak={...e};}
 if(e.type==='comment'||e.type==='command'){d.chat.unshift(e);d.chat=d.chat.slice(0,30);const vote=(e.text||'').trim().toUpperCase();if(['A','B'].includes(vote))d.votes[e.user]=vote;}
 d.last[e.type]=e;if(Number.isFinite(e.viewers))d.viewers=e.viewers;
 const people=Object.keys(d.people);if(people.length>5000){const oldest=people.slice(0,people.length-5000);for(const id of oldest)delete d.people[id];}
 this.dirty=true;
 }
 snapshot(){return {...this.data,topgifters:Object.values(this.data.people).filter(p=>p.coins>0).sort((a,b)=>b.coins-a.coins).slice(0,20),toplikes:Object.values(this.data.people).filter(p=>p.likes>0).sort((a,b)=>b.likes-a.likes).slice(0,20),music:this.music};}
 reset(){this.data=initial();this.dirty=true;}
 close(){clearInterval(this.interval);if(this.dirty)this.store.set('liveState',this.data);}
}
function demoState(kind){const avatar='/avatar.svg',user={user:'demo',name:'Witi · Vista previa',avatar};const chat=[{...user,text:'¡Vamos por esa meta!',type:'comment'},{...user,user:'demo2',name:'Sher',text:'Qué buen directo 💜'}];return {simulated:true,likes:735,follows:28,shares:17,coins:360,gifts:46,subscribers:3,viewers:84,chat,feed:[{...user,giftName:'Regalo de muestra',count:5,coins:50}],giftCounts:{demo:25},topGift:{...user,giftName:'León',coins:29999,count:1},topStreak:{...user,giftName:'Rosa',coins:150,count:150},people:{demo:{...user,likes:735,coins:360}},topgifters:[{...user,coins:360},{...user,name:'Sher',coins:200},{...user,name:'Comunidad',coins:150}],toplikes:[{...user,likes:735},{...user,name:'Sher',likes:500}],votes:{a:'A',b:'B',c:'A'},last:{follow:user,share:user,subscription:user,gift:{...user,giftName:'Regalo de muestra',count:5,coins:50},comment:chat[0]},music:{connected:true,source:'demo',title:'Vista previa musical',artist:'WITI BOT · Datos de demostración',cover:'/cover.svg',avatar,profile:'Witi',progress:67000,duration:210000,playing:true,at:Date.now(),queue:[{name:'Siguiente canción',artist:'Artista de ejemplo'},{name:'Otra solicitud',artist:'Artista de ejemplo'},{name:'La tercera',artist:'Artista de ejemplo'}]}};}
module.exports={LiveState,demoState};
