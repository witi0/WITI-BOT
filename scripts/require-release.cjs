const r=require('../release.json');
if(!/^[\w-]+$/.test(r.owner||'')||!/^[\w.-]+$/.test(r.repo||'')||!r.publicKey)throw Error('Falta configurar repositorio y clave pública de actualizaciones');
if(!process.env.WITI_UPDATE_PRIVATE_KEY)throw Error('Configura WITI_UPDATE_PRIVATE_KEY como secreto de CI. Nunca se guarda en el código ni en el instalador.');
