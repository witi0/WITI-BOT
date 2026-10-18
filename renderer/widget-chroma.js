'use strict';
window.WitiChroma=Object.freeze({
 apply(options,doc=document){
  const root=doc.documentElement,style=root.style,o=options||{};
  const valid=x=>typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x);
  const colors=Array.isArray(o.rgbColors)?o.rgbColors.filter(valid).slice(0,12):[];
  const preset=colors.length>=2?colors:['#ff0055','#ffbf00','#00ff88','#00f0ff','#4167ff','#ff45e2','#ff0055'];
  const angle=Number.isFinite(Number(o.rgbAngle))?Math.min(360,Math.max(0,Number(o.rgbAngle))):90;
  const speed=Number.isFinite(Number(o.rgbSpeed))?Math.min(10,Math.max(.1,Number(o.rgbSpeed))):3;
  const saturation=Number.isFinite(Number(o.rgbSaturation))?Math.min(200,Math.max(0,Number(o.rgbSaturation))):100;
  const brightness=Number.isFinite(Number(o.rgbBrightness))?Math.min(180,Math.max(50,Number(o.rgbBrightness))):100;
  style.setProperty('--chroma-colors',`linear-gradient(${angle}deg,${preset.join(',')})`);
  style.setProperty('--chroma-duration',speed+'s');style.setProperty('--chroma-saturation',saturation+'%');style.setProperty('--chroma-brightness',brightness+'%');
  root.dataset.chroma=o.rgb===false?'off':'on';root.dataset.alpha=o.transparent?'clean':'solid';
 }
});
