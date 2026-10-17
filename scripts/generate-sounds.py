"""Regenerate the original WITI BOT 1.2 reaction/effects library (no external samples)."""
from pathlib import Path
import random,math,wave,hashlib,struct,json
root=Path(__file__).resolve().parent.parent

# Keep the 200 previous WAV assets available for existing sound IDs.
# Their metadata is stored separately from the 60 visible curated sounds.
import runpy
runpy.run_path(str(root/'scripts/generate-legacy-sounds.py'),run_name='__main__')
# generate engaging original meme-style stingers, not imitations of copyrighted speech
out=root/'assets/sounds';sr=22050
presets=[
 ('Memes originales','Bruh dramático','bass',0.72),('Memes originales','Ojo con eso','descending',0.83),('Memes originales','No puede ser','sad',1.15),('Memes originales','Se armó','alarm',1.2),('Memes originales','Momento incómodo','cricket',1.32),('Memes originales','¿Qué fue eso?','glitch',0.9),('Memes originales','Plot twist','riser',1.0),('Memes originales','Así no','buzzer',0.52),('Memes originales','Tremendo fail','fall',0.95),('Memes originales','Modo troll','whistle',1.1),
 ('Reacciones','Carcajada pixel','laugh',1.2),('Reacciones','Risa malvada','laughlow',1.5),('Reacciones','Risa nerviosa','laughfast',0.9),('Reacciones','Susto de golpe','impact',0.6),('Reacciones','Suspiro digital','sigh',0.9),('Reacciones','Confusión total','warble',1.15),('Reacciones','Cara de póker','dry',0.32),('Reacciones','Silencio incómodo','cricket',1.4),('Reacciones','Te pasaste','rise',0.9),('Reacciones','Nooo épico','sad',1.6),
 ('Impactos','Golpe cinematográfico','bass',1.25),('Impactos','Bomba de bajos','bass',0.72),('Impactos','Impacto glitch','glitch',0.52),('Impactos','Golpe metálico','bell',0.82),('Impactos','Grito electrónico','scream',0.78),('Impactos','Vibración oscura','dark',1.3),('Impactos','Glitch agresivo','glitch',0.6),('Impactos','Terror en vivo','horror',1.5),('Impactos','Bass drop','drop',1.15),('Impactos','Choque 8-bit','arcade',0.65),
 ('Victorias','Nivel completado','win',1.28),('Victorias','Victoria arcade','arcade',1.1),('Victorias','Hype total','hype',1.65),('Victorias','Racha legendaria','win',1.7),('Victorias','Celebración cósmica','sparkle',1.2),('Victorias','Logro desbloqueado','bell',1.0),('Victorias','Monedas extra','coin',0.9),('Victorias','Power-up','rise',0.95),('Victorias','Héroe 8-bit','arcade',1.4),('Victorias','Celebración neón','hype',1.3),
 ('Suspenso','Algo se acerca','horror',1.85),('Suspenso','Peligro inminente','alarm',1.3),('Suspenso','Cuenta regresiva','tick',1.9),('Suspenso','Tensión de jefe','dark',2.0),('Suspenso','Misterio siniestro','warble',1.65),('Suspenso','Alerta fantasma','scream',1.0),('Suspenso','Latido oscuro','heartbeat',1.75),('Suspenso','Risa fantasmal','laughlow',1.35),('Suspenso','Apareció el boss','drop',1.7),('Suspenso','Se viene algo','riser',1.65),
 ('Donaciones','Regalazo','win',1.16),('Donaciones','Lluvia de monedas','coin',1.38),('Donaciones','Donación épica','hype',1.65),('Donaciones','Alerta premium','sparkle',1.05),('Donaciones','Meta cumplida','win',1.45),('Donaciones','Combo x10','arcade',0.93),('Donaciones','Supercombo','hype',1.5),('Donaciones','Regalo sorpresa','warble',1.0),('Donaciones','Puntos extra','coin',1.1),('Donaciones','Jefe del chat','bass',1.45)
]

def render_wave(style, duration, seed):
 rng=random.Random(seed); n=int(sr*duration); freq=110+(seed*79)%330
 buf=[]
 for i in range(n):
  t=i/sr;x=t/duration
  env=min(1,t/.014)*max(0,1-x)**(0.8 if style in ('horror','dark','sigh') else 1.55)
  if style=='bass': v=math.sin(2*math.pi*(95*t+38*t*t))*math.exp(-t*2)+.2*math.sin(2*math.pi*45*t)
  elif style=='descending': v=math.sin(2*math.pi*(freq*t-0.3*freq*t*t/duration))
  elif style=='sad': v=math.sin(2*math.pi*(freq*t-0.22*freq*t*t/duration))*(.9+.12*math.sin(11*t))
  elif style=='alarm': v=math.sin(2*math.pi*freq*t)*(.3+.7*(math.sin(2*math.pi*4*t)>0))
  elif style=='cricket': v=(math.sin(2*math.pi*3200*t)+.4*math.sin(2*math.pi*3800*t))*(1 if int(t*5)%4==0 else .05)
  elif style=='glitch': v=(rng.random()*2-1) * (.2+.8*(int(t*21)%4<2))+ .3*math.sin(2*math.pi*freq*t)
  elif style=='riser': v=math.sin(2*math.pi*(140*t + 420*t*t/duration))
  elif style=='buzzer': v=.5*math.sin(2*math.pi*107*t)+.5*(1 if math.sin(2*math.pi*137*t)>0 else -1)
  elif style=='fall': v=math.sin(2*math.pi*(900*t-650*t*t/duration))
  elif style=='whistle': v=math.sin(2*math.pi*(650*t + 45*math.sin(13*t)))
  elif style.startswith('laugh'): v=math.sin(2*math.pi*(freq*t+33*math.sin(14*t)))*(0.2+.8*max(0,math.sin(2*math.pi*(6 if style!='laughlow' else 3)*t)))
  elif style=='impact':v=rng.uniform(-.6,.6)*math.exp(-12*t)+math.sin(2*math.pi*(160*t-80*t*t/duration))
  elif style=='sigh':v=rng.uniform(-1,1)*.4+math.sin(2*math.pi*155*t)*.3
  elif style=='warble':v=math.sin(2*math.pi*(freq*t+34*math.sin(9*t)))
  elif style=='dry':v=.8 if t<.1 else 0
  elif style=='rise': v=math.sin(2*math.pi*(100*t+350*t*t/duration))
  elif style=='bell':v=math.sin(2*math.pi*freq*t)+.4*math.sin(2*math.pi*freq*2.7*t)
  elif style=='scream':v=math.sin(2*math.pi*(350*t+100*math.sin(t*20)))+.25*rng.uniform(-1,1)
  elif style=='dark':v=.5*math.sin(2*math.pi*50*t)+.6*math.sin(2*math.pi*57*t)
  elif style=='horror':v=math.sin(2*math.pi*61*t)+.5*math.sin(2*math.pi*(60*t+8*t*t))+.2*rng.uniform(-1,1)
  elif style=='drop':v=math.sin(2*math.pi*(340*t-240*t*t/duration))*(1 if t>.15 else 0)
  elif style=='arcade':v=math.sin(2*math.pi*freq*t)*(1 if int(t*8)%3 else .4)
  elif style=='win':v=math.sin(2*math.pi*(220*t+70*int(x*4)*t))+.4*math.sin(2*math.pi*440*t)
  elif style=='hype':v=math.sin(2*math.pi*(220*t+80*int(x*6)*t))+.4*rng.uniform(-1,1)
  elif style=='sparkle':v=math.sin(2*math.pi*(620*t+190*int(x*5)*t)) + .25*rng.uniform(-1,1)
  elif style=='coin':v=math.sin(2*math.pi*(660*t+70*int(x*6)*t))
  elif style=='tick':v=(rng.uniform(-1,1) if (t*4)%1 <.04 else 0)
  elif style=='heartbeat':v=math.sin(2*math.pi*60*t)*(1 if (t*2)%1<.18 else .0)
  else:v=math.sin(2*math.pi*freq*t)
  buf.append(v*env)
 peak=max(1e-3,max(abs(v) for v in buf));return b''.join(struct.pack('<h',int(0.79*32767*v/peak)) for v in buf)

manifest=[]
for ix,(cat,name,style,duration) in enumerate(presets):
 filename=f'witi-{ix+201:03}.wav';data=render_wave(style,duration,ix+42)
 with wave.open(str(out/filename),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(data)
 manifest.append({'id':filename[:-4],'name':name,'category':cat,'file':filename,'duration':round(duration,2),'origin':'Efecto electrónico original WITI BOT · sin voces ni clips de terceros','license':'Original — incluido en WITI BOT','sha256':hashlib.sha256((out/filename).read_bytes()).hexdigest()})
(out/'catalog.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Created',len(manifest),'original sounds')
