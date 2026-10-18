const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('todos los comandos registrados están expuestos por el puente seguro',()=>{
 const main=fs.readFileSync(path.join(__dirname,'../src/main.cjs'),'utf8'),pre=fs.readFileSync(path.join(__dirname,'../src/preload.cjs'),'utf8');
 for(const [,command]of main.matchAll(/handle\('([^']+)'/g))assert.ok(pre.includes("'"+command+"'"),command);
});
