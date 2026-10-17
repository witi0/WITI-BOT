'use strict';
const DEFAULT_APPEARANCE=Object.freeze({rgb:true,reducedMotion:false,mode:'aurora',accent:'#f2a66f',speed:9,intensity:62,font:'bahnschrift',compact:false});
const MODES=new Set(['aurora','spectrum','pulse']);
const FONTS=new Set(['bahnschrift','segoe','trebuchet']);
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
  compact:typeof value.compact==='boolean'?value.compact:base.compact
 };
}
module.exports={DEFAULT_APPEARANCE,normalizeAppearance};
