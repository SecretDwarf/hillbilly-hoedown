export function mountTestScreen(){
 const enter=document.querySelector('.test-full-enter'),exit=document.querySelector('.test-full-exit');
 const root=document.querySelector('.test-shell');
 const body=document.body;
 function close(){
  body.classList.remove('test-full');
  if(document.fullscreenElement===root)document.exitFullscreen?.().catch(()=>{});
  enter.focus();
 }
 enter.onclick=async()=>{
  body.classList.add('test-full');
  exit.focus();
  try{await root.requestFullscreen?.();}catch{/* The fixed layout is the fullscreen fallback. */}
 };
 exit.onclick=close;
 addEventListener('keydown',event=>{
  if(event.code==='Escape'&&body.classList.contains('test-full')){event.preventDefault();close();}
 });
 document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement&&body.classList.contains('test-full')){
   body.classList.remove('test-full');
   enter.focus();
  }
 });
}
mountTestScreen();
