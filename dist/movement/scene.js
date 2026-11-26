const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const unit=a=>{const d=Math.hypot(...a);return a.map(v=>v/d);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function shader(gl,type,code){
 const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
 return s;
}
export function createScene(canvas){
 const gl=canvas.getContext('webgl',{alpha:false});
 if(!gl)throw Error('Your browser could not start the 3D view.');
 const p=gl.createProgram();
 gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,`
 attribute vec3 pos;attribute vec3 color;varying vec3 tint;
 uniform vec3 origin, eye, right, up, ahead;uniform vec2 turn, scale;uniform vec3 motion, characterPose;uniform vec2 tilt;uniform vec3 farmerGesture;
 vec2 rotateAround(vec2 point, vec2 pivot, float angle){
  vec2 relative=point-pivot;
  float c=cos(angle),s=sin(angle);
  return pivot+vec2(c*relative.x-s*relative.y,s*relative.x+c*relative.y);
 }
 void main(){
  vec3 animated=pos;
  float gait=clamp(motion.y,0.0,1.0);
  float phase=motion.z;
  float side=pos.x<0.0?-1.0:1.0;
  float breathe=sin(characterPose.z*3.3);
  float quiet=1.0-gait;
  if(motion.x>0.5&&motion.x<1.5){
   float front=smoothstep(-.12,.16,pos.y);
   float paws=1.0-smoothstep(.12,.33,pos.z);
   float stride=sin(phase+front*.86)*side*gait;
   float tail=smoothstep(.22,.60,-pos.y);
   animated.y+=paws*stride*.16;
   animated.z+=paws*max(0.0,stride)*.09;
   animated.z+=gait*sin(phase*2.0-.6)*(.016+.027*front);
   animated.y+=gait*sin(phase*2.0)*pos.y*.045;
   animated.x+=tail*(sin(phase-1.0)*gait*.14+sin(characterPose.z*2.7)*quiet*.065);
   animated.z+=tail*cos(phase-1.2)*gait*.042;
   animated.z+=smoothstep(.27,.56,pos.z)*quiet*breathe*.012;
  }else if(motion.x>1.5&&motion.x<2.5){
   float stridePhase=phase+(side<0.0?3.141593:0.0);
   float stride=cos(stridePhase);
   float recovery=pow(max(0.0,sin(stridePhase)),1.3);
   float leg=1.0-smoothstep(.46,.61,pos.z);
   float shin=1.0-smoothstep(.19,.33,pos.z);
   vec2 knee=vec2(.012,.30),hip=vec2(-.017,.57);
   vec2 bent=rotateAround(pos.yz,knee,-.54*recovery*gait);
   vec2 foot=mix(pos.yz,bent,shin);
   foot=rotateAround(foot,hip,(.42*stride+.23*recovery)*gait);
   vec2 ankle=vec2(.035,.102);
   ankle=rotateAround(rotateAround(ankle,knee,-.54*recovery*gait),hip,(.42*stride+.23*recovery)*gait);
   foot=mix(foot,rotateAround(foot,ankle,(-.34*stride+.40*recovery)*gait),1.0-smoothstep(.09,.17,pos.z));
   animated.yz=mix(pos.yz,foot,leg);
   animated.z+=leg*gait*(.048*recovery-.025*abs(stride));

   float arm=smoothstep(.185,.285,abs(pos.x))*smoothstep(.40,.49,pos.z)*(1.0-smoothstep(.78,.88,pos.z));
   float forearm=1.0-smoothstep(.59,.70,pos.z);
   vec2 hand=rotateAround(pos.yz,vec2(0.0,.65),(.06+.15*max(0.0,-stride))*gait);
   hand=mix(pos.yz,hand,forearm);
   hand=rotateAround(hand,vec2(-.015,.82),-.29*stride*gait);
   animated.yz+=(hand-pos.yz)*arm;

   float torso=smoothstep(.35,.66,pos.z);
   float shoulder=smoothstep(.57,.84,pos.z);
   float head=smoothstep(.88,1.13,pos.z);
   animated.x+=.018*cos(phase)*gait*torso;
   animated.y+=pos.x*sin(phase)*gait*(.17*torso-.35*shoulder+.16*head);
   animated.z+=gait*(.008-.013*cos(2.0*phase))*torso;
   float idleShift = sin(characterPose.z*1.4);
   animated.x+=quiet*idleShift*.022*torso;
   animated.y+=quiet*(breathe*.010*shoulder+idleShift*pos.x*.036*torso);
   animated.z+=quiet*breathe*.007*shoulder;
   if(farmerGesture.x>0.0&&farmerGesture.y>0.0){
    float seconds=farmerGesture.x;
    float lift=smoothstep(0.0,.50,seconds)*(1.0-smoothstep(1.64,2.25,seconds));
    float flutter=sin((seconds-.48)*17.0)*smoothstep(.40,.63,seconds)*(1.0-smoothstep(1.40,1.67,seconds));
    float female=farmerGesture.z;
    vec2 shoulderPivot=vec2(.16,.812);
    vec2 elbowPivot=mix(vec2(.236,.666),vec2(.224,.676),female);
    vec2 wristPivot=mix(vec2(.269,.555),vec2(.251,.563),female);
    vec2 posed=pos.xz;
    if(farmerGesture.y>1.5){
     posed=rotateAround(posed,wristPivot,lift*.15*flutter*(1.0-smoothstep(.532,.566,pos.z)));
     posed=rotateAround(posed,elbowPivot,lift*(1.38+.16*flutter)*(1.0-smoothstep(elbowPivot.y-.014,elbowPivot.y+.014,pos.z)));
    }
    float attached=smoothstep(.16,.225,pos.x+.23*(.812-pos.z));
    posed=rotateAround(posed,shoulderPivot,lift*1.04*attached);
    animated.xz+=posed-pos.xz;
    animated.y+=lift*.06*attached*(1.0-smoothstep(.61,.79,pos.z));
   }
  }else if(motion.x>2.5&&motion.x<3.5){
   float dive=characterPose.y;
   float hop=.5-.5*cos(phase);
   float flight=pow(hop,1.35)*gait;
   float compression=pow(1.0-hop,5.0)*gait;
   float ears=smoothstep(.38,.69,pos.z);
   float hind=smoothstep(.02,.16,-pos.y)*(1.0-smoothstep(.08,.22,pos.z));
   animated.z+=flight*.24-compression*pos.z*.15;
   animated.y+=flight*(pos.y+.06)*.17+compression*hind*.10;
   animated.y-=ears*(flight*.16+sin(phase-1.1)*gait*.055+dive*.28);
   animated.x+=ears*side*(sin(phase-1.2)*gait*.026+breathe*quiet*.019);
   animated.z-=dive*pos.z*.42;
   animated.z+=quiet*breathe*(1.0-ears)*pos.z*.042;
  }
  else if(motion.x>3.5){
   float action=characterPose.y;
   float goose=step(4.5,motion.x)*(1.0-step(5.5,motion.x));
   float pig=step(5.5,motion.x)*(1.0-step(6.5,motion.x));
   float goat=1.0-step(4.5,motion.x);
   float foot=1.0-smoothstep(.06,.22,pos.z);
   float front=smoothstep(-.11,.12,pos.y);
   float stride=sin(phase+front*(1.0-goose)*2.4)*side*gait;
   animated.y+=stride*foot*(.075+goose*.035);
   animated.z+=max(0.0,stride)*foot*.064;
   animated.x+=sin(phase)*gait*(.012+goose*.026);
   animated.z+=max(0.0,sin(phase*2.0))*gait*.023;
   float head=smoothstep(.15,.35,pos.y);
   float gooseHead=smoothstep(.36,.83,pos.z)*goose;
   animated.y+=goat*head*action*.065+gooseHead*(action*.12+.043*sin(phase)*gait);
   animated.z+=gooseHead*(action*.039+.010*sin(phase+1.0)*gait);
   animated.x+=gooseHead*quiet*sin(characterPose.z*1.65)*.033*(1.0-action);
   animated.z-=goat*head*action*.087+pig*action*smoothstep(.05,.36,pos.z)*.11;
  }
  if(motion.x>.5) animated.x+=characterPose.x*smoothstep(.04,.75,pos.z)*.10;
  animated.xz=vec2(animated.x*tilt.x-animated.z*tilt.y,animated.x*tilt.y+animated.z*tilt.x);
  vec3 v=vec3(animated.x*turn.x-animated.y*turn.y,animated.x*turn.y+animated.y*turn.x,animated.z)+origin-eye;
  float z=dot(v,ahead);
  gl_Position=vec4(dot(v,right)*scale.x,dot(v,up)*scale.y,1.0007*z-.10004,z);
  tint=color;
 }`));
 gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 tint;void main(){gl_FragColor=vec4(tint,1.0);}`));
 gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
 gl.useProgram(p);gl.enable(gl.DEPTH_TEST);gl.clearColor(.56,.65,.49,1);
 const g={attrs:['pos','color'].map(n=>gl.getAttribLocation(p,n)),
  u:Object.fromEntries(['origin','eye','right','up','ahead','turn','scale','motion','characterPose','tilt','farmerGesture'].map(n=>[n,gl.getUniformLocation(p,n)]))};

 function mesh(data,waveSections=[]){
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  return {buffer,count:data.length/6,waveSections};
 }
 let animationClock=0;
 function begin(eye,target,zoom,time=performance.now()/1000){
  animationClock=time;
  const dpr=Math.min(devicePixelRatio,2);
  const w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
  if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);
  const ahead=unit(sub(target,eye)),right=unit(cross(ahead,[0,0,1])),up=cross(right,ahead);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  for(const [k,v] of Object.entries({eye,ahead,right,up}))gl.uniform3fv(g.u[k],v);
  const aspect=w/h;
  gl.uniform2f(g.u.scale,zoom/Math.max(1,aspect),zoom*Math.min(1,aspect));
 }
 function paint(m,origin=[0,0,0],angle=0,motion=[0,0,0],pose=[0,0],tilt=0){
  gl.uniform2f(g.u.tilt,Math.cos(tilt),Math.sin(tilt));
  gl.uniform3fv(g.u.motion,motion);
  gl.uniform3f(g.u.characterPose,pose[0]??0,pose[1]??0,animationClock);
  gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);
  for(let j=0;j<2;j++){gl.enableVertexAttribArray(g.attrs[j]);gl.vertexAttribPointer(g.attrs[j],3,gl.FLOAT,false,24,j*12);}
  gl.uniform3fv(g.u.origin,origin);gl.uniform2f(g.u.turn,Math.cos(angle),Math.sin(angle));
  const waveTime=pose[2]??0;
  gl.uniform3f(g.u.farmerGesture,0,0,0);
  if(waveTime<=0||!m.waveSections.length){
   gl.drawArrays(gl.TRIANGLES,0,m.count);
   return;
  }
  let next=0;
  for(const [start,end,part] of m.waveSections){
   if(start>next){
    gl.uniform3f(g.u.farmerGesture,0,0,0);
    gl.drawArrays(gl.TRIANGLES,next,start-next);
   }
   gl.uniform3f(g.u.farmerGesture,waveTime,part==='hand'?2:1,pose[3]??0);
   gl.drawArrays(gl.TRIANGLES,start,end-start);
   next=end;
  }
  if(next<m.count){
   gl.uniform3f(g.u.farmerGesture,0,0,0);
   gl.drawArrays(gl.TRIANGLES,next,m.count-next);
  }
 }
 return {mesh,begin,paint};
}
