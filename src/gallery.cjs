const crypto=require('node:crypto');
const catalog=[
 ['music','Música · Studio','Música','Portada, avatar, progreso y siguientes canciones'],
 ['topgifters','Top regalos · Podio','Rankings','Medallas y monedas por espectador'],
 ['toplikes','Top likes · Comunidad','Rankings','Clasificación de likes observados'],
 ['ranking','Ranking de puntos','Rankings','Puntos persistentes del creador'],
 ['chat','Chat · Burbujas','Comunidad','Comentarios con avatar y nombre'],
 ['giftfeed','Regalos · Feed','Interacciones','Últimos regalos y cantidades'],
 ['lastfollow','Último seguidor','Comunidad','Tarjeta de bienvenida'],
 ['lastgift','Último regalo','Interacciones','Usuario, regalo y monedas'],
 ['lastshare','Último compartido','Comunidad','La persona que comparte el LIVE'],
 ['lastsub','Última suscripción','Comunidad','Suscripción informada por el proveedor'],
 ['goal','Meta de likes','Metas','Progreso configurable en directo'],
 ['goal','Meta de seguidores','Metas','Barra o anillo de progreso','follows'],
 ['goal','Meta de monedas','Metas','Objetivo de regalos en monedas','coins'],
 ['goal','Meta de compartidos','Metas','Seguimiento de compartidos','shares'],
 ['giftcounter','Contador de regalo','Metas','Cuenta un ID de regalo seleccionado'],
 ['stats','Estadísticas del LIVE','Metas','Likes, seguidores, regalos y espectadores'],
 ['timer','Temporizador · Extensible','Tiempo','Cuenta atrás persistente'],
 ['ticker','Avisos · Ticker','Escena','Texto en movimiento configurable'],
 ['social','Rotador de redes','Escena','Enlaces sociales en rotación'],
 ['webcam','Marco de webcam','Escena','Marco transparente con RGB opcional'],
 ['likefountain','Fuente de corazones','Interacciones','Partículas por likes'],
 ['fireworks','Celebración de regalos','Interacciones','Explosiones de partículas por regalo'],
 ['coinjar','Frasco de monedas','Interacciones','Partículas con gravedad dentro de un frasco'],
 ['buddies','Compañeros del chat','Comunidad','Avatares que recorren el escenario'],
 ['wheel','Ruleta','Herramientas','Premios con pesos configurables'],
 ['vote','Votación del chat','Herramientas','Votos A y B, uno por usuario'],
 ['commands','Panel de comandos','Comunidad','Instrucciones visibles para espectadores'],
 ['usercard','Tarjeta de usuario','Comunidad','Última persona activa en chat'],
 ['slider','Duelo de likes y regalos','Herramientas','Comparación de contadores'],
 ['webcam','Marco Aurora','Escena','Borde RGB translúcido y centro transparente'],
 ['webcam','Marco Minimal','Escena','Marco limpio y ligero'],
 ['webcam','Marco Glitch','Escena','Brillo angular dinámico'],
 ['webcam','Marco Órbita','Escena','Pulsos de luz animados'],
 ['webcam','Marco Gold','Escena','Acentos metálicos premium'],
 ['actions','Pantalla de acciones','Interacciones','Alertas, imágenes, GIF, video y sonido'],
 ['topgift','Regalo más valioso','Interacciones','Destaca el regalo de mayor valor durante el LIVE'],
 ['topstreak','Mayor racha de regalos','Interacciones','Muestra la combinación más larga del LIVE']
].map(([kind,name,category,description,metric],i)=>({template:'witi-'+i,kind,name,category,description,metric:metric||'likes'}));
for(const [source,name,stylePreset]of [['witi-0','Música · Nocturne','broadcast'],['witi-1','Donadores · Catedral','glass'],['witi-4','Chat · Carmesí','neon'],['witi-19','Cámara · Eclipse','clean'],['witi-34','Alertas · Ritual','neon'],['witi-16','Reloj · Medianoche','broadcast']]){const base=catalog.find(t=>t.template===source);catalog.push({...base,name,template:'witi-'+catalog.length,stylePreset});}
for(const [key,name] of [['musicMinimal','Música · Minimal'],['musicCompact','Música · Compacta'],['musicCover','Música · Portada'],['musicTicker','Música · Barra'],['musicVinyl','Música · Vinilo'],['musicQueue','Música · Cola']])catalog.push({template:'witi-'+catalog.length,kind:'music',name,category:'Música',description:'Diseño musical independiente',legacy12Key:key,...require('./overlay-designs.cjs').designDefaults(key)});
catalog.push({template:'witi-'+catalog.length,kind:'commandresponses',name:'Respuestas RGB · Comandos',category:'Comunidad',description:'Respuestas de /puntos, errores de saldo y avisos de comandos'});
const kinds=[...new Set(catalog.map(x=>x.kind))];
function fromTemplate(template){const t=catalog.find(t=>t.template===template);if(!t)throw Error('Plantilla desconocida');return {...t,id:crypto.randomUUID(),color:'#9464ff',secondary:'#43318f',rgb:true,borderRgb:true,textRgb:false,rgbSpeed:8,fontFamily:'outfit',stylePreset:t.stylePreset||'glass',frameStyle:['aurora','minimal','glitch','orbit','gold'].includes(t.name.toLowerCase().split(' ').at(-1))?t.name.toLowerCase().split(' ').at(-1):'neon',width:800,height:450,fontSize:28,opacity:0.92,radius:22,duration:7,volume:0.8,target:1000,top:5,goalStyle:'bar',showAvatar:true,showCover:true,showQueue:true,transparent:false,text:'Bienvenidos al LIVE · Gracias por acompañarme',items:'TikTok: @tuusuario\nDiscord: tu comunidad\nYouTube: tu canal',prizes:[{name:'10 puntos',weight:4},{name:'Un saludo',weight:3},{name:'Sorpresa',weight:1}],giftId:'',...(t.legacy12Key?require('./overlay-designs.cjs').designDefaults(t.legacy12Key):{})};}
function installGallery(store){const old=Number(store.get('galleryVersion')||0);if(old>=4)return;if(typeof store.list!=='function'){store.set('galleryVersion',4);return;}for(const kind of ['actions','commandresponses','giftfeed','chat']){if(!store.list('overlays').some(o=>o.kind===kind)){const t=catalog.find(t=>t.kind===kind);store.save('overlays',{...fromTemplate(t.template),...(kind==='commandresponses'?{rgb:true,textRgb:true,borderRgb:false,transparent:true,opacity:0,duration:6}:{} )});}}store.set('galleryVersion',4);}
function validateOverlay(o){if(o?.id&&!/^[a-f\d-]{36}$/i.test(o.id))throw Error('ID de pantalla inválido');if(!o||typeof o.name!=='string'||!o.name.trim()||o.name.length>100||!kinds.includes(o.kind))throw Error('Overlay inválido');for(const key of ['color','secondary'])if(o[key]&&!/^#[a-f\d]{6}$/i.test(o[key]))throw Error('Color inválido');const out={...o,id:typeof o.id==='string'?o.id:crypto.randomUUID()};for(const [key,min,max,fallback]of [['width',200,3840,800],['height',100,2160,450],['fontSize',12,100,28],['opacity',0,1,.92],['radius',0,100,22],['duration',1,120,7],['volume',0,1,.8],['target',1,100000000,1000],['top',1,20,5]])out[key]=Math.min(max,Math.max(min,Number.isFinite(Number(o[key]))?Number(o[key]):fallback));out.musicLayout=['studio','minimal','compact','cover','ticker','vinyl','queue'].includes(o.musicLayout)?o.musicLayout:'studio';out.borderRgb=!!o.borderRgb;out.textRgb=!!o.textRgb;out.rgbSpeed=Math.max(.1,Math.min(10,Number(o.rgbSpeed)||3));out.fontFamily=['outfit','syne','system','gothic'].includes(o.fontFamily)?o.fontFamily:'outfit';out.stylePreset=['glass','neon','clean','broadcast'].includes(o.stylePreset)?o.stylePreset:'glass';out.frameStyle=['neon','aurora','minimal','glitch','orbit','gold'].includes(o.frameStyle)?o.frameStyle:'neon';out.color=o.color||'#ad7aff';out.secondary=o.secondary||'#4de2da';out.text=String(o.text||'').slice(0,2000);out.items=String(o.items||'').slice(0,5000);out.giftId=String(o.giftId||'').slice(0,100);out.prizes=(o.prizes||[]).slice(0,30).map(p=>({name:String(p.name||'Premio').slice(0,80),weight:Math.min(1000,Math.max(1,Number(p.weight)||1))}));for(const k of ['showTitle','showRank','showUsername','showValue','showProgress'])out[k]=o[k]!==false;out.favorite=!!o.favorite;out.avatarSize=Math.min(120,Math.max(24,Number(o.avatarSize)||45));out.align=['left','center','right'].includes(o.align)?o.align:'left';out.vertical=['top','center','bottom'].includes(o.vertical)?o.vertical:'top';out.rgbAngle=Math.min(360,Math.max(0,Number(o.rgbAngle)||0));out.rgbSaturation=Math.min(200,Math.max(0,Number(o.rgbSaturation??100)));out.rgbBrightness=Math.min(180,Math.max(50,Number(o.rgbBrightness??100)));out.rgbDirection=['normal','reverse','alternate'].includes(o.rgbDirection)?o.rgbDirection:'normal';out.rgbColors=(Array.isArray(o.rgbColors)?o.rgbColors:[]).filter(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)).slice(0,12);if(out.rgbColors.length<2)out.rgbColors=[];return out;}
function pickPrize(prizes,random=Math.random){if(!Array.isArray(prizes)||!prizes.length)throw Error('La ruleta necesita premios');let n=random()*prizes.reduce((s,p)=>s+p.weight,0);for(const p of prizes){n-=p.weight;if(n<0)return p.name;}return prizes.at(-1).name;}
module.exports={catalog,kinds,fromTemplate,installGallery,validateOverlay,pickPrize};
