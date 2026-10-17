'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=path.join(__dirname,'../assets/sounds');
test('only curated sound library is shown, with distinct files and safe licenses',()=>{
 const list=require('../assets/sounds/catalog.json');assert.equal(list.length,60);
 assert.equal(new Set(list.map(x=>x.file)).size,60);assert.ok(!list.some(x=>/boing|campana\s*\d|power up \d/i.test(x.name)));
 for(const s of list){const data=fs.readFileSync(path.join(base,s.file));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),s.sha256);assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WAVE');assert.match(s.origin,/original/i);}
});
test('legacy sound files survive updates so existing user rules still work',()=>{
 for(const file of ['witi-001.wav','witi-141.wav','witi-200.wav'])assert.ok(fs.existsSync(path.join(base,file)));
});
test('the new logo has real PNG and ICO signatures',()=>{
 const png=fs.readFileSync(path.join(__dirname,'../build/icon.png'));
 const ico=fs.readFileSync(path.join(__dirname,'../build/icon.ico'));
 assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(ico.subarray(0,4).toString('hex'),'00000100');
});
