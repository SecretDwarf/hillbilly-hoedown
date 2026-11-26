import {createScene} from '../movement/scene.js';
import {cornholeMeshes} from '../movement/maps.js';
import {newRoute,routeTool,stepRoute,deliver,totalTosses,powerAt,scoreToss,throws,windFor,cornModes,cornMatch,recordCornToss,botCornToss} from './rules.js';
const el=id=>document.getElementById(id), canvas=el('field'),ctx=canvas.getContext('2d');
let mode='route',run=newRoute(),active=false,match=null,flight=null,charge=null,pointer=null,last=null,message='',messageUntil=0;
const cornView=el('corn-view'),styleButtons=[...document.querySelectorAll('[data-throw]')];
let style='flat',windSeed=0,cornScene=null,cornModels=null;
function selectThrow(next){
 if(flight||charge!==null)return;
 style=next;
 for(const b of styleButtons)b.setAttribute('aria-pressed',String(b.dataset.throw===style));
}
for(const b of styleButtons)b.onclick=()=>selectThrow(b.dataset.throw);
function loadCornScene(){
 if(cornScene)return;
 try{
  cornScene=createScene(cornView);
  cornModels=Object.fromEntries(Object.entries(cornholeMeshes()).map(([key,mesh])=>[key,cornScene.mesh(mesh)]));
 }catch{cornScene=null;}
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function polygon(points,c){
 ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fill();
}
function oval(x,y,rx,ry,c){
 ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
function announce(text,now=performance.now()){message=text;messageUntil=now+1350;}
function chooseSide(side){
 run.side=side;el('left').setAttribute('aria-pressed',side===-1);el('right').setAttribute('aria-pressed',side===1);
}
el('left').onclick=()=>chooseSide(-1);el('right').onclick=()=>chooseSide(1);
function reset(next){
 mode=next;aimPointer=null;run=newRoute();active=false;match=null;flight=null;charge=null;pointer=null;message='';messageUntil=0;
 const route=mode==='route';
 if(!route)loadCornScene();
 cornView.hidden=route||!cornScene;canvas.hidden=!cornView.hidden;
 el('toss-types').hidden=route;selectThrow('flat');
 windSeed=Math.random()*Math.PI*2;
 chooseSide(-1);el('route-tab').setAttribute('aria-pressed',route);el('corn-tab').setAttribute('aria-pressed',!route);
 el('lanes').hidden=!route;el('route-extras').hidden=!route;el('aim-control').hidden=route;el('power-control').hidden=route;
 el('power').value=0;setAim(0);
 canvas.classList.toggle('aimable',!route);
 el('action').textContent=route?'Toss paper':'Hold & toss';el('action').disabled=true;
 el('action').classList.remove('ready');
 el('start').textContent=route?'Start route':'Start round';el('start').disabled=false;
 el('instructions').textContent=route?'Choose a side and toss at the gold mailbox. Fold special editions before delivery. Use Brake to slow for a stop.':
 'Aim with the slider or drag on the board. Hold Toss and release in the target band. Lob catches the hole more easily but drifts in wind. Skid rolls forward after landing.';
}
el('route-tab').onclick=()=>{if(mode!=='route')reset('route');};
el('corn-tab').onclick=()=>{if(mode!=='corn')reset('corn');};
el('start').onclick=()=>{
 const aim=Number(el('aim').value),picked=style;
 reset(mode);if(mode==='corn'){
  setAim(aim);selectThrow(picked);match=cornMatch(el('corn-mode').value);
  announce(cornModes[match.mode]);
 }
 active=true;el('start').disabled=true;el('action').disabled=false;
};
function paper(now){
 if(!active)return;
 const result=deliver(run,now);if(result)announce(result.label,now);
}
for(const [id,kind] of [['paper-fold','fold'],['paper-brake','brake']])
 el(id).onclick=()=>{if(mode==='route'&&active){const hint=routeTool(run,kind);if(hint)announce(hint);}};
function beginToss(now){
 if(active&&match?.turn===0&&!flight&&charge===null&&!match.done)charge=now;
}
function releaseToss(now){
 if(charge===null)return;
 flight={...scoreToss(Number(el('aim').value),powerAt(now-charge),style,windFor(match?.tosses??0,windSeed)),start:now};
 charge=null;el('action').disabled=true;
}
const action=el('action');
action.onpointerdown=e=>{
 if(mode!=='corn'||pointer!==null||e.button!==0)return;
 pointer=e.pointerId;action.setPointerCapture(pointer);beginToss(performance.now());
};
action.onpointerup=e=>{if(e.pointerId===pointer){pointer=null;releaseToss(performance.now());}};
action.onpointercancel=action.onlostpointercapture=e=>{if(e.pointerId===pointer){pointer=null;charge=null;}};
action.onclick=e=>{if(mode==='route')paper(performance.now());else if(e.detail===0&&charge===null&&active&&!flight){beginToss(performance.now()-(style==='skid'?675:770));releaseToss(performance.now());}};
addEventListener('keydown',e=>{
 if(e.target.matches('input,select,textarea'))return;
 const side=e.code==='Digit1'||e.code==='ArrowLeft'?-1:e.code==='Digit3'||e.code==='ArrowRight'?1:0;
 if(side){
  e.preventDefault();
  if(mode==='route')chooseSide(side);
  else setAim(Number(el('aim').value)+side*.05);
 }
 if(mode==='route'&&!e.repeat&&e.code==='Digit2')el('paper-fold').onclick();
 if(mode==='route'&&!e.repeat&&e.code==='KeyB')el('paper-brake').onclick();
 if(e.code==='Digit2'&&mode==='corn'&&!e.repeat){const keys=Object.keys(throws);selectThrow(keys[(keys.indexOf(style)+1)%keys.length]);}
 if(e.repeat||!(e.code==='Digit4'||(e.code==='Space'&&!e.target.matches('button'))))return;
 e.preventDefault();
 if(mode==='route')paper(performance.now());else beginToss(performance.now());
});
addEventListener('keyup',e=>{
 if(['Space','Digit4'].includes(e.code)&&mode==='corn'&&pointer===null)releaseToss(performance.now());
});
addEventListener('blur',()=>{charge=null;pointer=null;});
const horizon=78, riderY=321;
function mailbox(side,gap,mark){
 const t=Math.max(0,1-(gap+2)/55), y=horizon+t*252,x=320+side*(44+t*194);
 const scale=.21+t*.83;
 rect(x-3*scale,y-19*scale,6*scale,33*scale,'#856340');
 rect(x-15*scale,y-32*scale,31*scale,15*scale,mark?'#ffda71':'#348b7d');
 oval(x,y-31*scale,15.5*scale,6*scale,mark?'#ffea9e':'#58ad99');
 rect(x+8*scale,y-39*scale,4*scale,12*scale,'#b75442');
 if(mark)oval(x,y+1,20*scale,6*scale,'#f1c56c');
}
function paintRoute(now){
 rect(0,0,640,390,'#87a45f');rect(0,0,640,horizon,'#b5dbd9');
 polygon([[277,horizon],[363,horizon],[600,390],[40,390]],'#c79566');
 polygon([[281,horizon],[286,horizon],[52,390],[40,390]],'#e1bd82');
 polygon([[354,horizon],[359,horizon],[600,390],[588,390]],'#e1bd82');
 for(let i=run.targets.length-1;i>=0;i--){
  const stop=run.targets[i],gap=stop.distance-run.distance;
  if(gap>55||gap< -9)continue;
  mailbox(stop.side,gap,i===run.next&&Math.abs(gap)<=5);
 }
 const stripe=(run.distance%9)/9;
 for(let i=0;i<6;i++){const t=(i+stripe)/6,y=horizon+t*291;rect(320-t*2,y,3+t*3,4+t*13,'#e8ba87');}
 const x=320+run.side*94;
 oval(x,riderY+8,26,9,'#956440');oval(x,riderY,8,19,'#313831');
 rect(x-4,riderY-38,8,37,'#498f80');rect(x-15,riderY-39,29,6,'#34473f');
 oval(x,riderY-42,15,14,'#328778');oval(x,riderY-57,10,10,'#eac090');
 if(run.flight&&now-run.flight.start<270){
  const t=(now-run.flight.start)/270,px=x+run.flight.side*t*112,py=riderY-34-Math.sin(t*Math.PI)*35;
  rect(px-8,py-3,16,7,'#fff4d3');
 }
}
let aimPointer=null;
function setAim(value){
 const aim=Math.round(Math.max(-1,Math.min(1,value))*40)/40;
 el('aim').value=aim;
 el('aim-readout').textContent=Math.abs(aim)<.025?'Centered':Math.round(Math.abs(aim)*100)+'% '+(aim<0?'left':'right');
}
el('aim').oninput=()=>setAim(Number(el('aim').value));
function aimFromPointer(e){
 const b=e.currentTarget.getBoundingClientRect();
 const x=(e.clientX-b.left)*640/b.width;
 setAim((x-320)/((192-.84*63)*.95));
}
for(const surface of [canvas,cornView]){
 surface.onpointerdown=e=>{
  if(mode!=='corn'||flight||aimPointer!==null||e.button!==0)return;
  aimPointer=e.pointerId;surface.setPointerCapture(aimPointer);aimFromPointer(e);
 };
 surface.onpointermove=e=>{if(e.pointerId===aimPointer&&mode==='corn'&&!flight)aimFromPointer(e);};
 surface.onpointerup=surface.onpointercancel=surface.onlostpointercapture=e=>{if(e.pointerId===aimPointer)aimPointer=null;};
}
function paintCorn3D(now){
 cornScene.begin([.01,-5.05,5.4],[0,.22,0],2.16);
 cornScene.paint(cornModels['corn-board']);
 const aim=Number(el('aim').value)*.95*2.25;
 if(!flight&&match?.turn!==1)cornScene.paint(cornModels['corn-aim'],[aim,1.91,.43]);
 let x=flight?.bot ? .55 : 0,y=-2.25,z=.44,turn=0;
 if(flight){
  const t=Math.max(0,Math.min(1,(now-flight.start)/flight.spec.duration)),air=Math.min(1,t/(flight.spec.roll?.69:1));
  x+=(flight.x*2.25-x)*air;
  const d=flight.spec.roll?flight.landing+(flight.depth-flight.landing)*Math.max(0,(t-.69)/.31):flight.depth;
  y+=(.57+1.6*d-y)*air;
  z=.44-.04*air+Math.sin(air*Math.PI)*flight.spec.arc;
  turn=t*7;
 }
 cornScene.paint(cornModels['corn-ear'],[x,y,z],turn);
}
function boardPoint(x,depth){
 return [320+x*(192-depth*63),285-depth*162];
}
function paintCorn(now){
 rect(0,0,640,390,'#87a45f');rect(0,0,640,74,'#b5dbd9');
 polygon([[226,301],[412,301],[384,132],[256,132]],'#5b6042');
 const edge=[boardPoint(-.48,0),boardPoint(.48,0),boardPoint(.48,1),boardPoint(-.48,1)];
 polygon(edge,'#397f73');polygon([edge[0],edge[1],[412,302],[228,302]],'#845d40');
 for(const d of [.17,.40,.66]){const p=boardPoint(-.46,d),q=boardPoint(.46,d);polygon([p,q,[q[0],q[1]+2],[p[0],p[1]+2]],'#4b9484');}
 const [hx,hy]=boardPoint(0,.84);oval(hx,hy,19,10,'#243c36');oval(hx,hy-2,14,6,'#1e2b28');
 if(!flight){
  const [ax,ay]=boardPoint(Number(el('aim').value)*.95,.84);
  ctx.strokeStyle='#fff2ab';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(320,352);ctx.lineTo(ax,ay);ctx.stroke();
  oval(ax,ay,6,6,'#ffe18b');
  oval(ax,ay,2,2,'#34443d');
 }
 let x=320,y=350;
 if(flight){
  const t=Math.max(0,Math.min(1,(now-flight.start)/flight.spec.duration)),[tx,ty]=boardPoint(flight.x,flight.depth);
  x+=(tx-x)*t;y+=(ty-y)*t-Math.sin(Math.PI*t)*flight.spec.arc*89;
 }
 oval(x,y,13,7,'#efc458');
 for(let j=-1;j<=1;j++)oval(x+j*6,y-2,2,2,'#fff0a7');
}
function finish(){
 active=false;el('start').disabled=false;el('start').textContent='Play again';el('action').disabled=true;
}
function frame(now){
 const dt=Math.min(.05,(now-(last??now))/1000);last=now;
 if(mode==='route'){
  if(active){stepRoute(run,dt);if(run.done)finish();}
  const stop=run.targets[run.next],ready=!!(active&&stop&&stop.side===run.side&&Math.abs(stop.distance-run.distance)<=5);
  action.classList.toggle('ready',ready);paintRoute(now);
  el('score').textContent=run.points+' pts · '+run.delivered+'/12 · '+run.paper+' paper';
  el('status').textContent=run.done?'Route complete':!active?'Ready to ride':now<messageUntil?message:ready?(stop.special&&!run.folded?'Fold special edition':'Toss now'):stop.special&&!run.folded?'Special edition ahead · Fold':stop.side<0?'Next mailbox on the left':'Next mailbox on the right';
 }else{
  if(flight&&now-flight.start>=flight.spec.duration){
   const label=(flight.bot?'Bot: ':'You: ')+flight.label;
   recordCornToss(match,flight.points);
   flight=null;
   if(match.done)finish();
   else if(match.turn===1){
    const wind=windFor(match.tosses-1,windSeed);
    flight={...botCornToss(match.tosses-1,wind),start:now+240,bot:true};
    announce(label,now);
   }else{action.disabled=false;announce(label,now);}
  }
  el('corn-mode').disabled=active;
  el('power').value=charge===null?0:powerAt(now-charge);
  const threshold=(.84+.77-throws[style].roll)/2.4;
  el('power').low=threshold-.045;el('power').high=threshold+.045;el('power').optimum=threshold;
  const wind=windFor(match?.tosses??0,windSeed);
  el('wind').textContent=Math.abs(wind)<.18?'Wind calm':`${Math.abs(wind)>.62?'Strong':'Light'} wind ${wind<0?'left':'right'}`;
  if(cornScene)paintCorn3D(now);else paintCorn(now);
  const [you,bot]=match?.score??[0,0];
  const detail=match?.mode==='cancel'?`To 21 · End ${match.round} · Toss ${match.tosses%4||(!match.done&&match.turn===0?0:4)}/4 · End pts ${match.end.join('–')}`:
   `${match?.tosses??0}/${totalTosses} tosses`;
  el('score').textContent=match?.mode==='practice'?`${you} pts · ${detail}`:`You ${you} · Bot ${bot} · ${detail}`;
  const result=match?.mode==='practice'?'Round complete':you===bot?'Tie game!':you>bot?'You win!':'Bot wins!';
  el('status').textContent=match?.done?result:now<messageUntil?message:active?(match.turn===1?'Bot’s toss':'Aim your next ear of corn'):'Choose a mode or leave it on Random';
 }
 requestAnimationFrame(frame);
}
reset(location.hash==='#corn'?'corn':'route');
requestAnimationFrame(frame);
