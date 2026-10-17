const {test}=require('node:test');const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');
const {TikTokReader,cleanUsername,classifyError}=require('../src/tiktok.cjs');
const eventTypes={WebcastEvent:{CHAT:'chat',GIFT:'gift',FOLLOW:'follow',SHARE:'share',LIKE:'like',SUBSCRIBE:'sub',ROOM_USER:'room_user'},ControlEvent:{ERROR:'error',DISCONNECTED:'disconnected'}};
function reader(overrides={}){
 const store={set(){}};const changes=[];const r=new TikTokReader({event:()=>{},status:s=>changes.push(s),store,secretGet:()=>'',eventTypes,...overrides});return{r,changes};
}
test('TikTok username and profile LIVE URL normalized',()=>{
 assert.equal(cleanUsername('@witimc'),'witimc');assert.equal(cleanUsername('https://www.tiktok.com/@witimc/live?lang=es'),'witimc');assert.equal(cleanUsername('https://www.tiktok.com/@witimc'),'witimc');
 assert.equal(classifyError(new Error('429 too many requests'),'witimc').code,'LIMIT');
 assert.equal(classifyError(new Error('UserOfflineError'),'witimc').code,'OFFLINE');
});
test('LIVE connection is marked active ONLY after WebSocket connect resolves',async()=>{
 const conn=new EventEmitter();conn.connect=async()=>({roomId:'1234'});conn.disconnect=async()=>{};
 const {r}=reader({connectionFactory:()=>conn});await r.connect('https://www.tiktok.com/@witimc/live');
 assert.equal(r.state.connected,true);assert.equal(r.state.liveDetected,true);assert.equal(r.state.roomId,'1234');r.disconnect();
});
test('live detected but chat handshake failed does not claim connected',async()=>{
 const conn=new EventEmitter();conn.connect=async()=>{throw Error('WebSocket handshake failure')};conn.fetchIsLive=async()=>true;conn.disconnect=async()=>{};
 const {r}=reader({connectionFactory:()=>conn});await assert.rejects(r.connect('@witimc'),/LIVE detectado/);
 assert.equal(r.state.connected,false);assert.equal(r.state.liveDetected,true);assert.equal(r.state.errorCode,'HANDSHAKE');assert(r.state.nextRetryAt>Date.now());r.disconnect();
});
test('offline is not confused with blocked transport',async()=>{
 const conn=new EventEmitter();conn.connect=async()=>{throw Error('UserOfflineError')};conn.fetchIsLive=async()=>false;conn.disconnect=async()=>{};
 const {r}=reader({connectionFactory:()=>conn});await assert.rejects(r.connect('witimc'),/no confirma un LIVE activo/);
 assert.equal(r.state.liveDetected,false);assert.equal(r.state.connected,false);r.disconnect();
});
test('cancelled connection never reactivates the state',async()=>{
 let resolve;const conn=new EventEmitter();conn.connect=()=>new Promise(r=>{resolve=r});conn.disconnect=async()=>{};
 const {r}=reader({connectionFactory:()=>conn});const pending=r.connect('witimc');r.disconnect();resolve({roomId:'dead'});await pending;
 assert.equal(r.state.connected,false);assert.equal(r.state.status,'Desconectado');
});
test('fallback skips room-info preflight and connects when the first method fails',async()=>{
 let attempt=0;const options=[];
 const {r}=reader({connectionFactory:(name,opts)=>{attempt++;options.push(opts);const c=new EventEmitter();c.connect=async()=>{if(attempt===1)throw Error('getRoomInfo unavailable');return {roomId:'live-room'}};c.disconnect=async()=>{};return c;}});
 await r.connect('witimc');assert.equal(attempt,2);assert.equal(options[0].fetchRoomInfoOnConnect,true);assert.equal(options[1].fetchRoomInfoOnConnect,false);assert.equal(r.state.connected,true);r.disconnect();
});
