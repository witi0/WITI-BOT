'use strict';
window.WitiChroma=Object.freeze({
 apply(options={},doc=document){
  const root=doc.documentElement,valid=c=>typeof c==='string'&&/^#[a-f0-9]{6}$/i.test(c);
  const colors=Array.isArray(options.rgbColors)?options.rgbColors.filter(valid).slice(0,12):[];
  const palette=colors.length>=2?colors:['#9464ff','#f472b6','#38bdf8','#34d399','#fbbf24'];
  let sheet=doc.getElementById('witi-palette');if(!sheet){sheet=doc.createElement('style');sheet.id='witi-palette';doc.head.append(sheet);}
  const stops=[...palette,palette[0]].map((c,i)=>`${i/palette.length*100}%{--witi-chroma:${c}}`).join('');
  const rules=`@property --witi-chroma{syntax:'<color>';inherits:true;initial-value:#9464ff}@keyframes witiPalette{${stops}}`;
  if(sheet.textContent!==rules)sheet.textContent=rules;
  const active=options.rgb!==false,style=root.style;
  const seconds=Math.min(60,Math.max(.2,Number(options.rgbSpeed)||3));
  style.setProperty('--chroma-duration',seconds+'s');
  style.setProperty('--chroma-colors',`linear-gradient(${Number(options.rgbAngle)||90}deg,${[...palette,palette[0]].join(',')})`);
  style.setProperty('--chroma-saturation',Math.min(200,Math.max(0,Number(options.rgbSaturation??100)))+'%');
  style.setProperty('--chroma-brightness',Math.min(180,Math.max(50,Number(options.rgbBrightness??100)))+'%');
  style.setProperty('--chroma-direction',['normal','reverse','alternate'].includes(options.rgbDirection)?options.rgbDirection:'normal');
  style.setProperty('--witi-chroma',valid(options.color)?options.color:palette[0]);
  root.dataset.chroma=active?'on':'off';root.dataset.chromaText=active&&options.textRgb!==false?'on':'off';root.dataset.chromaBorder=active&&options.borderRgb!==false?'on':'off';root.dataset.alpha=options.transparent?'clean':'solid';
  style.setProperty('animation',active?`witiPalette ${seconds}s linear infinite var(--chroma-direction,normal)`:'none','important');
 }
});
