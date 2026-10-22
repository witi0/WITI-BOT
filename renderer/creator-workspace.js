(()=>{
'use strict';
const sidebar=document.querySelector('aside.cw-sidebar');
const nav=sidebar?.querySelector('nav.cw-nav');
const main=document.querySelector('main.cw-main');
if(!nav||!main)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const navButtons=[...nav.querySelectorAll('button[data-page]')];
const labels=new Map(navButtons.map(b=>[b.dataset.page,b.querySelector('span')?.textContent||b.dataset.page]));
const badge=document.getElementById('liveConnectionBadge');
const status=document.getElementById('cwLiveStatus');
const detail=document.getElementById('cwConnectionDetail');
const crumb=document.getElementById('breadcrumb');
const bounceFrames=(()=>{
 const k=380,d=32,m=.75,dt=.42/30;
 let x=1,v=0;const frames=[];
 for(let i=0;i<=30;i++){
   const t=i/30;
   frames.push({offset:t,opacity:Math.min(1,.05+t*2.6),transform:`translate3d(${(-24*x).toFixed(3)}px,${(8*x).toFixed(3)}px,0) scale(${(1-.03*x).toFixed(4)})`});
   const a=(-k*x-d*v)/m;v+=a*dt;x+=v*dt;
 }
 frames[frames.length-1].transform='translate3d(0,0,0) scale(1)';
 frames[frames.length-1].opacity=1;
 return frames;
})();
let lastPage=document.querySelector('main .page.active')?.id||'home';
function lockChrome(){
 const important=(el,key,value)=>el?.style.setProperty(key,value,'important');
 important(sidebar,'background','#0e0e11');
 important(sidebar,'background-image','none');
 const header=document.querySelector('header.cw-topbar');
 important(header,'background','#111114');
 const title=document.querySelector('.cw-section-heading h1');
 important(title,'background-image','none');
 important(title,'-webkit-text-fill-color','#f1f1f3');
 const primary=document.querySelector('.cw-hero-actions button.primary');
 important(primary,'background','#10b981');
 important(primary,'background-image','none');
 important(primary,'border-color','#10b981');
 important(primary,'color','#08251a');
 important(primary,'-webkit-text-fill-color','#08251a');
 for(const number of document.querySelectorAll('.cw-metric strong')){
  important(number,'background-image','none');
  important(number,'-webkit-text-fill-color','#f1f1f3');
 }
 for(const btn of navButtons){
  const active=btn.classList.contains('active');
  important(btn,'background',active?'#252b29':'transparent');
  important(btn,'color',active?'#f6f8f7':'#9899a3');
  important(btn,'border-image','none');
  important(btn,'box-shadow','none');
 }
}
function sync(){
 const page=document.querySelector('main .page.active');
 if(!page)return;
 const name=labels.get(page.id);
 if(name&&crumb)crumb.textContent=name;
 for(const b of navButtons)b.classList.toggle('active',b.dataset.page===page.id);
 lockChrome();
 if(page.id===lastPage)return;
 lastPage=page.id;
 main.scrollTo({top:0,behavior:'instant'});
 if(!reduce.matches&&page.animate)page.animate(bounceFrames,{duration:420,easing:'linear'});
}
function updateLive(){
 if(!badge||!status)return;
 const t=(badge.textContent||'').trim();
 const active=/conectado|en vivo|live activo/i.test(t)&& !/sin |desconect|no conectado|error/i.test(t);
 const waiting=/conectando|reintentando/i.test(t);
 status.textContent=active?'● LIVE ENLACE ACTIVO':waiting?'● CONECTANDO':'● SIN LIVE';
 status.classList.toggle('cw-connected',active);
 badge.classList.toggle('cw-connected',active);
 if(detail)detail.textContent=active?'La app reporta conexión; verifica la recepción de eventos reales en Chat & LIVE.':waiting?'Esperando respuesta del conector…':'Conecta TikTok desde Conexiones para recibir eventos reales.';
}
nav.addEventListener('click',e=>{if(e.target.closest('button[data-page]'))queueMicrotask(sync)});
new MutationObserver(sync).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
if(badge){new MutationObserver(updateLive).observe(badge,{childList:true,subtree:true,characterData:true});updateLive()}
// RGB preference belongs to OBS overlays; never override its saved palette from the workspace shell.
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.activeElement?.matches('button'))document.activeElement.blur();});
sync();
new MutationObserver(lockChrome).observe(document.body,{attributes:true,attributeFilter:['class','style']});
})();
