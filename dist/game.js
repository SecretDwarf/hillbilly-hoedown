import {decodePigMotion,poseAt} from './pig-motion.js';
import {moveFarmer,chaseFarmer} from './pig-movement.js';
import {canGrab,holdTimes,grabReach,roundLength,beginGrip,shiftGrip,braceGrip,pigScore,setCarrierScore,tickPigScore,takePigBonus,winningTeam,bonusReach} from './pig-rules.js';
import {drawModel} from './game-models.js';
import { makeRace, cartMove, stepRace, drawRace } from './slalom.js';
const find = id => document.getElementById(id);
const canvas = find('arena');
const ctx = canvas.getContext('2d');
const farmers = [
  { name: 'You', brand: 'H', team:0, color: '#157763', skin: '#c68d5e', x: 22, y: 79 },
  { name: 'June', brand: 'J', team:0, color: '#2c927a', skin: '#a96045', x: 78, y: 79 },
  { name: 'Bo', brand: 'B', team:1, color: '#a34735', skin: '#e4ac78', x: 78, y: 22 },
  { name: 'Mae', brand: 'M', team:1, color: '#b76041', skin: '#714533', x: 22, y: 22 }
];
const spawns = farmers.map(({x, y}) => ({x, y}));
let practice=false,pigFrames,animStart=0,slipNoticeUntil=0;
let roster=farmers;
fetch('./pig-motion.bin').then(response=>{
  if(!response.ok)throw Error('Pig animation unavailable');
  return response.arrayBuffer();
}).then(buffer=>{pigFrames=decodePigMotion(buffer);}).catch(()=>{ /* Keep the base mesh if animation data fails to load. */ });
const pigStart = {x: 42, y: 63};
const pig = {...pigStart};
const held = new Set();
const stick = find('stick');
const stickInput = { pointer: null, x: 0, y: 0 };
const clamp = (n, min = 5, max = 95) => Math.min(max, Math.max(min, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let mode = "pig", race = makeRace(), racing = false, brakePointer = null, keyBrake = false;
let end = 0, owner = null, slip = 0, safe = 0, last = 0, botsAfter = 0, pigAngle = -.7;
let grip=null,gripNotice='',gripNoticeUntil=0,score=pigScore(),bonusUntil=0;
let grabPointer = null, keyGrab = false, grabQueuedUntil = 0;

function bonusPoint(){
 const side=score.bonus?.part==='tail'?-1:1;
 return {x:clamp(pig.x+Math.cos(pigAngle)*side*4),y:clamp(pig.y+Math.sin(pigAngle)*side*4)};
}
function teammate(player){return !!owner&&player!==owner&&owner.team===player.team;}
function showScore(){
 const [teal,rivals]=score.points.map(n=>Math.floor(n));
 const out=find('pig-score'),text=practice?`Practice · ${teal} pts`:`Teal ${teal} · Rivals ${rivals}`;
 if(out.textContent!==text)out.textContent=text;
}
function grab(player, now) {
  if(!end||now>=end)return;
  const human=player===farmers[0];
  if(teammate(player)){
   if(takePigBonus(score,{teammate:true,carrier:false,distance:distance(player,bonusPoint()),team:player.team,now})&&player.team===0)
    bonusUntil=now+850;
   return;
  }
  if (!end || now >= end || !canGrab({human,distance:distance(player,pig),hasOwner:!!owner,ownerIsHuman:owner?.team===0,sameOwner:player===owner,now,safeUntil:Math.max(safe,grip?.guardUntil??0),botsAfter})) return;
  owner = player;setCarrierScore(score,now);
  animStart=now;
  Object.assign(pig, {x: player.x, y: player.y});
  const times=holdTimes(human,now);
  safe=times.safeUntil;slip=times.slipAt;
  grip=human?beginGrip(now):null;gripNotice='';gripNoticeUntil=0;
}

function gripAction(side){
 if(!end||owner!==farmers[0]||!grip)return;
 const now=performance.now();
 if(now>=end)return;
 if(side==='brace'){
  if(braceGrip(grip,now)){gripNotice='Braced!';gripNoticeUntil=now+600;}
  return;
 }
 const next=shiftGrip(grip,side,now);
 grip=next.grip;
 if(next.result==='saved'){gripNotice='Grip saved!';gripNoticeUntil=now+650;}
 else if(next.result==='wrong'){gripNotice='Try the highlighted grip';gripNoticeUntil=now+500;}
}
for(const [id,side] of [['grip-left','left'],['grip-right','right'],['grip-brace','brace']])
 find(id).onclick=()=>{
  if(mode==='cart'&&racing)cartMove(race,side==='brace'?'push':side);
  else gripAction(side);
 };
function showGrip(now){
 const active=!!end&&owner===farmers[0]&&!!grip;
 const hint=find('grip-hint');
 hint.hidden=!active;
 const next=active&&now>=grip.showAt?grip.pattern[grip.index]:null;
 const text=active?(next?'Wiggle: '+grip.pattern.slice(grip.index).map(side=>side==='left'?'Left':'Right').join(' → '):'Grip steady. Watch for a wiggle.'):'';
 if(hint.textContent!==text)hint.textContent=text;
 for(const side of ['left','right']){
  const button=find('grip-'+side);
  button.disabled=!active;
  button.classList.toggle('in-reach',next===side);
 }
 find('grip-brace').disabled=!active||grip.braced;
}
function frame(now) {
  const dt = Math.min(0.04, (now - last) / 1000);
  last = now;
  const active = dir => Number([...held].some(key => key.endsWith(':' + dir)));
  const x = active('right') - active('left');
  if (mode === 'cart') {
    if (racing) {
      stepRace(race, dt, x || stickInput.x, keyBrake || brakePointer !== null);
      find('time').textContent = race.elapsed.toFixed(1) + ' s';
      if (race.finished) {
        racing = false;
        const penalty = race.misses * 2;
        find('status').textContent = (race.elapsed + penalty).toFixed(1) + ' s final · +' + penalty + ' s penalties';
        find('start').textContent = 'Race again';
        find('start').disabled = false;
      } else {
        const status = (race.next - race.misses) + ' / 5 gates cleared';
        if (find('status').textContent !== status) find('status').textContent = status;
      }
    }
    drawRace(ctx, race, oval);
    requestAnimationFrame(frame);
    return;
  }
  if (end && now >= end) {
    const winner=winningTeam(score);
    find('status').textContent=practice?'Practice complete':winner===null?'Tie game!':winner===0?'Teal team wins!':'Rivals win!';
    showScore();
    find('time').textContent = '0 s';
    find('start').disabled = false;
    find('start').textContent = 'Play again';
    end = 0;
  }
  if (end) {
    tickPigScore(score,owner?.team??null,now,dt,!!owner&&roster.some(p=>teammate(p)));
    const y = active('down') - active('up');
    moveFarmer(farmers[0],roster,x||y?x:stickInput.x,x||y?y:stickInput.y,dt,owner===farmers[0]);
    if (owner) Object.assign(pig, {x: owner.x, y: owner.y});
    if (grabPointer!==null || keyGrab || now<grabQueuedUntil) grab(farmers[0],now);
    for (const [i, bot] of roster.slice(1).entries()) {
      const t = now / 850 + i * 2;
      if (owner === bot) {
        const rival = roster.filter(p => p.team !== bot.team).sort((a,b) => distance(a,bot)-distance(b,bot))[0];
        chaseFarmer(bot,roster,bot.x-rival.x+10*Math.cos(t),bot.y-rival.y+10*Math.sin(t),dt,true,i%2?1:-1);
      } else if(teammate(bot)){
        const point=bonusPoint(),dx=point.x-bot.x,dy=point.y-bot.y;
        if(Math.hypot(dx,dy)>6)chaseFarmer(bot,roster,dx,dy,dt,false,i%2?1:-1);
        if(score.bonus)grab(bot,now);
      } else {
        if (owner) Object.assign(pig, {x: owner.x, y: owner.y});
        const waiting=now<botsAfter;
        const wander=waiting?13:2.5;
        const dx=(waiting?0:pig.x-bot.x)+wander*Math.cos(t);
        const dy=(waiting?0:pig.y-bot.y)+wander*Math.sin(t);
        chaseFarmer(bot,roster,dx,dy,dt,false,i%2?1:-1);
        if(!waiting)grab(bot,now);
      }
    }
    if (owner) {
      Object.assign(pig, {x:owner.x,y:owner.y});
      if (now >= (owner===farmers[0]?grip.slipAt:slip)) {
        pig.x = clamp(pig.x + (pig.x > 50 ? -16 : 16));
        pig.y = clamp(pig.y + (pig.y > 50 ? -7 : 7));
        owner = null;grip=null;score.bonus=null;
        animStart=now;
        slipNoticeUntil=now+800;
        safe = now+300;
        botsAfter = now + 1050;
      }
    } else {
      const dx=Math.cos(now/480),dy=Math.sin(now/650);
      const pace=distance(farmers[0],pig)<grabReach+4?5:11;
      pig.x=clamp(pig.x+dx*dt*pace);
      pig.y=clamp(pig.y+dy*dt*pace);
      pigAngle=Math.atan2(-dx,-dy);
    }
    const ally=teammate(farmers[0]);
    const bonusNear=ally&&score.bonus&&distance(farmers[0],bonusPoint())<=bonusReach;
    const near=!ally&&distance(farmers[0],pig)<=grabReach&&now>=safe;
    find('grab').textContent=ally?'Grab bonus':'Grab';
    showScore();
    const status=now<bonusUntil?'+2 teammate bonus!':ally?(score.bonus?'Grab the '+score.bonus.part+' bonus!':'June has the pig. Stay close for a bonus.'):owner===farmers[0]?(now<gripNoticeUntil?gripNotice:'You have the pig!'):near?(owner?'Grab to steal!':'Grab is in range!'):owner?owner.name+' has the pig. Chase them!':now<slipNoticeUntil?'The pig slipped free!':'The pig is loose!';
    if (find('status').textContent !== status) find('status').textContent = status;
    find('grab').classList.toggle('in-reach',!!bonusNear||(near&&owner!==farmers[0]));
    find('time').textContent = Math.ceil((end-now)/1000) + ' s';
  }
  if(!end)find('grab').classList.remove('in-reach');
  showGrip(now);
  draw();
  requestAnimationFrame(frame);
}

function oval(x,y,rx,ry,color) {
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fill();
}
function draw() {
  ctx.fillStyle='#869653';ctx.fillRect(0,0,600,390);
  ctx.fillStyle='#996147';ctx.fillRect(25,42,550,313);
  ctx.fillStyle='#d59a69';ctx.fillRect(34,53,532,292);
  ctx.fillStyle='#e3ae7b';
  for(let y=75;y<345;y+=32) for(let x=45;x<550;x+=55) ctx.fillRect(x+y%25,y,16,2);
  for(const y of [40,349]) {
    ctx.fillStyle='#74452e';ctx.fillRect(26,y,550,10);
    for(let x=27;x<585;x+=55){ctx.fillStyle='#e6b174';ctx.fillRect(x,y-8,10,23);}
  }
  const sprites=[...roster,pig].sort((a,b)=>a.y-b.y);
  for(const p of sprites) {
    const x=45+p.x*5.08+(p===pig&&owner?18:0), y=62+p.y*2.7;
    if(p===pig){
      oval(x,y+4,27,9,'#986141');
      if(end&&owner!==farmers[0]&&!teammate(farmers[0])&&distance(farmers[0],pig)<=grabReach&&last>=safe){
        ctx.strokeStyle='#fff0a0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+3,32,13,0,0,Math.PI*2);ctx.stroke();
      }
      drawModel(ctx,'pig',x,y,36,pigAngle,owner?.29:0,poseAt(pigFrames,last-animStart,owner?'caught':end?'trot':'idle'));
    } else {
      oval(x,y+4,14,6,p===farmers[0]?'#e9ffdf':'#986141');
      oval(x,y-9,13,15,p.color);oval(x,y-23,9,9,p.skin);
      oval(x,y-28,14,5,'#eed08b');oval(x,y-32,8,5,'#c2975a');
      ctx.fillStyle='#fff3cc';ctx.font='bold 15px Georgia';ctx.textAlign='center';ctx.fillText(p.brand,x,y-6);
    }
  }
  if(end&&score.bonus){
    const point=bonusPoint(),x=63+point.x*5.08,y=38+point.y*2.7;
    oval(x,y,15,12,owner?.team===0?'#ffe185':'#f6a97a');
    ctx.fillStyle='#383121';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText('+2',x,y+4);
  }

}

function selectMode(next) {
  if (next === mode) return;
  mode = next;
  end = 0;
  owner = null;grip=null;showGrip(performance.now());
  racing = false;
  race = makeRace();
  Object.assign(pig,pigStart);
  farmers.forEach((player,i) => Object.assign(player,spawns[i]));
  held.clear();
  resetStick();
  brakePointer = null;
  keyBrake = false;
  grabPointer = null; keyGrab = false; grabQueuedUntil = 0;
  find('grab').classList.remove('in-reach');
  const cart = mode === 'cart';
  find('practice').hidden=cart;
  find('pig-score').hidden=cart;
  if(!cart){score=pigScore();showScore();}
  for(const [id,pigText,cartText] of [['grip-left','Left grip','Lean left'],['grip-right','Right grip','Lean right'],['grip-brace','Brace','Push']]){
   const button=find(id);button.textContent=cart?cartText:pigText;button.disabled=!cart;
  }
  find('pig-pad').classList.remove('cart');
  find('pig-mode').setAttribute('aria-pressed', !cart);
  find('cart-mode').setAttribute('aria-pressed', cart);
  canvas.setAttribute('aria-label', cart ? 'Downhill slalom course. Your teal cart has an H.' : 'Farmyard arena. Your teal farmer has an H.');
  find('grab').textContent = cart ? 'Brake' : 'Grab';
  find('status').textContent = cart ? 'Downhill time trial' : practice?'Solo practice':'Teal team: You and June';
  find('time').textContent = cart ? '0.0 s' : '30 s';
  find('instructions').textContent = cart ? 'Steer through the gates. Lean into a turn, Push on a straight, or hold Brake. Missed gates add two seconds.' :
    'Steer with one thumb and hold Grab with the other. Follow the grip prompts to earn holding points. Grab a collar or tail bonus while June carries.';
  find('start').disabled = false;
  find('start').textContent = cart ? 'Start race' : 'Start round';
}
find('practice').onclick=()=>{
  practice=!practice;
  roster=practice?[farmers[0]]:farmers;
  find('practice').setAttribute('aria-pressed',practice);
  end=0;owner=null;safe=0;grabQueuedUntil=0;score=pigScore();showScore();
  Object.assign(pig,pigStart);
  farmers.forEach((p,i)=>Object.assign(p,spawns[i]));
  find('status').textContent=practice?'Solo practice':'Teal team: You and June';
  find('time').textContent='30 s';
  find('start').textContent='Start round';
  find('start').disabled=false;
};
find('pig-mode').onclick = () => selectMode('pig');
find('cart-mode').onclick = () => selectMode('cart');
find('start').onclick = () => {
  if (mode === 'cart') {
    race = makeRace();
    racing = true;
    find('start').disabled = true;
    return;
  }
  farmers.forEach((p,i)=>Object.assign(p,spawns[i]));
  Object.assign(pig,{x:50,y:50});
  owner=null;grip=null;score=pigScore();bonusUntil=0;showScore();
  grabQueuedUntil=0;
  safe=0;
  const now=performance.now();
  animStart=now;
  slipNoticeUntil=0;
  botsAfter=now+2700;
  end=now+roundLength;
  find('start').disabled=true;
};
function updateStick(event) {
  const bounds = stick.getBoundingClientRect();
  const dx = event.clientX - (bounds.left + bounds.width / 2);
  const dy = event.clientY - (bounds.top + bounds.height / 2);
  const radius = 29;
  const length = Math.hypot(dx, dy);
  const travel = Math.min(length, radius);
  const strength = Math.max(0, (travel - 4) / (radius - 4));
  const nx = length ? dx / length : 0;
  const ny = length ? dy / length : 0;
  stickInput.x = nx * strength;
  stickInput.y = ny * strength;
  stick.style.setProperty('--x', nx * travel + 'px');
  stick.style.setProperty('--y', ny * travel + 'px');
}
function resetStick() {
  Object.assign(stickInput, { pointer: null, x: 0, y: 0 });
  stick.style.setProperty('--x', '0px');
  stick.style.setProperty('--y', '0px');
}
stick.onpointerdown = event => {
  if (stickInput.pointer !== null || event.button !== 0) return;
  stick.setPointerCapture(event.pointerId);
  stickInput.pointer = event.pointerId;
  updateStick(event);
};
stick.onpointermove = event => {
  if (stickInput.pointer === event.pointerId) updateStick(event);
};
stick.onpointerup = stick.onpointercancel = stick.onlostpointercapture = event => {
  if (stickInput.pointer === event.pointerId) resetStick();
};
const action = find('grab');
function requestGrab(){
  const now=performance.now();
  grabQueuedUntil=now+650;
  grab(farmers[0],now);
}
action.onclick=()=>{if(mode==='pig')requestGrab();};
action.onpointerdown=event=>{
  if(event.button!==0||brakePointer!==null||grabPointer!==null)return;
  action.setPointerCapture(event.pointerId);
  if(mode==='cart')brakePointer=event.pointerId;
  else{grabPointer=event.pointerId;requestGrab();}
};
action.onpointerup=action.onpointercancel=action.onlostpointercapture=event=>{
  if(brakePointer===event.pointerId)brakePointer=null;
  if(grabPointer===event.pointerId)grabPointer=null;
};
const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
addEventListener('keydown',event=>{
  const gripSide={Digit1:'left',Digit2:'brace',Digit3:'right'}[event.code];
  if(gripSide&&!event.repeat){
   event.preventDefault();
   if(mode==='cart'&&racing)cartMove(race,gripSide==='brace'?'push':gripSide);
   else if(mode==='pig')gripAction(gripSide);
  }
  if(directions[event.key]){event.preventDefault();held.add(event.code+':'+directions[event.key]);}
  if((event.code==='Digit4'||(event.code==='Space'&&event.target.tagName!=='BUTTON'))){event.preventDefault();if(mode === 'cart') keyBrake = true; else { keyGrab=true; if(!event.repeat)requestGrab(); }}
});
addEventListener('keyup',event=>{
  if(event.code==='Space'||event.code==='Digit4'){keyBrake=false;keyGrab=false;}
  if(directions[event.key]) held.delete(event.code+':'+directions[event.key]);
});
addEventListener('blur', () => { held.clear(); resetStick(); brakePointer=null; keyBrake=false; grabPointer=null; keyGrab=false; grabQueuedUntil=0; });
requestAnimationFrame(frame);
