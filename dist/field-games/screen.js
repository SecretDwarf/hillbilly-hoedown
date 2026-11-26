const get=id=>document.getElementById(id);
const page=document.body;

export function setupScreen(onChange){
 function drawer(open){
  page.classList.toggle('drawer',open);onChange();
  get('open-controls').setAttribute('aria-expanded',String(open));
  (open?get('close-controls'):get('open-controls')).focus();
 }
 function setActive(active){
  page.classList.toggle('immersive',active);
  if(!active){page.classList.remove('drawer');get('open-controls').setAttribute('aria-expanded','false');}
  onChange();
 }
 get('full-screen').onclick=async()=>{
  setActive(true);
  get('open-controls').focus();
  try{await document.documentElement.requestFullscreen?.();}catch{/* The fixed view also works without browser fullscreen. */}
 };
 get('exit-screen').onclick=()=>{
  setActive(false);
  if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
  get('full-screen').focus();
 };
 get('open-controls').onclick=()=>drawer(!page.classList.contains('drawer'));
 get('close-controls').onclick=()=>drawer(false);
 addEventListener('keydown',e=>{
  if(e.code!=='Escape'||!page.classList.contains('immersive'))return;
  if(page.classList.contains('drawer'))drawer(false);else get('exit-screen').onclick();
 });
 document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement&&page.classList.contains('immersive'))setActive(false);
 });
}
