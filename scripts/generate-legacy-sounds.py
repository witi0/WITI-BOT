"""200 efectos sintetizados originales; sin muestras ni audio de terceros."""
from pathlib import Path
import math,wave,struct,random,json,hashlib
out=Path(__file__).resolve().parents[1]/'assets'/'sounds';out.mkdir(parents=True,exist_ok=True)
families=[('Notificaciones','Campana'),('Gaming','Power up'),('Gaming','Láser'),('Errores','Glitch'),('Celebraciones','Victoria'),('Suspenso','Tensión'),('Donaciones','Monedas'),('Reacciones','Boing'),('Transiciones','Whoosh'),('Interacciones','Pulso')]
manifest=[];sr=22050
for family,(category,label) in enumerate(families):
 for variant in range(20):
  i=family*20+variant; rng=random.Random(104729+i);duration=.35+(variant%5)*.12+(family in [4,5])*.5;freq=180+variant*21;buf=[]
  for n in range(int(sr*duration)):
   t=n/sr;x=t/duration;env=min(1,t/.008)*max(0,1-x)**(1.5 if family!=5 else .6)
   if family==0: sample=sum(math.sin(2*math.pi*freq*k*t)*math.exp(-t*(3+k)) /k for k in [1,2.76,4.1])
   elif family==1: sample=math.sin(2*math.pi*(freq*(1+int(x*5)*.25))*t)+.3*math.sin(2*math.pi*freq*2*t)
   elif family==2: sample=math.sin(2*math.pi*(freq*4*t-freq*1.5*t*t/duration))
   elif family==3: sample=(1 if math.sin(2*math.pi*freq*t)>0 else -1)*(.5+.5*math.sin(t*70))+.15*rng.uniform(-1,1)
   elif family==4: sample=sum(math.sin(2*math.pi*freq*r*t) for r in [1,1.25,1.5])/2
   elif family==5: sample=math.sin(2*math.pi*(40+variant)*t)+.5*math.sin(2*math.pi*(42+variant)*t)+.12*rng.uniform(-1,1)
   elif family==6: sample=math.sin(2*math.pi*freq*4*t)*(.5+.5*math.sin(2*math.pi*12*t))+.4*math.sin(2*math.pi*freq*6*t)
   elif family==7: sample=math.sin(2*math.pi*(freq*t+freq*.12*math.sin(t*16)))
   elif family==8: sample=rng.uniform(-1,1)*math.sin(math.pi*x)+.3*math.sin(2*math.pi*(freq*t+200*t*t))
   else: sample=math.sin(2*math.pi*freq*t)*(.5+.5*math.sin(2*math.pi*(5+variant%6)*t))
   buf.append(sample*env)
  peak=max(map(abs,buf)) or 1;pcm=b''.join(struct.pack('<h',int(v/peak*.65*32767)) for v in buf);filename=f'witi-{i+1:03}.wav'
  with wave.open(str(out/filename),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm)
  manifest.append({'id':f'witi-{i+1:03}','name':f'{label} {variant+1:02}','category':category,'file':filename,'duration':round(duration,2),'origin':'Síntesis original WITI BOT','license':'Original — uso y redistribución con WITI BOT','sha256':hashlib.sha256((out/filename).read_bytes()).hexdigest()})
(out/'legacy-catalog.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Generated',len(manifest),'original WAV files')
