'use strict';
const {followerStatus}=require('./follower.cjs');
const defaults={enabled:false,initialPoints:25,perCoin:1,perFollow:5,perShare:5,perComment:0,perSubscription:25,perLike:1,likesPerPoint:100,commentCooldown:10,shareCooldown:30};
function normalizePoints(input={}){const out={enabled:!!input.enabled};for(const [key,fallback]of Object.entries(defaults)){if(key==='enabled')continue;const n=Number(input[key]??fallback);if(!Number.isFinite(n)||n<0||n>100000||(['likesPerPoint'].includes(key)&&n<1))throw Error('Cantidad de puntos inválida: '+key);out[key]=key==='perCoin'?n:Math.floor(n);}return out;}
class Community{
 constructor(store){this.store=store;store.db.run('CREATE TABLE IF NOT EXISTS community_members(user TEXT PRIMARY KEY,follower INTEGER,registered INTEGER NOT NULL DEFAULT 0,likes INTEGER NOT NULL DEFAULT 0,commentAt INTEGER NOT NULL DEFAULT 0,shareAt INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS community_events(id TEXT PRIMARY KEY)');}
 observe(e){if(e.simulated||!e.user||!['follow','like','share','comment','gift','subscription'].includes(e.type))return e;const s=this.store;const raw=followerStatus(e);let m=s.all('SELECT * FROM community_members WHERE user=?',[e.user])[0];if(!m&&raw!==true){e.follower=raw;return e;}if(!m){s.db.run('INSERT INTO community_members(user,follower) VALUES(?,?)',[e.user,raw===null?null:Number(raw)]);m={follower:raw===null?null:Number(raw),registered:0,likes:0,commentAt:0,shareAt:0};}else if(raw!==null){m.follower=Number(raw);s.db.run('UPDATE community_members SET follower=? WHERE user=?',[m.follower,e.user]);}e.follower=raw;e.roles=[...new Set([...(e.roles||[]).filter(r=>r!=='follower'),...(e.follower===true?['follower']:[])])];return e;}
 award(e){if(e.simulated||!e.user||e.follower!==true)return;const s=this.store,p=normalizePoints(s.get('pointSettings')||{});if(!p.enabled)return;const m=s.all('SELECT * FROM community_members WHERE user=?',[e.user])[0];if(!m||s.all('SELECT id FROM community_events WHERE id=?',[e.id]).length)return;let amount=0;const now=Number(e.at)||Date.now();s.db.run('BEGIN IMMEDIATE');try{
  s.db.run('INSERT OR IGNORE INTO users(id,name) VALUES(?,?)',[e.user,e.name||e.user]);
  if(!m.registered){amount+=p.initialPoints;m.registered=1;}
  if(e.type==='gift')amount+=Math.floor(Math.max(0,e.coins||0)*p.perCoin);
  if(e.type==='follow')amount+=p.perFollow;
  if(e.type==='subscription')amount+=p.perSubscription;
  if(e.type==='like'){const likes=Math.max(0,Math.floor(e.count||0));amount+=(Math.floor((m.likes+likes)/p.likesPerPoint)-Math.floor(m.likes/p.likesPerPoint))*p.perLike;m.likes+=likes;}
  for(const [type,key,cooldown,reward]of [['comment','commentAt',p.commentCooldown,p.perComment],['share','shareAt',p.shareCooldown,p.perShare]])if(e.type===type&&(!m[key]||now-m[key]>=cooldown*1000)){amount+=reward;m[key]=now;}
  if(!Number.isSafeInteger(amount)||amount>1000000000)throw Error('Recompensa fuera de rango');
  if(amount){const balance=s.all('SELECT balance FROM users WHERE id=?',[e.user])[0].balance+amount;if(!Number.isSafeInteger(balance))throw Error('Saldo fuera de rango');s.db.run('UPDATE users SET balance=?,name=? WHERE id=?',[balance,e.name||e.user,e.user]);s.db.run('INSERT INTO ledger VALUES(?,?,?,?,?,?)',[require('node:crypto').randomUUID(),'community:'+e.id,e.user,amount,balance,new Date().toISOString()]);}
  s.db.run('UPDATE community_members SET registered=?,likes=?,commentAt=?,shareAt=? WHERE user=?',[m.registered,m.likes,m.commentAt,m.shareAt,e.user]);s.db.run('INSERT INTO community_events VALUES(?)',[e.id]);s.db.run('COMMIT');s.flush();
 }catch(err){s.db.run('ROLLBACK');throw err;}}
}
module.exports={Community,normalizePoints,defaults};
