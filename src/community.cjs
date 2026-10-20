'use strict';
const crypto=require('node:crypto');
const {followerStatus}=require('./follower.cjs');
const defaults=Object.freeze({enabled:false,initialPoints:25,perCoin:1,perFollow:5,perShare:5,perComment:0,perSubscription:25,perLike:1,likesPerPoint:100,commentCooldown:10,shareCooldown:30,perMinute:0});
function normalizePoints(input={}){
 const out={enabled:!!input.enabled};
 for(const [key,fallback] of Object.entries(defaults)){
  if(key==='enabled')continue;
  const n=Number(input[key]??fallback);
  if(!Number.isFinite(n)||n<0||n>100000||(key==='likesPerPoint'&&n<1))throw Error('Cantidad de puntos inválida: '+key);
  out[key]=key==='perCoin'?n:Math.floor(n);
 }
 return out;
}
class Community{
 constructor(store){
  this.store=store;this.flushTimer=null;
  store.db.run('CREATE TABLE IF NOT EXISTS community_members(user TEXT PRIMARY KEY,follower INTEGER,registered INTEGER NOT NULL DEFAULT 0,likes INTEGER NOT NULL DEFAULT 0,commentAt INTEGER NOT NULL DEFAULT 0,shareAt INTEGER NOT NULL DEFAULT 0);CREATE TABLE IF NOT EXISTS community_events(id TEXT PRIMARY KEY)');
  const existing=new Set(store.all('PRAGMA table_info(community_members)').map(x=>x.name));
  for(const [name,type] of Object.entries({name:'TEXT',avatar:'TEXT',comments:'INTEGER NOT NULL DEFAULT 0',gifts:'INTEGER NOT NULL DEFAULT 0',shares:'INTEGER NOT NULL DEFAULT 0',joinedAt:'INTEGER NOT NULL DEFAULT 0',seenAt:'INTEGER NOT NULL DEFAULT 0',eligibleLikes:'INTEGER NOT NULL DEFAULT 0',activeMs:'INTEGER NOT NULL DEFAULT 0',lastEligibleAt:'INTEGER NOT NULL DEFAULT 0',creditedMinutes:'INTEGER NOT NULL DEFAULT 0'})){
   if(!existing.has(name))store.db.run(`ALTER TABLE community_members ADD COLUMN ${name} ${type}`);
  }
  store.db.run('CREATE INDEX IF NOT EXISTS idx_community_registered ON community_members(registered)');
  this.delayedFlush();
 }
 delayedFlush(){if(this.flushTimer)return;this.flushTimer=setTimeout(()=>{this.flushTimer=null;this.store.flush();},2500);this.flushTimer.unref?.();}
 observe(e){
  if(e?.simulated||!e?.user||!['follow','like','share','comment','gift','subscription'].includes(e.type))return e;
  const s=this.store,user=String(e.user).slice(0,100),now=Date.now();
  const existing=s.all('SELECT * FROM community_members WHERE user=?',[user])[0];
  const raw=followerStatus(e),follower=raw===null?(existing?.follower===1?1:existing?.follower??null):Number(raw);
  const likes=(existing?.likes||0)+(e.type==='like'?Math.max(0,Math.floor(Number(e.count)||1)):0);
  const comments=(existing?.comments||0)+(e.type==='comment'?1:0);
  const gifts=(existing?.gifts||0)+(e.type==='gift'?Math.max(1,Math.floor(Number(e.count)||1)):0);
  const shares=(existing?.shares||0)+(e.type==='share'?1:0);
  const qualifies=follower===1&&(likes>=100||gifts>=1||comments>=10);
  const registered=existing?.registered===1||qualifies;
  const newlyRegistered=!existing?.registered&&qualifies;
  const name=String(e.name||existing?.name||user).slice(0,100),avatar=String(e.avatar||existing?.avatar||'').slice(0,2048);
  s.db.run('INSERT OR IGNORE INTO community_members(user,follower,registered,likes,commentAt,shareAt,name,avatar,comments,gifts,shares,joinedAt,seenAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',[user,follower,registered?1:0,likes,existing?.commentAt||0,existing?.shareAt||0,name,avatar,comments,gifts,shares,newlyRegistered?now:(existing?.joinedAt||0),now]);
  s.db.run('UPDATE community_members SET follower=?,registered=?,likes=?,name=?,avatar=?,comments=?,gifts=?,shares=?,joinedAt=?,seenAt=? WHERE user=?',[follower,registered?1:0,likes,name,avatar,comments,gifts,shares,newlyRegistered?now:(existing?.joinedAt||0),now,user]);
  e.follower=raw;
  e.roles=[...new Set([...(e.roles||[]).filter(x=>x!=='follower'),...(e.follower===true?['follower']:[])])];
  e.communityJustRegistered=newlyRegistered;
  if(newlyRegistered){s.db.run('INSERT OR IGNORE INTO users(id,name) VALUES(?,?)',[user,name]);s.db.run('UPDATE users SET name=? WHERE id=?',[name,user]);s.flush();}else this.delayedFlush();
  return e;
 }
 award(e){
  if(e?.simulated||!e?.user)return;
  const s=this.store,p=normalizePoints(s.get('pointSettings')||{});
  const m=s.all('SELECT * FROM community_members WHERE user=?',[e.user])[0];
  if(!m||m.registered!==1||s.all('SELECT id FROM community_events WHERE id=?',[e.id]).length)return;
  const now=Date.now();let amount=0;
  s.db.run('BEGIN IMMEDIATE');
  try{
   s.db.run('INSERT OR IGNORE INTO users(id,name) VALUES(?,?)',[e.user,m.name||e.name||e.user]);
   if(p.enabled&&m.follower===1){
    if(e.communityJustRegistered){amount=p.initialPoints;}
    else{
     if(e.type==='gift')amount+=Math.floor(Math.max(0,Number(e.coins)||0)*p.perCoin);
     if(e.type==='follow')amount+=p.perFollow;
     if(e.type==='subscription')amount+=p.perSubscription;
     if(e.type==='like'){
      const next=(m.eligibleLikes||0)+Math.max(0,Math.floor(Number(e.count)||1));
      amount+=(Math.floor(next/p.likesPerPoint)-Math.floor((m.eligibleLikes||0)/p.likesPerPoint))*p.perLike;
      m.eligibleLikes=next;
     }
     for(const [type,key,cooldown,reward] of [['comment','commentAt',p.commentCooldown,p.perComment],['share','shareAt',p.shareCooldown,p.perShare]]){
      if(e.type===type&&(!m[key]||now-m[key]>=cooldown*1000)){amount+=reward;m[key]=now;}
     }
     if(m.lastEligibleAt&&now>=m.lastEligibleAt&&now-m.lastEligibleAt<=120000){m.activeMs=(m.activeMs||0)+(now-m.lastEligibleAt);}
     const mins=Math.floor((m.activeMs||0)/60000),unpaid=Math.max(0,mins-(m.creditedMinutes||0));
     amount+=unpaid*p.perMinute;m.creditedMinutes=mins;
    }
    m.lastEligibleAt=now;
   }
   if(!Number.isSafeInteger(amount)||amount>1000000000)throw Error('Recompensa fuera de rango');
   if(amount>0){
    const current=s.all('SELECT balance FROM users WHERE id=?',[e.user])[0].balance,balance=current+amount;
    if(!Number.isSafeInteger(balance))throw Error('Saldo fuera de rango');
    s.db.run('UPDATE users SET balance=?,name=? WHERE id=?',[balance,m.name||e.user,e.user]);
    s.db.run('INSERT INTO ledger VALUES(?,?,?,?,?,?)',[crypto.randomUUID(),'community:'+e.id,e.user,amount,balance,new Date(now).toISOString()]);
   }
   s.db.run('UPDATE community_members SET commentAt=?,shareAt=?,eligibleLikes=?,activeMs=?,lastEligibleAt=?,creditedMinutes=? WHERE user=?',[m.commentAt||0,m.shareAt||0,m.eligibleLikes||0,m.activeMs||0,m.lastEligibleAt||0,m.creditedMinutes||0,e.user]);
   s.db.run('INSERT INTO community_events VALUES(?)',[e.id]);
   s.db.run('COMMIT');this.delayedFlush();
  }catch(err){try{s.db.run('ROLLBACK');}catch{}throw err;}
 }
 list(){return this.store.all('SELECT m.user,m.name,m.avatar,m.follower,m.registered,m.likes,m.comments,m.gifts,m.shares,m.joinedAt,m.seenAt,m.activeMs,COALESCE(u.balance,0) AS balance FROM community_members m LEFT JOIN users u ON u.id=m.user WHERE m.registered=1 ORDER BY m.joinedAt DESC LIMIT 1000');}
 summary(){const rows=this.store.all('SELECT COUNT(*) AS total,SUM(CASE WHEN registered=1 THEN 1 ELSE 0 END) AS registered FROM community_members')[0]||{};return {registered:rows.registered||0,pending:(rows.total||0)-(rows.registered||0),requirements:{follow:true,anyOf:['100 likes','1 regalo','10 comentarios']}};}
 credit(user,amount){
  if(!Number.isSafeInteger(amount)||amount===0||Math.abs(amount)>1000000)throw Error('Cantidad de puntos inválida');
  const m=this.store.all('SELECT user,name FROM community_members WHERE user=? AND registered=1',[user])[0];
  if(!m)throw Error('La persona todavía no está registrada en la comunidad');
  return this.store.credit(user,m.name||user,amount,'community-manual:'+crypto.randomUUID());
 }
 remove(user){
  const s=this.store;if(!s.all('SELECT user FROM community_members WHERE user=? AND registered=1',[user]).length)throw Error('Miembro no encontrado');
  s.db.run('BEGIN IMMEDIATE');try{
   s.db.run('DELETE FROM ledger WHERE user=?',[user]);
   if(s.all("SELECT name FROM sqlite_master WHERE type='table' AND name='command_runs'").length)s.db.run('DELETE FROM command_runs WHERE user=?',[user]);
   s.db.run('DELETE FROM users WHERE id=?',[user]);s.db.run('DELETE FROM community_members WHERE user=?',[user]);
   s.db.run('COMMIT');s.flush();return true;
  }catch(e){s.db.run('ROLLBACK');throw e;}
 }
 clear(){const s=this.store,users=s.all('SELECT user FROM community_members').map(r=>r.user);s.db.run('BEGIN IMMEDIATE');try{
  for(const user of users){s.db.run('DELETE FROM ledger WHERE user=?',[user]);if(s.all("SELECT name FROM sqlite_master WHERE type='table' AND name='command_runs'").length)s.db.run('DELETE FROM command_runs WHERE user=?',[user]);s.db.run('DELETE FROM users WHERE id=?',[user]);}
  s.db.run('DELETE FROM community_members');s.db.run('DELETE FROM community_events');s.db.run('COMMIT');s.flush();return users.length;
 }catch(e){s.db.run('ROLLBACK');throw e;}}
 close(){if(this.flushTimer){clearTimeout(this.flushTimer);this.flushTimer=null;}this.store.flush();}
}
module.exports={Community,normalizePoints,defaults};
