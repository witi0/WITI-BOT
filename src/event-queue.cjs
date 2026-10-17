class EventQueue {
 constructor(handler,{limit=2000,onError=()=>{}}={}){this.handler=handler;this.limit=limit;this.onError=onError;this.queue=[];this.pending=false;this.droppedLikes=0;this.errors=0;}
 enqueue(event){
  if(this.queue.length>=this.limit){
   const index=this.queue.findIndex(e=>e.type==='like'||e.type==='viewers');
   if(index!==-1){this.queue.splice(index,1);this.droppedLikes++;}
   else if(event.type==='like'||event.type==='viewers'){this.droppedLikes++;return false;}
  }
  this.queue.push(event);if(!this.pending){this.pending=true;queueMicrotask(()=>this.flush());}return true;
 }
 async flush(){try{let n=0;while(this.queue.length){const e=this.queue.shift();try{await this.handler(e);}catch(err){this.errors++;this.onError(err);}if(++n===64){n=0;await new Promise(resolve=>setImmediate(resolve));}}}finally{this.pending=false;if(this.queue.length){this.pending=true;queueMicrotask(()=>this.flush());}}}
}
module.exports={EventQueue};
