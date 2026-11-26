import {tugMove} from './rules.js';
import {newTug,tugCue,tickTug,pull,newPie,mix,bake,targetX,throwPie,tickPie,ingredients} from './rules.js';
const el=id=>document.getElementById(id),canvas=el('field'),ctx=canvas.getContext('2d');
let mode=location.hash==='#pie'?'pie':'tug',tug=null,pie=null,aim=320,pointer=null;
const bakerButtons=[...document.querySelectorAll('[data-ingredient]')];
const gold='#ffdf78',teal='#409685',red='#bd6150';
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function oval(x,y,rx,ry,c){
 ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
function text(x,y,value,size=19,c='#fff4cc'){
 ctx.fillStyle=c;ctx.font='700 '+size+'px system-ui';ctx.textAlign='center';ctx.fillText(value,x,y);
}
function farmer(x,y,color,lean,scale=1){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(lean);
 oval(0,3,18,5,'#80613f');rect(-11,-23,9,23,'#465459');rect(3,-23,9,23,'#465459');
 oval(0,-32,17,21,color);oval(3,-54,12,12,'#dfae7c');
 oval(1,-62,21,5,'#d7a260');oval(0,-66,13,7,'#e4b675');ctx.restore();
}
function yard(){
 rect(0,0,640,365,'#99ae6f');rect(0,0,640,76,'#b3d5c9');
 rect(0,110,640,255,'#c49666');
 for(let i=0;i<12;i++){rect(i*58,77,8,59,'#9d7249');}
 rect(0,90,640,8,'#ad8256');rect(0,113,640,6,'#ad8256');
}
function drawTug(now){
 yard();oval(320,227,98,42,'#815840');oval(311,224,70,24,'#946348');
 const shift=(tug?.pull??0)*19;
 const strain=tug&&!tug.done?Math.sin(now/85)*.06:0;
 for(let i=0;i<3;i++){
  farmer(103+i*54-shift,236,teal,-.22+strain);
  farmer(427+i*53-shift,236,red,.22-strain);
 }
 rect(88-shift,194,462,6,'#674a31');rect(88-shift,193,462,3,'#e7c192');
 rect(314-shift,192,12,20,'#e9ac51');
 if(tug?.done&&Math.abs(tug.pull)>=6){
  for(let i=0;i<12;i++){const a=i*Math.PI/6;oval(320+Math.cos(a)*56,224+Math.sin(a)*25,4,3,'#ad7d51');}
 }
 rect(133,294,374,28,'#4e4d3b');
 rect(317,290,6,36,gold);
 if(tug&&!tug.done){
  const diff=tugCue(tug)-now;
  const x=Math.max(147,Math.min(493,320+diff*.196));
  oval(x,308,Math.abs(diff)<=220?11:8,10,Math.abs(diff)<=220?gold:'#e1eee1');
 }
 text(320,348,'Tap the called action at the gold line',17);
}
function drawPie(now){
 yard();
 const x=pie?.phase==='aim'?targetX(now-pie.since):pie?.shot?.botX??320;
 farmer(x,177,red,.05,1.08);
 rect(x-35,160,70,8,'#945f42');
 rect(167,260,306,18,'#a87148');rect(181,278,11,48,'#805d40');rect(449,278,11,48,'#805d40');
 farmer(320,346,teal,-.02,.93);
 if(pie?.phase==='mix'){
  for(let i=0;i<3;i++){
   oval(240+i*82,255,24,8,i<pie.step?gold:'#a7855b');
   text(240+i*82,240,ingredients[i],15,'#523b2b');
  }
 }
 if(pie?.phase==='bake'){
  const t=now-pie.since;
  oval(320,251,30,10,t>=950&&t<=1550?gold:'#ba8756');
  rect(180,308,280,10,'#7f633f');
  rect(180+280*950/2300,308,280*600/2300,10,gold);
  rect(180+280*Math.min(t/2300,1),303,4,21,'#fff4cf');
 }
 if(pie?.phase==='aim'){
  oval(320,251,29,9,gold);
  ctx.strokeStyle='#fff1a2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(320,246);ctx.lineTo(aim,139);ctx.stroke();oval(aim,139,6,6,gold);
 }
 if(pie?.phase==='flight'){
  const t=Math.min(1,(now-pie.shot.start)/480);
  oval(320+(pie.shot.x-320)*t,251-111*t-Math.sin(t*Math.PI)*62,16,7,gold);
 }
 if(pie?.phase==='result'){
  const hit=pie.notice==='Splat!'||pie.notice==='You win!';
  const px=hit?x:320,py=hit?137:295;
  for(let i=0;i<9;i++){
   const a=i*Math.PI*2/9;oval(px+Math.cos(a)*22,py+Math.sin(a)*14,9,5,'#ffeabe');
  }
 }
}
function show(next){
 mode=next;tug=pie=null;aim=320;pointer=null;
 el('tug').setAttribute('aria-pressed',mode==='tug');el('pie').setAttribute('aria-pressed',mode==='pie');
 el('start').disabled=false;el('start').textContent=mode==='tug'?'Start match':'Start round';
 el('instructions').textContent=mode==='tug'?'Follow the upcoming Pull or Brace call as the cue reaches gold. Lead after 18 beats or pull the other crew into the mud.':
  'Add crust, filling, then topping. Take the pie out in the gold zone. Drag on the scene to aim at the moving baker, then throw. First to three hits wins.';
}
el('tug').onclick=()=>{if(mode!=='tug')show('tug');};
el('pie').onclick=()=>{location.href='../field-games/#pie';};
el('start').onclick=()=>{
 const now=performance.now();
 if(mode==='tug')tug=newTug(now);else{pie=newPie(now);aim=320;}
 put('start',mode==='tug'?'Start match':'Start round');el('start').disabled=true;
};
el('tug-brace').onclick=()=>{if(mode==='tug'&&tug)tugMove(tug,performance.now(),'brace');};
el('action').onclick=()=>{
 const now=performance.now();
 if(mode==='tug'&&tug)pull(tug,now);
 if(mode==='pie'&&pie?.phase==='bake')bake(pie,now);
 else if(mode==='pie'&&pie?.phase==='aim')throwPie(pie,aim,now);
};
for(const b of bakerButtons)b.onclick=()=>{if(pie)mix(pie,Number(b.dataset.ingredient),performance.now());};
addEventListener('keydown',e=>{
 if(e.target.matches('input,select,textarea'))return;
 if(mode==='pie'&&pie?.phase==='aim'&&['ArrowLeft','ArrowRight'].includes(e.code)){
  e.preventDefault();aim=Math.max(125,Math.min(515,aim+(e.code==='ArrowLeft'?-1:1)*12));return;
 }
 if(e.repeat)return;
 if(mode==='tug'&&e.code==='Digit2'){e.preventDefault();el('tug-brace').onclick();return;}
 if(mode==='pie'&&pie?.phase==='mix'&&['Digit1','Digit2','Digit3'].includes(e.code)){
  e.preventDefault();mix(pie,Number(e.code.at(-1))-1,performance.now());return;
 }
 if(e.code==='Digit4'||(e.code==='Space'&&!e.target.matches('button'))){
  const button=el('action');
  if(!button.hidden&&!button.disabled){e.preventDefault();button.onclick();}
 }
});
function point(e){
 const box=canvas.getBoundingClientRect();
 aim=Math.max(125,Math.min(515,(e.clientX-box.left)*640/box.width));
}
canvas.onpointerdown=e=>{if(pie?.phase==='aim'&&pointer===null&&e.button===0){pointer=e.pointerId;canvas.setPointerCapture(pointer);point(e);}};
canvas.onpointermove=e=>{if(e.pointerId===pointer)point(e);};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=e=>{if(e.pointerId===pointer)pointer=null;};
function put(id,value){if(el(id).textContent!==value)el(id).textContent=value;}
function frame(now){
 if(mode==='tug'){
  if(tug)tickTug(tug,now);
  drawTug(now);put('score',tug?tug.hits+' hits · '+tug.next+'/18':'0 hits');
  const cue=tug&&!tug.done?(tug.plan[tug.next]==='brace'?'Brace':'Pull'):'';
  put('status',tug?tug.result||`Next: ${cue}${tug.flash?' · '+tug.flash:''}`:'Ready to pull');
  el('tug-brace').hidden=false;el('tug-brace').disabled=!tug||tug.done;
  put('action','Pull');el('action').hidden=false;el('action').disabled=!tug||tug.done;
 }else{
  el('tug-brace').hidden=true;
  if(pie)tickPie(pie,now);
  drawPie(now);put('score','You '+(pie?.you??3)+' · Bot '+(pie?.bot??3));
  const status={mix:pie?.phase==='mix'?'Add '+ingredients[pie.step].toLowerCase():'Ready to bake',bake:'Watch the oven timer',aim:'Aim at the moving baker',flight:'Pie in the air',result:''};
  put('status',pie?.notice||status[pie?.phase??'mix']);
  el('action').hidden=pie?.phase!=='bake'&&pie?.phase!=='aim';
  el('action').disabled=!!pie?.done;
  put('action',pie?.phase==='aim'?'Throw pie':'Take pie out');
 }
 el('ingredients').hidden=mode!=='pie'||pie?.phase!=='mix';
 if(tug?.done||pie?.done){el('start').disabled=false;put('start','Play again');}
 requestAnimationFrame(frame);
}
show(mode);requestAnimationFrame(frame);
