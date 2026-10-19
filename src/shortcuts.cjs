'use strict';
const actions=['overlays','rules','sounds','gifts','connections','tts','stop','tts-toggle','tts-stop','simulator','contributors'];
const defaults=[['overlays','CTRL+ALT+O'],['rules','CTRL+ALT+E'],['sounds','CTRL+ALT+S'],['gifts','CTRL+ALT+G'],['connections','CTRL+ALT+C'],['tts','CTRL+ALT+V'],['stop','CTRL+ALT+X'],['tts-toggle','CTRL+ALT+T'],['tts-stop','CTRL+ALT+M']].map(([action,key])=>({id:action,action,key}));
function validateBindings(rows){if(!Array.isArray(rows)||rows.length>40)throw Error('Máximo 40 atajos');const used=new Set(),ids=new Set();return rows.map((row,i)=>{if(!actions.includes(row.action))throw Error('Acción de atajo inválida');const key=String(row.key||'').toUpperCase().replace(/\s+/g,'');if(!/^(CTRL\+)?(ALT\+)?(SHIFT\+)?(?:[A-Z0-9]|F(?:[1-9]|1[0-9]|2[0-4])|SPACE)$/.test(key)||!/[+]/.test(key))throw Error('Usa Ctrl, Alt o Shift y una tecla');if(used.has(key))throw Error('Atajo duplicado: '+key);used.add(key);const id=String(row.id||i);if(ids.has(id))throw Error('Identificador repetido');ids.add(id);return {id,action:row.action,key};});}
function getDefaults(legacy={}){const used=new Set();return defaults.map(b=>({...b,key:legacy[b.action]||b.key})).filter(b=>{if(used.has(b.key))return false;used.add(b.key);return true;});}
class Shortcuts{
 constructor({api,run}){this.api=api;this.run=run;this.bindings=[];}
 install(rows){const clean=validateBindings(rows),previous=this.bindings;this.api?.unregisterAll();try{for(const b of clean)if(this.api&&!this.api.register(b.key,()=>this.run(b.action)))throw Error('Windows no pudo reservar '+b.key+'. Elige otra combinación.');this.bindings=clean;return clean;}catch(e){this.api?.unregisterAll();for(const b of previous)this.api?.register(b.key,()=>this.run(b.action));throw e;}}
 close(){this.api?.unregisterAll();}
}
module.exports={Shortcuts,defaults,getDefaults,actions,validateBindings};
