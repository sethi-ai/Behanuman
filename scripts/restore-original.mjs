// Read-only import of the frozen live renderer. All output stays in the test project.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const source = path.resolve('../Be Hanuman App/live-site');
const html = readFileSync(path.join(source, 'index.html'), 'utf8');
const hash = createHash('sha256').update(html).digest('hex');
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
let engine = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
let body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'');
body=body.replace('<p id="setHi"></p>', '<p id="setHi"></p><div id="cloud-account"></div>');
body=body.replaceAll('Reset profile','Reset this device');
body=body.replace(/<p class="setver">[\s\S]*?<\/p>/g,'');
if (!engine.includes('var LIVE=/*LIVE*/true')) throw Error('Expected the frozen live variant, not the Learn prototype');
function replaceOnce(from,to){if(!engine.includes(from))throw Error('Missing source anchor: '+from.slice(0,80));engine=engine.replace(from,to)}
// A cancelled touch must never count as a completed swipe.
replaceOnce('stage.addEventListener("pointercancel",end);','stage.addEventListener("pointercancel",function(){dragging=false;dy=0;stage.classList.remove("drag");layout()});');
// Paint at most once per display frame; audio decoding does not trigger React renders.
replaceOnce('stage.addEventListener("pointermove",function(e){','var dragFrame=0;stage.addEventListener("pointermove",function(e){');
replaceOnce('if(e.target.closest("button,#sheet,.sl"))return;','if(e.target.closest("button,#sheet,.sl,.skw"))return;');
replaceOnce('var dyw=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?400:1);','if(e.target.closest&&e.target.closest(".skw"))return;var dyw=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?400:1);');
replaceOnce('if((cur===0&&dy>0)||(cur===N-1&&dy<0))dy*=.25;\n    layout();','if((cur===0&&dy>0)||(cur===N-1&&dy<0))dy*=.25;\n    if(!dragFrame)dragFrame=requestAnimationFrame(function(){dragFrame=0;if(dragging)layout()});');
replaceOnce('el.style.zIndex=z;','if(!vis&&el.style.visibility==="hidden")return;\n      el.style.zIndex=z;');
replaceOnce('VO.preload="auto";NX.preload="auto";','VO.preload="auto";NX.preload="auto";VO.hidden=true;NX.hidden=true;VO.setAttribute("aria-label","Verse recitation");document.body.appendChild(VO);document.body.appendChild(NX);');
// A handwritten fact bubble followed by six breathing cues and the start pill.
replaceOnce('<i class="br-r"><b id="brN">1</b></i>','');
replaceOnce('<h3 class="dyk">Did you know?</h3>','');
replaceOnce('<div class="sk fcv"><h2 id="fcT">','<div class="sk fcv"><div class="fact-chat"><h3 class="dyk">Did You Know</h3><h2 id="fcT">');
replaceOnce('<p class="mt" id="fcB"></p><button','<p class="mt" id="fcB"></p></div><div class="breath-stage"><button');
replaceOnce('<span id="brT">Breathe in</span></button>','<span id="brT"></span></button><div class="breath-caption" aria-live="polite"><span>breathe in</span><small>, breathe out</small></div></div>');
replaceOnce('<span>Read your intention</span><p id="fcIt"></p>','<div id="fcIntentBlock"><span>Intention</span><p id="fcIt"></p></div><div id="fcPromiseBlock"><span>Promise</span><p id="fcPt"></p></div><small class="reminder-note">Hold your intention and promise in mind as you breathe in and out.</small>');
replaceOnce('ii.style.display=sk&&sk.intent?"":"none";document.getElementById("fcIt").textContent=sk&&sk.intent?"\\u201c"+sk.intent+"\\u201d":""','ii.style.display=sk&&(sk.intent||sk.promise)?"":"none";document.getElementById("fcIntentBlock").hidden=!(sk&&sk.intent);document.getElementById("fcPromiseBlock").hidden=!(sk&&sk.promise);document.getElementById("fcIt").textContent=sk&&sk.intent?sk.intent:"";document.getElementById("fcPt").textContent=sk&&sk.promise?sk.promise:""');
replaceOnce('var c=D[cur];fl.textContent','document.documentElement.dataset.chantCard=String(cur);var c=D[cur];fl.textContent');
const breathingBlock=/  var brT0=null,brPh=0,brCt=1;[\s\S]*?(?=  window\.__fact=function)/;
if(!breathingBlock.test(engine))throw Error('Missing original breathing controller');
engine=engine.replace(breathingBlock,`  var brT0=null,brStep=0;
  function brPaint(){var orb=document.getElementById("fcR"),text=document.getElementById("brT");if(!orb||!text)return;var done=brStep===6;orb.disabled=!done;orb.classList.toggle("ready",done);orb.classList.toggle("inhale",!done&&brStep%2===0);orb.classList.toggle("exhale",!done&&brStep%2===1);orb.parentElement.classList.toggle("complete",done);orb.parentElement.classList.toggle("exhaling",!done&&brStep%2===1);text.textContent=done?"Start chanting":brStep%2?"Breathe out":"Breathe in";orb.setAttribute("aria-label",text.textContent);}
  window.__brStart=function(){clearInterval(brT0);brStep=0;brPaint();brT0=setInterval(function(){if(cur!==0||!homeTab()){clearInterval(brT0);return;}brStep++;brPaint();if(brStep===6)clearInterval(brT0);},4000);};
  document.addEventListener("click",function(e){if(e.target.closest("#fcR")&&brStep===6){clearInterval(brT0);goTo(1);}});
`);
// Do not retain legacy optional signup transmission in the test renderer.
engine=engine.replace(/var SIGNUP_URL="[^"]*"/,'var SIGNUP_URL=""');
engine=engine.replaceAll('Reset profile','Reset this device');
replaceOnce('stk[k]=(stk[k]||0)+1;stkSave();','stk[k]=(stk[k]||0)+1;stkSave();window.dispatchEvent(new CustomEvent("bh:round",{detail:{date:k,eventId:crypto.randomUUID()}}));');
const close=engine.lastIndexOf('})();');
if(close<0)throw Error('Missing renderer closure');
engine=engine.slice(0,close)+`window.addEventListener("bh:restore",function(){try{stk=JSON.parse(localStorage.getItem("bh_rounds")||"{}");sk=JSON.parse(localStorage.getItem("bh_sank")||"{}");goal=dgGet();round=parseInt(localStorage.getItem("bh_round")||"1",10);skInfoPaint();hpPaint();stkRender();updateRounds();}catch(e){}});window.addEventListener("bh:open-account",function(){showTab("settings")});\n`+engine.slice(close);
engine+='\nwindow.dispatchEvent(new Event("bh:ready"));';
mkdirSync('src/restored',{recursive:true});
mkdirSync('public/restored',{recursive:true});
writeFileSync('src/restored/body.html',body);
writeFileSync('src/restored/styles.css',styles);
writeFileSync('public/restored/engine.js',engine);
writeFileSync('src/restored/provenance.json',JSON.stringify({source:'Be Hanuman App/live-site/index.html',sha256:hash,mode:'original DOM renderer in Next shell'},null,2));
for(const name of ['images','audio']){const folder=existsSync(path.join(source,name))?path.join(source,name):path.join(source,'..',name);if(existsSync(folder))cpSync(folder,path.join('public',name),{recursive:true});}
console.log('Restored frozen live renderer:',hash,'; body',body.length,'; styles',styles.length,'; engine',engine.length);
