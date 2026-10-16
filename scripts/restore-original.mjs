import { upgradeWelcome } from './welcome-upgrade.mjs';
// Read-only import of the frozen live renderer. All output stays in the test project.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const source = path.resolve('history/html-v1');
const html = readFileSync(path.join(source, 'index.html'), 'utf8');
const hash = createHash('sha256').update(html).digest('hex');
let styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
let engine = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
let body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'');
body=body.replace('<p id="setHi"></p>', '<p id="setHi"></p><div id="cloud-account"></div>');
body=body.replaceAll('Reset profile','Reset this device');
body=body.replace(/<p class="setver">[\s\S]*?<\/p>/g,'');
if (!engine.includes('var LIVE=/*LIVE*/true')) throw Error('Expected the frozen live variant, not the Learn prototype');
function replaceOnce(from,to){if(!engine.includes(from))throw Error('Missing source anchor: '+from.slice(0,80));engine=engine.replace(from,to)}
body+='<div id="learning-screen"></div>';
body=body.replace('<div id="cloud-account"></div>','<div id="cloud-account"></div><div id="learning-settings"></div>');
// P-009 guest-first reading and restored original Learn controller.
body=body.replace(/<section class="os on" data-s="1">[\s\S]*?<\/section>/,'<section class="os on" data-s="1"><h2>Jai Hanuman</h2><p>Begin with your intention and promise. Google sign-in is optional to begin, and required to save your progress and Sankalp to your account across devices.</p><button class="cbtn" id="onGuest">Set my Sankalp</button><button class="onb-skip" id="onExistingAccount">Already have a Sankalp? Sign in with Google</button></section>');
body=body.replace('<button id="streakBtn"','<button id="afterReadingSetup">Review my Sankalp</button><button id="streakBtn"');
body=body.replace('<div class="brand">Be Hanuman</div>','<h1 class="brand">Be Hanuman</h1>');
if(!body.includes('<h1'))body='<h1 class="app-heading">Be Hanuman — Hanuman Chalisa</h1>'+body;
replaceOnce('var TABN=LIVE?["chant","home","settings"]:["chant","home","learn","settings"];','var TABN=["chant","home","learn","settings"];');
replaceOnce('if(LIVE){var lt0=document.querySelector("#tabbar [data-tab=learn]");if(lt0)lt0.remove();}','');
replaceOnce('document.querySelectorAll("#tabbar button").length','document.querySelectorAll("#tabbar [data-tab]").length');
replaceOnce('function startChant(){showTab("chant");','var pendingSankalpTab="chant";function hasSankalp(){var s=sk2Get();return !!(s&&s.intent&&s.intent.trim()&&s.promise&&s.promise.trim())}function startChant(){if(!hasSankalp()){pendingSankalpTab="chant";openOnb();return}showTab("chant");');
replaceOnce('window.__firstRun=function(){if(!onbDone())openOnb();else maybeRemind()};','window.__firstRun=function(){if(onbDone())maybeRemind()};');
replaceOnce('if(!onbDone()&&cur>0)openOnb();','');
engine=engine.replace(/  function onbNext\(\)\{[\s\S]*?\n  \}/,'  function onbNext(){onbShow(2)}');
replaceOnce('if(b.id==="onGo1")onbNext();','if(b.id==="onExistingAccount"){onbEl.classList.remove("open");showTab("settings");return}if(b.id==="onGuest"){onbShow(2);return}\n    if(b.id==="onGo1")onbNext();');
replaceOnce('function openOnb(){','document.getElementById("afterReadingSetup").onclick=function(){openOnb();onbShow(2)};\n  function openOnb(){');

// Approved P-009 revision: Sankalp precedes both reading and learning.
body=body.replace('<button class="onb-skip" id="onSkip">Skip for now</button>','');
body=body.replace('<button class="cbtn" id="onBegin">','<p id="sankalpError" role="alert"></p><p>Google sign-in is required to save your progress and Sankalp to your account across devices. You can begin without signing in.</p><button class="cbtn" id="onBegin">');
replaceOnce('function showTab(t,sub){','function showTab(t,sub){if((t==="chant"||t==="learn")&&!hasSankalp()){pendingSankalpTab=t;openOnb();return}');
replaceOnce('function goTo(n){','function goTo(n){if(n>0&&!hasSankalp()){pendingSankalpTab="chant";if(onbEl)openOnb();return}');
replaceOnce('else if(b.id==="onBegin"){sk2Set(', 'else if(b.id==="onBegin"){if(!document.getElementById("onI").value.trim()||!document.getElementById("onP").value.trim()){document.getElementById("sankalpError").textContent="Add your intention and promise to begin.";return}sk2Set(');
replaceOnce('finishOnb();skInfoPaint();showTab("home")}','finishOnb();skInfoPaint();window.dispatchEvent(new Event("bh:sankalp-confirmed"));showTab(pendingSankalpTab||"chant")}');
replaceOnce('window.__firstRun=function(){if(onbDone())maybeRemind()};','window.__firstRun=function(){if(!hasSankalp()){pendingSankalpTab="chant";openOnb()}else maybeRemind()};');

// Ask once on this device before the first verse; Settings remains the control.
body+='<dialog id="recitationChoice" class="reading-save-dialog" aria-labelledby="recitationChoiceTitle"><h2 id="recitationChoiceTitle">Would you like recitation on?</h2><p>Listen to each verse as you read, or read quietly.</p><p>You can turn recitation on or off anytime in Settings.</p><button type="button" data-recitation="on">Keep recitation on</button><button type="button" data-recitation="off">Read without recitation</button></dialog>';
replaceOnce('function goTo(n){if(n>0&&!hasSankalp()){pendingSankalpTab="chant";if(onbEl)openOnb();return}', 'function goTo(n){if(n>0&&!hasSankalp()){pendingSankalpTab="chant";if(onbEl)openOnb();return}if(n>0&&cur===0&&stg("bh_recitationChosen","0")!=="1"){var rc=document.getElementById("recitationChoice");rc.dataset.next=String(n);if(!rc.open)rc.showModal();return}');
replaceOnce('function setMusic(on){', 'function setMusic(on){');
// Restart breathing after onboarding or a return from another tab.
replaceOnce('if(t==="chant"){skInfoPaint();deferVoice();layout()}', 'if(t==="chant"){skInfoPaint();deferVoice();layout();if(cur===0&&window.__fact)window.__fact()}');
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
replaceOnce('<span id="brT">Breathe in</span></button>','<span id="brT"></span></button><button type="button" class="breath-skip" id="breathSkip">Skip breathing · Start chanting</button><div class="breath-caption" aria-live="polite"><span>breathe in</span><small>, breathe out</small></div></div>');
replaceOnce('<span>Read your intention</span><p id="fcIt"></p>','<div id="fcIntentBlock"><span>Intention</span><p id="fcIt"></p></div><div id="fcPromiseBlock"><span>Promise</span><p id="fcPt"></p></div><small class="reminder-note">Hold your intention and promise in mind as you breathe in and out.</small>');
replaceOnce('ii.style.display=sk&&sk.intent?"":"none";document.getElementById("fcIt").textContent=sk&&sk.intent?"\\u201c"+sk.intent+"\\u201d":""','ii.style.display=sk&&(sk.intent||sk.promise)?"":"none";document.getElementById("fcIntentBlock").hidden=!(sk&&sk.intent);document.getElementById("fcPromiseBlock").hidden=!(sk&&sk.promise);document.getElementById("fcIt").textContent=sk&&sk.intent?sk.intent:"";document.getElementById("fcPt").textContent=sk&&sk.promise?sk.promise:""');
replaceOnce('var c=D[cur];fl.textContent','document.documentElement.dataset.chantCard=String(cur);var c=D[cur];fl.textContent');
const breathingBlock=/  var brT0=null,brPh=0,brCt=1;[\s\S]*?(?=  window\.__fact=function)/;
if(!breathingBlock.test(engine))throw Error('Missing original breathing controller');
engine=engine.replace(breathingBlock,`  var brT0=null,brStep=0;
  function brPaint(){var orb=document.getElementById("fcR"),text=document.getElementById("brT");if(!orb||!text)return;var done=brStep===6;orb.disabled=!done;orb.classList.toggle("ready",done);orb.classList.toggle("inhale",!done&&brStep%2===0);orb.classList.toggle("exhale",!done&&brStep%2===1);orb.parentElement.classList.toggle("complete",done);var skip=document.getElementById("breathSkip");if(skip)skip.hidden=done;orb.parentElement.classList.toggle("exhaling",!done&&brStep%2===1);text.textContent=done?"Start chanting":brStep%2?"Breathe out":"Breathe in";orb.setAttribute("aria-label",text.textContent);}
  window.__brStart=function(){clearInterval(brT0);brStep=0;brPaint();brT0=setInterval(function(){if(cur!==0||!homeTab()){clearInterval(brT0);return;}brStep++;brPaint();if(brStep===6)clearInterval(brT0);},4000);};
  document.addEventListener("click",function(e){if(e.target.closest("#breathSkip")||(e.target.closest("#fcR")&&brStep===6)){clearInterval(brT0);goTo(1);}});
`);
// Do not retain legacy optional signup transmission in the test renderer.
engine=engine.replace(/var SIGNUP_URL="[^"]*"/,'var SIGNUP_URL=""');
engine=engine.replaceAll('Reset profile','Reset this device');
replaceOnce('stk[k]=(stk[k]||0)+1;stkSave();','stk[k]=(stk[k]||0)+1;stkSave();window.dispatchEvent(new CustomEvent("bh:round",{detail:{date:k,eventId:crypto.randomUUID()}}));');
engine+='\n';
const learnBridge=`document.getElementById("recitationChoice").addEventListener("click",function(e){var b=e.target.closest("[data-recitation]");if(!b)return;stset("bh_recitationChosen","1");var on=b.dataset.recitation==="on";setMusic(on);if(on){muted=false;label()}var rc=document.getElementById("recitationChoice"),next=+rc.dataset.next||1;rc.close();goTo(next);});window.addEventListener("bh:open-learn",function(){showTab("learn")});window.addEventListener("bh:learn-visibility",function(e){var hidden=!!e.detail.hidden;document.documentElement.dataset.learnHidden=String(hidden);TABN=hidden?["chant","home","settings"]:["chant","home","learn","settings"];var tb=document.getElementById("tabbar");tb.style.setProperty("--n",TABN.length);tb.style.setProperty("--i",Math.max(0,TABN.indexOf(curTab)));});`;
const close=engine.lastIndexOf('})();');
if(close<0)throw Error('Missing renderer closure');
engine=engine.slice(0,close)+learnBridge+`window.addEventListener("bh:restore",function(){try{stk=JSON.parse(localStorage.getItem("bh_rounds")||"{}");sk=JSON.parse(localStorage.getItem("bh_sank")||"{}");goal=dgGet();round=parseInt(localStorage.getItem("bh_round")||"1",10);skInfoPaint();hpPaint();stkRender();updateRounds();}catch(e){}});window.addEventListener("bh:open-account",function(){showTab("settings")});\n`+engine.slice(close);
engine+='\nwindow.dispatchEvent(new Event("bh:ready"));';
// P-009 welcome: review the intention and promise before committing.
body=body.replace('Begin with your intention and promise. Google sign-in is optional to begin, and required to save your progress and Sankalp to your account across devices.','A little time. A clear intention. A promise you can return to. Begin your practice with a Sankalp.');
body=body.replace('<h2>Jai Hanuman</h2>','<span class="welcome-eyebrow">Welcome to Be Hanuman</span><h2>Begin with a Sankalp</h2>');
body=body.replace('<button class="cbtn" id="onBegin">Begin my sankalp</button>','<button class="cbtn" id="onReview">Review my Sankalp</button><button class="onb-skip" id="onBackRhythm">Back</button>');
const review='<section class="os" data-s="4"><span class="welcome-eyebrow">Your practice begins here</span><h2>A promise to return to</h2><p>Hold this intention in mind as you chant or learn. Small, steady actions give your promise meaning.</p><div class="welcome-review"><p id="welcomeRhythm"></p><h3>My intention</h3><p id="welcomeIntention"></p><h3>My promise</h3><p id="welcomePromise"></p></div><p class="welcome-save">Google sign-in is required to save your Sankalp and progress to your account across devices. You can begin now without signing in; your practice will stay in this browser.</p><button class="cbtn" id="onBegin">Confirm &amp; start chanting</button><button class="cbtn welcome-secondary" id="onBeginLearn">Confirm &amp; start learning</button><button class="onb-skip" id="onEditIntention">Edit my Sankalp</button></section>';
body=body.replace('</section></div></div>\n<button id="diya"','</section>'+review+'</div></div>\n<button id="diya"');
if(!body.includes('id="welcomeIntention"'))throw Error('Missing welcome review insertion');
engine=engine.replace('if(b.id==="onGo1")onbNext();','if(b.id==="onReview"){var intention=document.getElementById("onI").value.trim(),promise=document.getElementById("onP").value.trim();if(!intention||!promise){document.getElementById("sankalpError").textContent="Add your intention and promise to begin.";return}document.getElementById("sankalpError").textContent="";document.getElementById("welcomeIntention").textContent=intention;document.getElementById("welcomePromise").textContent=promise;document.getElementById("welcomeRhythm").textContent=onDur+" days · "+dgGet()+" reading"+(dgGet()===1?"":"s")+" a day";onbShow(4);return}if(b.id==="onEditIntention"){onbShow(3);return}if(b.id==="onBackRhythm"){onbShow(2);return}if(b.id==="onGo1")onbNext();');
engine=engine.replace('else if(b.id==="onBegin"){','else if(b.id==="onBegin"||b.id==="onBeginLearn"){pendingSankalpTab=b.id==="onBeginLearn"?"learn":"chant";');
engine=engine.replace('var f=onbEl.querySelector(".os.on input");','onbEl.setAttribute("role","dialog");onbEl.setAttribute("aria-modal","true");var heading=onbEl.querySelector(".os.on h2");if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}var f=onbEl.querySelector(".os.on input");');
// Feed Support us holds the reader-facing information panels.
{const marker='</div></div></div><div id="hpDots">';if(!body.includes(marker))throw Error('Missing Support us anchor');body=body.replace(marker,'</div>'+"<div id=\"supportPolicies\" class=\"support-policies\"><details><summary>Learning terms &amp; reflections</summary><p>Traditional meaning is presented separately from Let’s reflect, which offers contemporary interpretations for personal contemplation. Reflections are not scripture, scientific findings, medical advice or promises of particular results.</p><p>Mark Learned records your own choice. The 21-day milestone celebrates time committed, not mastery of every verse. This test version’s detailed source and scripture review is still in progress.</p></details><details><summary>Privacy</summary><p>When you sign in with Google, Be Hanuman receives your basic profile, including name, email address and profile picture. It does not request access to your Gmail messages or contacts.</p><p>Your account stores your Sankalp, intention, promise, reading activity and learning progress in Convex to support saving and syncing. Account activity also contributes to usage counts. Hosting and sign-in providers may process technical request and session information to operate their services.</p><p>Without sign-in, practice is kept in this browser. Browser storage also holds preferences and cached account progress. Clearing it can remove unsynced work. Signing out does not delete your account.</p><p>To request account-data deletion, use Settings → Delete account. For privacy questions, contact <a href=\"mailto:sethi.mailbox1@gmail.com\">sethi.mailbox1@gmail.com</a>. Test-app data is separate from the live app.</p></details><details><summary>Terms</summary><p>Be Hanuman is a devotional reading and learning app. This is a test version: features and lesson content may change, and errors may occur.</p><p>Use the app for your personal practice. Traditional explanations and modern reflections are learning companions, not guarantees of spiritual, health or other outcomes. Choose intentions and promises that are appropriate for you.</p><p>Keep your Google account secure. Saving across devices requires sign-in and a working connection; check that saving has completed before switching devices. You can stop using the app or request account deletion in Settings.</p><p>Questions or corrections: <a href=\"mailto:sethi.mailbox1@gmail.com\">sethi.mailbox1@gmail.com</a>. Updated 16 October 2026.</p></details></div>"+'</div></div><div id="hpDots">');}
// Reset signs out first, so automatic cloud restoration cannot bypass welcome.
{const reset='else{try{var ks=[],q;for(q=0;q<localStorage.length;q++){var kn=localStorage.key(q);if(kn&&kn.indexOf("bh_")===0)ks.push(kn)}ks.forEach(function(kn){localStorage.removeItem(kn)});sessionStorage.clear()}catch(x){}location.reload()}}';replaceOnce(reset,'else{window.dispatchEvent(new Event("bh:reset-device"))}}');}
engine=engine.replace('pg.addEventListener("wheel",function(e){var n=Date.now();','pg.addEventListener("wheel",function(e){if(e.target.closest&&e.target.closest("#supportPolicies"))return;var n=Date.now();');
// One app introduction precedes the existing Sankalp invitation.
body=body.replace('<section class="os on" data-s="1">',"<section class=\"os on intro-welcome\" data-s=\"0\"><span class=\"welcome-eyebrow\">Welcome to Be Hanuman</span><h2>A daily pause for devotion</h2><p>Read the Hanuman Chalisa, understand its verses, and make space for a steady daily practice.</p><div class=\"intro-features\"><div><h3>Chant</h3><p>Read in Hindi or Hinglish, with optional recitation.</p></div><div><h3>Learn</h3><p>Explore the meaning and reflect on each verse through a guided 21-day journey.</p></div><div><h3>Make it yours</h3><p>Begin with an intention and a promise: your Sankalp.</p></div></div><button type=\"button\" class=\"cbtn\" id=\"introContinue\">Get started</button><button type=\"button\" class=\"onb-skip\" id=\"introAccount\">Already use Be Hanuman? Sign in with Google</button></section>"+'<section class="os" data-s="1">');
body=body.replace('<button class="cbtn" id="onGuest">','<button type="button" class="onb-skip" id="introBack">Back to introduction</button><button class="cbtn" id="onGuest">');
body=body.replace('<i class="on"></i><i></i><i></i>','<i class="on"></i><i></i><i></i><i></i><i></i>');
engine=engine.replace('onbEl.classList.add("open");onbShow(1);','onbEl.classList.add("open");onbShow(0);');
engine=engine.replace('classList.toggle("on",i<s)', 'classList.toggle("on",i<=s)');
engine=engine.replace('if(b.id==="onExistingAccount"){','if(b.id==="introContinue"){onbShow(1);return}if(b.id==="introBack"){onbShow(0);return}if(b.id==="onExistingAccount"||b.id==="introAccount"){');
// Preserve verified sequential reading within this tab across reloads.
replaceOnce('var stk={},runNext=null,stkT=null;', 'var stk={},runNext=(function(){try{var next=Number(sessionStorage.getItem("bh_read_next"));return next>=2&&next<=N-1&&cur===next-1?next:cur===1?2:null}catch(e){return cur===1?2:null}})(),stkT=null;');
replaceOnce('  function stkTrack(n,from){', '  function stkTrack(n,from){if(n===0)runNext=null;');
replaceOnce('  // Trends page: weekly', '  var originalStkTrack=stkTrack;stkTrack=function(n,from){originalStkTrack(n,from);try{if(runNext===null)sessionStorage.removeItem("bh_read_next");else sessionStorage.setItem("bh_read_next",String(runNext))}catch(e){}};\n  // Trends page: weekly');
// Shared Home label and desktop sidebar navigation.
body=body.replaceAll('<span>Feed</span>','<span>Home</span>');
engine=engine.replaceAll('on Feed','on Home').replaceAll('This Feed has','This collection has');
replaceOnce('side.innerHTML=sbHTML;', `sbHTML=sbHTML.replace('<div class="sb-list">','<div class="desktop-tabs" aria-label="Desktop navigation"><button data-sidebar-tab="chant">Chant</button><button data-sidebar-tab="home">Home</button><button data-sidebar-tab="learn">Learn</button><button data-sidebar-tab="settings">Settings</button></div><div class="sb-list">');side.innerHTML=sbHTML;side.addEventListener("click",function(e){var b=e.target.closest("[data-sidebar-tab]");if(b)showTab(b.dataset.sidebarTab)});`);
replaceOnce('curTab=t;document.documentElement.dataset.tab=t;', 'curTab=t;document.documentElement.dataset.tab=t;document.querySelectorAll("[data-sidebar-tab]").forEach(function(b){b.setAttribute("aria-current",b.dataset.sidebarTab===t?"page":"false")});');
({body,engine,styles}=upgradeWelcome({body,engine,styles}));
mkdirSync('src/restored',{recursive:true});
mkdirSync('public/restored',{recursive:true});
writeFileSync('src/restored/body.html',body);
writeFileSync('src/restored/styles.css',styles);
writeFileSync('public/restored/engine.js',engine);
writeFileSync('src/restored/provenance.json',JSON.stringify({source:'history/html-v1/index.html',sha256:hash,mode:'original DOM renderer in Next shell'},null,2));
for(const name of ['images','audio']){const folder=existsSync(path.join(source,name))?path.join(source,name):path.join(source,'..',name);if(existsSync(folder))cpSync(folder,path.join('public',name),{recursive:true});}
console.log('Restored frozen live renderer:',hash,'; body',body.length,'; styles',styles.length,'; engine',engine.length);
