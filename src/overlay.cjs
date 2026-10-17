const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {demoState}=require('./live-state.cjs');
async function startOverlayServer(store,dir,options={}){
 let token=store.get('overlayToken');if(!token){token=crypto.randomBytes(32).toString('hex');store.set('overlayToken',token);}
 const clients=new Map();let port;
 const server=http.createServer((req,res)=>{
  let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400);return res.end();}
  if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403);return res.end();}
  if(url.searchParams.get('token')!==token){res.writeHead(401);return res.end('No autorizado');}
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  const staticFiles={'/widget.js':['widget.js','text/javascript; charset=utf-8'],'/widget.css':['widget.css','text/css; charset=utf-8']};
  if(staticFiles[url.pathname]){const [name,type]=staticFiles[url.pathname];res.setHeader('Content-Type',type);return res.end(fs.readFileSync(path.join(__dirname,'../renderer',name)));}
  if(['/avatar.svg','/cover.svg'].includes(url.pathname)){res.setHeader('Content-Type','image/svg+xml');return res.end(url.pathname==='/cover.svg'?'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#a36aff"/><stop offset="1" stop-color="#172134"/></linearGradient></defs><rect width="256" height="256" rx="20" fill="url(#g)"/><circle cx="128" cy="128" r="75" fill="#21132e"/><circle cx="128" cy="128" r="25" fill="#d6b5ff"/><text x="128" y="233" fill="white" text-anchor="middle" font-family="sans-serif" font-size="18">WITI BOT</text></svg>':'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#6e3bb5"/><circle cx="50" cy="38" r="19" fill="#d6b8ff"/><path d="M15 100v-15a35 35 0 0 1 70 0v15" fill="#d6b8ff"/></svg>');}
  const parts=url.pathname.split('/'),id=parts[2];
  if(parts[1]==='media'||parts[1]==='sound'){
   const builtin=parts[1]==='sound';if(!(builtin?/^witi-\d{3}\.wav$/:/^[a-f\d]{64}\.(png|jpg|jpeg|webp|gif|mp4|webm|mp3|wav|ogg)$/).test(id||'')){res.writeHead(404);return res.end();}
   const file=path.join(builtin?path.join(__dirname,'../assets/sounds'):dir,id);if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
   const types={mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};res.setHeader('Content-Type',types[id.split('.').pop()]);res.setHeader('Accept-Ranges','bytes');const size=fs.statSync(file).size;
   let start=0,end=size-1;if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m){res.writeHead(416);return res.end();}start=Number(m[1]);end=m[2]?Number(m[2]):end;if(start>end||end>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});}else res.setHeader('Content-Length',size);
   const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());return stream.pipe(res);
  }
  const overlay=store.list('overlays').find(x=>x.id===id);if(!overlay){res.writeHead(404);return res.end();}
  if(parts[1]==='events'){
   const client={res,preview:url.searchParams.get('preview')==='1'};
   res.writeHead(200,{'Content-Type':'text/event-stream','Connection':'keep-alive'});if(!clients.has(id))clients.set(id,new Set());clients.get(id).add(client);
   res.write('data: '+JSON.stringify({type:'config',overlay,timer:store.timer(),...getState(client.preview)})+'\n\n');res.on('close',()=>clients.get(id)?.delete(client));return;
  }
  if(parts[1]!=='overlay'){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self'; connect-src 'self'; frame-ancestors 'self' file:");
  res.end(fs.readFileSync(path.join(__dirname,'../renderer/overlay.html'),'utf8').replaceAll('__TOKEN__',token));
 });
 function getState(preview=false){const state=preview?demoState():options.state?.()||{};return {...state,timer:preview?{remaining:3675,running:true,anchor:Date.now()}:store.timer(),users:preview?[{name:'Witi',balance:1400},{name:'Sher',balance:900},{name:'Comunidad',balance:500}]:store.all('SELECT name,balance FROM users ORDER BY balance DESC LIMIT 20')};}
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(options.port??19381,'127.0.0.1',resolve);});port=server.address().port;
 const send=(id,data)=>{const set=clients.get(id)||new Set();let n=0;for(const c of set){if(data.type==='live'&&c.preview)continue;c.res.write('data: '+JSON.stringify(data)+'\n\n');n++;}return n;};
 const tick=setInterval(()=>{for(const o of store.list('overlays'))for(const c of clients.get(o.id)||[])c.res.write('data: '+JSON.stringify({type:'state',...getState(c.preview)})+'\n\n');},1000);tick.unref();
 return {url:(id,preview=false)=>`http://127.0.0.1:${port}/overlay/${id}?token=${token}${preview?'&preview=1':''}`,asset:(id,builtin=false)=>`http://127.0.0.1:${port}/${builtin?'sound':'media'}/${id}?token=${token}`,emit:send,broadcast:data=>{for(const id of clients.keys())send(id,data);},refresh:()=>store.list('overlays').forEach(o=>{for(const c of clients.get(o.id)||[])c.res.write('data: '+JSON.stringify({type:'config',overlay:o,...getState(c.preview)})+'\n\n');}),close:()=>{clearInterval(tick);for(const set of clients.values())for(const c of set)c.res.end();server.close();}};
}
module.exports={startOverlayServer};
