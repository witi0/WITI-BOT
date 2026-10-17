const http=require('node:http'),crypto=require('node:crypto');
function pkce(encoding='base64url'){const verifier=crypto.randomBytes(48).toString('base64url');return {verifier,challenge:crypto.createHash('sha256').update(verifier).digest(encoding),state:crypto.randomBytes(24).toString('hex')};}
function equal(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y);}
async function listenCallback({port,state,onCode,onError}){
 let used=false;const uri=`http://127.0.0.1:${port}/callback`;let timer;
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
  const url=new URL(req.url,uri);
  if(req.method!=='GET'||req.headers.host!==`127.0.0.1:${port}`||url.pathname!=='/callback'){res.writeHead(404);return res.end('No encontrado');}
  if(!equal(url.searchParams.get('state'),state)){res.writeHead(403);return res.end('Estado de autorización inválido. Regresa a WITI BOT.');}
  if(used){res.writeHead(409);return res.end('Autorización ya procesada');}used=true;
  try{if(url.searchParams.has('error'))throw Error('Autorización cancelada o denegada');const code=url.searchParams.get('code');if(!code||code.length>2048)throw Error('Código de autorización inválido');await onCode(code,uri);res.end('Cuenta conectada. Puedes cerrar esta pestaña y regresar a WITI BOT.');}
  catch(e){onError(e);res.writeHead(400);res.end('No se pudo conectar la cuenta. Revisa el aviso en WITI BOT.');}
  finally{clearTimeout(timer);server.close();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 timer=setTimeout(()=>{server.close();onError(Error('La autorización expiró; vuelve a iniciar sesión'));},5*60000);timer.unref();
 return {uri,close:()=>{clearTimeout(timer);server.close();}};
}
async function jsonRequest(url,options={}){const res=await fetch(url,{...options,signal:options.signal||AbortSignal.timeout(15000)});if(res.status===204)return null;let body;try{body=await res.json();}catch{throw Error('Respuesta inválida del servicio');}if(!res.ok){const e=Error(res.status===429?'Límite de solicitudes del servicio':res.status===403?'El proveedor rechazó los permisos. Revisa Premium, usuarios autorizados y acceso de tu aplicación.':res.status===401?'Sesión caducada o revocada':`El servicio respondió HTTP ${res.status}`);e.status=res.status;e.retryAfter=Number(res.headers.get('retry-after'))||30;throw e;}return body;}
module.exports={pkce,equal,listenCallback,jsonRequest};
