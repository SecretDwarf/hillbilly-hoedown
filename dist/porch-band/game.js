import {newSong,advance,strike} from './beat.js';
const el=id=>document.getElementById(id);
const pads=[...document.querySelectorAll('[data-pad]')];
const colors=['#82cdb1','#f4c573','#ec947c','#bdafe9'];
let song=null,audio,held=[];
const leave=()=>{
 document.body.classList.remove('full');
 if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
};
el('full-screen').onclick=async()=>{
 document.body.classList.add('full');
 try{await document.documentElement.requestFullscreen?.();}catch{/* Fixed layout is the fallback. */}
};
el('screen-exit').onclick=leave;
addEventListener('keydown',e=>{if(e.code==='Escape'&&document.body.classList.contains('full'))leave();});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('full');});
function controller(){
 let pads=[];
 try{pads=navigator.getGamepads?.()??[];}catch{/* Controller access depends on the browser. */}
 const pad=Array.from(pads).find(p=>p?.mapping==='standard');
 held=[3,2,0,1].map((note,i)=>{
  const down=!!pad?.buttons[i]?.pressed;
  if(down&&!held[i]){
   if(i===0&&(!song||song.done))el('start').onclick();else hit(note);
  }
  return down;
 });
}

function unlock(){
 if(!audio){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(Audio)audio=new Audio();
 }
 if(audio?.state==='suspended')audio.resume().catch(()=>{});
}
function sound(pad){
 if(!audio||audio.state!=='running')return;
 const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();
 o.type=['sawtooth','sine','triangle','square'][pad];o.frequency.value=[155,106,720,64][pad];
 g.gain.setValueAtTime(.075,t);g.gain.exponentialRampToValueAtTime(.001,t+.13);
 o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.14);
}
el('start').onclick=()=>{
 unlock();song=newSong(performance.now());
 el('start').disabled=true;el('status').textContent='Here come the beats';
};
function hit(pad){if(song&&!song.done){strike(song,pad,performance.now());sound(pad);}}
pads.forEach((button,i)=>button.onclick=()=>hit(i));
addEventListener('keydown',e=>{if(!e.repeat&&['1','2','3','4'].includes(e.key))hit(Number(e.key)-1);});
function frame(now){
 controller();
 if(song){
  advance(song,now);
  const note=song.notes[song.next];
  pads.forEach((p,i)=>p.classList.toggle('ready',!!note&&note.pad===i&&Math.abs(note.at-now)<=225));
  el('notes').replaceChildren(...song.notes.slice(song.next,song.next+3).filter(n=>n.at-now<=980).map(n=>{
   const cue=document.createElement('div');
   cue.className='note';cue.textContent=String(n.pad+1);
   cue.style.setProperty('--lane',((n.pad+.5)*100/4)+'%');
   cue.style.setProperty('--top',el('stage').clientHeight-48-(n.at-now)*.145+'px');
   cue.style.setProperty('--ink',colors[n.pad]);return cue;
  }));
  el('points').textContent=song.points+' pts · '+song.hits+'/16';
  el('status').textContent=song.done?'Song complete':song.last||'Follow the falling cues';
  if(song.done){el('start').disabled=false;el('start').textContent='Play again';}
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
