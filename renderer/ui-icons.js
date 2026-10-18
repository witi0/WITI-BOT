'use strict';
(()=>{
 const names={home:'house',rules:'zap',overlays:'panels-top-left',music:'music',sounds:'volume-2',gifts:'gift',community:'users',timer:'timer',connections:'plug',tts:'mic',logs:'activity',settings:'settings',shortcuts:'keyboard'};
 function icon(name){const img=document.createElement('img');img.src='../assets/ui-icons/'+name+'.svg';img.className='ui-icon';img.alt='';img.setAttribute('aria-hidden','true');img.width=18;img.height=18;return img;}
 for(const button of document.querySelectorAll('nav [data-page]')){const name=names[button.dataset.page];if(!name)continue;for(const n of [...button.childNodes])if(n.nodeType===Node.TEXT_NODE)n.remove();button.prepend(icon(name));}
 for(const [id,name]of [['tiktokDisconnect','unplug'],['tiktokCopyDiagnostic','copy'],['stopAll','square'],['commandTrigger','search'],['updateCheck','refresh-cw']]){const button=document.getElementById(id);if(button)button.prepend(icon(name));}
})();
