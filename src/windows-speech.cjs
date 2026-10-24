'use strict';
const {spawn}=require('node:child_process');
function localSpeech({text,rate=1}={},{runner=spawn,platform=process.platform}={}){
 if(platform!=='win32')return Promise.reject(Error('La voz local SAPI solo está disponible en Windows'));
 const clean=String(text||'').trim().slice(0,500);
 if(!clean)return Promise.reject(Error('Escribe un texto para escuchar'));
 const base64=Buffer.from(clean,'utf8').toString('base64');
 const speed=Math.round(Math.max(-10,Math.min(10,(Number(rate)||1)-1))*5);
 const script=[
  "$ErrorActionPreference='Stop'",
  'Add-Type -AssemblyName System.Speech',
  '$speaker=New-Object System.Speech.Synthesis.SpeechSynthesizer',
  "$candidates=@($speaker.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'es-*' })",
  "if($candidates.Count -lt 1){throw 'Windows no tiene una voz SAPI en español instalada'}",
  '$speaker.SelectVoice($candidates[0].VoiceInfo.Name)',
  '$speaker.Rate='+speed,
  '$stream=New-Object System.IO.MemoryStream',
  '$speaker.SetOutputToWaveStream($stream)',
  "$words=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('"+base64+"'))",
  '$speaker.Speak($words)',
  '$speaker.SetOutputToNull()',
  '[Console]::Out.Write([Convert]::ToBase64String($stream.ToArray()))',
  '$stream.Dispose()',
  '$speaker.Dispose()'
 ].join(';');
 return new Promise((resolve,reject)=>{
  const ps=runner('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  const out=[],errors=[];let length=0,settled=false;
  const done=(err,result)=>{if(settled)return;settled=true;clearTimeout(timeout);err?reject(err):resolve(result);};
  const timeout=setTimeout(()=>{ps.kill();done(Error('La voz local agotó el tiempo de síntesis'));},20000);
  ps.stdout.on('data',chunk=>{length+=chunk.length;if(length>4500000){ps.kill();done(Error('Audio demasiado grande'));return;}out.push(chunk);});
  ps.stderr.on('data',chunk=>{if(errors.reduce((n,x)=>n+x.length,0)<1500)errors.push(chunk);});
  ps.on('error',err=>done(Error('No se pudo iniciar la voz de Windows: '+err.message)));
  ps.on('close',code=>{
   if(settled)return;
   const data=Buffer.concat(out).toString('utf8').trim();
   if(code!==0||!data||!/^[-_A-Za-z0-9+/]+={0,2}$/.test(data))return done(Error('La voz SAPI no pudo sintetizar: '+Buffer.concat(errors).toString('utf8').slice(0,250)));
   done(null,{mime:'audio/wav',data,provider:'Windows SAPI · respaldo local'});
  });
 });
}
module.exports={localSpeech};
