(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const defaults={rgb:true,reducedMotion:false,mode:'aurora',accent:'#f2a66f',speed:9,intensity:62,font:'bahnschrift',compact:false};
  const inputs={rgb:$('#themeRgb'),reducedMotion:$('#reduceMotion'),mode:$('#rgbMode'),accent:$('#accentColor'),speed:$('#rgbSpeedApp'),intensity:$('#rgbStrength'),font:$('#uiTypeface'),compact:$('#compactUI')};
  let current={...defaults};
  const appearance=()=>({rgb:inputs.rgb.checked,reducedMotion:inputs.reducedMotion.checked,mode:inputs.mode.value,accent:inputs.accent.value,speed:Number(inputs.speed.value),intensity:Number(inputs.intensity.value),font:inputs.font.value,compact:inputs.compact.checked});
  function apply(settings){
    const a={...defaults,...settings};
    document.body.classList.toggle('theme-rgb',a.rgb);
    document.body.classList.toggle('reduce-motion',a.reducedMotion);
    document.body.classList.toggle('compact-studio',a.compact);
    document.body.dataset.rgbMode=a.mode;
    document.body.dataset.uiFont=a.font;
    document.body.style.setProperty('--ui-accent',a.accent);
    document.body.style.setProperty('--ui-rgb-duration',a.speed+'s');
    document.body.style.setProperty('--ui-glow-alpha',(Math.round(a.intensity)/100).toFixed(2));
    $('#rgbSpeedValue').textContent=a.speed+' s';
    $('#rgbStrengthValue').textContent=a.intensity+' %';
    $('#appearancePreview').classList.toggle('preview-static',!a.rgb);
  }
  function fill(a){
    current={...defaults,...a};
    inputs.rgb.checked=current.rgb;
    inputs.reducedMotion.checked=current.reducedMotion;
    inputs.mode.value=current.mode;
    inputs.accent.value=current.accent;
    inputs.speed.value=current.speed;
    inputs.intensity.value=current.intensity;
    inputs.font.value=current.font;
    inputs.compact.checked=current.compact;
    apply(current);
  }
  for(const input of Object.values(inputs))input.addEventListener(input.type==='range'||input.type==='color'?'input':'change',()=>apply(appearance()));
  $('#appearanceForm').onsubmit=async event=>{
    event.preventDefault();
    try{
      const saved=await window.witi.call('appearance-set',appearance());
      fill(saved);
      if(typeof toast==='function')toast('Apariencia guardada');
    }catch(error){if(typeof toast==='function')toast(error.message,true);}
  };
  $('#restoreAppearance').addEventListener('click',()=>fill(defaults));

  const actions=[
    {page:'home',icon:'🏠',title:'Inicio',hint:'Panel y estado del estudio'},
    {page:'overlays',icon:'🎬',title:'Overlays',hint:'Galería, edición y enlaces de OBS'},
    {page:'gifts',icon:'🎁',title:'Regalos',hint:'Buscar regalos y crear alertas'},
    {page:'rules',icon:'⚡',title:'Eventos y acciones',hint:'Activadores y respuestas'},
    {page:'sounds',icon:'🔊',title:'Memes y sonidos',hint:'Biblioteca e importaciones'},
    {page:'music',icon:'🎵',title:'Música',hint:'Cola y solicitudes'},
    {page:'community',icon:'👥',title:'Comunidad',hint:'Puntos y usuarios'},
    {page:'connections',icon:'🔌',title:'Conexiones',hint:'TikTok LIVE, OBS y Spotify'},
    {page:'tts',icon:'🎙️',title:'Voces y TTS',hint:'Voces, lectura y prueba'},
    {page:'timer',icon:'⏱️',title:'Temporizador',hint:'Metas y tiempo'},
    {page:'shortcuts',icon:'⌨️',title:'Atajos',hint:'Configurar teclado'},
    {page:'settings',icon:'⚙️',title:'Ajustes',hint:'RGB, tipografía y actualizaciones'},
    {page:'logs',icon:'📊',title:'Diagnósticos',hint:'Registro y estado del LIVE'}
  ];
  const modal=$('#commandPalette'),search=$('#commandSearch'),results=$('#commandResults');
  let filtered=actions,selected=0,previousFocus=null;
  const norm=str=>String(str).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function closePalette(){modal.hidden=true;search.value='';previousFocus?.focus?.();}
  function navigate(item){const button=document.querySelector('nav button[data-page="'+item.page+'"]');closePalette();button?.click();}
  function renderCommands(){
    const q=norm(search.value.trim());
    filtered=actions.filter(item=>norm(item.title+' '+item.hint).includes(q));
    selected=Math.max(0,Math.min(selected,filtered.length-1));
    results.replaceChildren();
    if(!filtered.length){const empty=document.createElement('p');empty.textContent='No se encontraron apartados';empty.className='command-empty';results.append(empty);return;}
    filtered.forEach((item,index)=>{
      const button=document.createElement('button');button.type='button';button.className='command-result';button.setAttribute('role','option');button.setAttribute('aria-selected',String(index===selected));
      const ico=document.createElement('span');ico.className='command-icon';ico.textContent=item.icon;
      const body=document.createElement('span');const title=document.createElement('strong');title.textContent=item.title;const hint=document.createElement('small');hint.textContent=item.hint;body.append(title,hint);
      const arrow=document.createElement('span');arrow.className='command-arrow';arrow.textContent='↗';
      button.append(ico,body,arrow);button.onclick=()=>navigate(item);
      button.onmouseenter=()=>{selected=index;updateSelection();};
      results.append(button);
    });
  }
  function updateSelection(){[...results.children].forEach((element,index)=>element.setAttribute('aria-selected',String(index===selected)));results.children[selected]?.scrollIntoView?.({block:'nearest'});}
  function openPalette(){previousFocus=document.activeElement;modal.hidden=false;selected=0;renderCommands();search.focus();}
  $('#commandTrigger').addEventListener('click',openPalette);
  modal.addEventListener('mousedown',event=>{if(event.target===modal)closePalette();});
  search.addEventListener('input',()=>{selected=0;renderCommands();});
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
      event.preventDefault();if(modal.hidden)openPalette();else closePalette();return;
    }
    if(modal.hidden)return;
    if(event.key==='Escape'){event.preventDefault();closePalette();}
    if(event.key==='ArrowDown'){event.preventDefault();selected=Math.min(filtered.length-1,selected+1);updateSelection();}
    if(event.key==='ArrowUp'){event.preventDefault();selected=Math.max(0,selected-1);updateSelection();}
    if(event.key==='Enter'){event.preventDefault();if(filtered[selected])navigate(filtered[selected]);}
  },true);
  const scrollPositions=new Map();
  let lastPage=document.querySelector('.page.active')?.id||'home';
  document.querySelectorAll('nav button[data-page]').forEach(button=>button.addEventListener('click',()=>{
    const scroll=document.scrollingElement||document.documentElement;
    if(button.dataset.page===lastPage)return;
    scrollPositions.set(lastPage,scroll.scrollTop);
    lastPage=button.dataset.page;
    requestAnimationFrame(()=>{scroll.scrollTop=scrollPositions.get(lastPage)||0;});
  }));
  window.witi.call('snapshot').then(snapshot=>fill(snapshot.appearance||defaults)).catch(()=>fill(defaults));
})();
