// WITI_UPDATE_PRIVATE_KEY is an Ed25519 PKCS8 PEM supplied only by the owner/CI.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const pkg=require('../package.json'),config=require('../release.json');
const file=path.resolve('dist',`WITI_BOT_Setup_v${pkg.version}.exe`);
const secret=process.env.WITI_UPDATE_PRIVATE_KEY;if(!secret)throw Error('Configura WITI_UPDATE_PRIVATE_KEY como secreto de GitHub Actions');
const key=crypto.createPrivateKey(secret);const expected=crypto.createPublicKey(config.publicKey).export({format:'der',type:'spki'}),actual=crypto.createPublicKey(key).export({format:'der',type:'spki'});if(!actual.equals(expected))throw Error('La clave privada no corresponde a la clave pública del programa');
const bytes=fs.readFileSync(file),notes=fs.readFileSync('CHANGELOG.md','utf8');
const payload=Buffer.from(JSON.stringify({version:pkg.version,url:`https://github.com/${config.owner}/${config.repo}/releases/download/v${pkg.version}/${path.basename(file)}`,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),notes,published:new Date().toISOString()}));
fs.writeFileSync('dist/witi-update.json',JSON.stringify({payload:payload.toString('base64'),signature:crypto.sign(null,payload,key).toString('base64')},null,2)+'\n');console.log('Update manifest signed; no private key included in output.');
