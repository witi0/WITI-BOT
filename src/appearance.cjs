'use strict';
const DEFAULT_APPEARANCE=Object.freeze({rgb:true,reducedMotion:false,mode:'pulse',accent:'#9464ff',speed:9,intensity:72,font:'segoe',compact:false,rgbColors:['#9464ff','#f472b6','#38bdf8','#34d399','#fbbf24']});
const MODES=new Set(['aurora','spectrum','pulse']);
const FONTS=new Set(['bahnschrift','segoe','trebuchet','gothic']);
function normalizeAppearance(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Preferencias de apariencia inválidas');
 const base=DEFAULT_APPEARANCE;
 const color=typeof value.accent==='string'&&/^#[0-9a-f]{6}$/i.test(value.accent)?value.accent:base.accent;
 const speed=Number(value.speed),intensity=Number(value.intensity);
 return {
  rgb:typeof value.rgb==='boolean'?value.rgb:base.rgb,
  reducedMotion:typeof value.reducedMotion==='boolean'?value.reducedMotion:base.reducedMotion,
  mode:MODES.has(value.mode)?value.mode:base.mode,
  accent:color.toLowerCase(),
  speed:Number.isFinite(speed)?Math.min(24,Math.max(4,speed)):base.speed,
  intensity:Number.isFinite(intensity)?Math.min(100,Math.max(10,intensity)):base.intensity,
  font:FONTS.has(value.font)?value.font:base.font,
  rgbColors:(Array.isArray(value.rgbColors)&&value.rgbColors.filter(c=>/^#[a-f0-9]{6}$/i.test(c)).length>=2?value.rgbColors.filter(c=>/^#[a-f0-9]{6}$/i.test(c)).slice(0,12):['#9464ff','#f472b6','#38bdf8','#34d399','#fbbf24']),
  compact:typeof value.compact==='boolean'?value.compact:base.compact
 };
}
module.exports={DEFAULT_APPEARANCE,normalizeAppearance};
