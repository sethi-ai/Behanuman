// Home is a daily practice page; preserve the original player instance and controls.
export function upgradeHome({body,engine,styles}){
 const gada=body.match(/<div id="prog"><div class="mark"><img alt="" src="([^"]+)"/);if(!gada)throw Error('Existing progress gada asset missing');
 body=body.replace('<div class="ttl"><b>Be Hanuman</b>','<div class="ttl"><b><img class="header-gada" src="/images/ui/gada-brand.png" alt="" aria-hidden="true" width="16" height="36">Be Hanuman</b>');
 body=body.replaceAll('<span>Feed</span>','<span>Home</span>');
 const hiButton='<button data-tab="hi" aria-label="h.i — Hanuman Intelligence"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v16M5 12h7v8M17 10v10M17 5v1"/></svg><span>h.i</span></button>';
 body=body.replace('<button data-tab="settings">',hiButton+'<button data-tab="settings">');
 engine=engine.replaceAll('data-sidebar-tab="home">Feed','data-sidebar-tab="home">Home').replaceAll('on Feed','on Home').replaceAll('Feed page ','Home section ');
 engine=engine.replace('<button data-sidebar-tab="settings">','<button data-sidebar-tab="hi" aria-label="h.i — Hanuman Intelligence">h.i</button><button data-sidebar-tab="settings">');
 engine=engine.replaceAll('["chant","home","learn","settings"]','["chant","home","learn","hi","settings"]').replaceAll('["chant","home","settings"]','["chant","home","hi","settings"]');
 engine=engine.replace('function hpPaint(){','function hpPaint(){paintDailyHome();');
 engine=engine.replace('function hpPos(nt){','function hpPos(nt){return;');
 engine=engine.replace('function hpGo(dir){','function hpGo(dir){return;');
 // Replace only the Home YouTube player; lesson content is untouched.
 const musicStart=engine.indexOf('  var MU_IDS='),musicEnd=engine.indexOf('  // ---- Home pager:',musicStart);
 if(musicStart<0||musicEnd<0)throw Error('Missing original Home music anchors');
 engine=engine.slice(0,musicStart)+`  (function(){var pg=document.getElementById("hpPager"),m=document.createElement("section");m.id="hpMu";m.className="hpg spotify-card";m.hidden=true;m.innerHTML='<div class="spotify-heading"><b>Listen on Spotify</b><a href="https://open.spotify.com/playlist/42Uv8NmQ9j0UwFWZRDREHg?si=19834eb429294463" target="_blank" rel="noopener noreferrer">Open in Spotify ↗</a></div><iframe id="homeSpotify" title="Be Hanuman playlist on Spotify" width="100%" height="152" loading="lazy" allow="encrypted-media; fullscreen; picture-in-picture" style="border:0;border-radius:12px"></iframe><p class="spotify-note">Optional listening. Playback availability is managed by Spotify.</p>';pg.insertBefore(m,pg.firstChild);function syncSpotify(){var f=document.getElementById("homeSpotify");if(!m.hidden&&document.documentElement.dataset.tab==="home"){if(!f.getAttribute("src"))f.src="https://open.spotify.com/embed/playlist/42Uv8NmQ9j0UwFWZRDREHg?utm_source=generator";}else f.removeAttribute("src");}new MutationObserver(syncSpotify).observe(document.documentElement,{attributes:true,attributeFilter:["data-tab"]});syncSpotify();})();
`+engine.slice(musicEnd);
 // Avoid resetting scroll position or treating Home as a swipe carousel.
 const ready='  // ---- Home pager:';
 if(!engine.includes(ready))throw Error('Missing Home ready anchor');
 engine=engine.replace(ready,`
 function paintDailyHome(){paintGadaGoal();var panel=document.getElementById("dailyPractice");if(!panel)return;var count=+(stk[dkey(new Date())]||0),resume=cur>0&&cur<N-1;document.getElementById("homeChantStart").textContent=resume?"Continue chanting":"Start chanting";document.getElementById("homeTodayCount").textContent=count+" completed "+(count===1?"reading":"readings")+" today";}
 function paintGadaGoal(){if(!stk)return;var date=dkey(new Date()),count=+(stk[date]||0),target=goal||1,p=document.getElementById("prog"),button=document.getElementById("gadaGoal");if(!p)return;p.style.setProperty("--verse-progress",(Math.min(1,count/target)*100)+"%");p.classList.toggle("goal-kept",count>=target);if(!button){button=document.createElement("button");button.id="gadaGoal";button.type="button";button.innerHTML='<span aria-hidden="true">✧</span><span class="gada-caption" hidden></span>';p.querySelector(".mark").appendChild(button);button.onclick=function(){var caption=button.querySelector(".gada-caption");caption.hidden=!caption.hidden;};}var detail=count+" of "+target+" readings completed today";button.setAttribute("aria-label",detail+". Show daily goal details");button.querySelector(".gada-caption").textContent=detail+(count>=target?" · A little stronger today":"");var stamp="bh_gada_celebrated_"+date;if(count>=target&&sessionStorage.getItem(stamp)!=="1"){sessionStorage.setItem(stamp,"1");p.classList.remove("goal-sparkle");requestAnimationFrame(function(){p.classList.add("goal-sparkle")});}}
 var pager=document.getElementById("hpPager"),music=document.getElementById("hpMu");
 if(pager&&music){pager.insertBefore(music,pager.firstChild);var daily=document.createElement("section");daily.id="dailyPractice";daily.innerHTML='<p class="home-eyebrow">YOUR DAILY PRACTICE</p><div class="home-welcome-art">'+uiImg("x01-meditate","home-lotus").replace('alt=""','alt="Hanuman sitting on a lotus"')+'<h2>A little time with Hanuman</h2></div><button id="homeChantStart" class="home-chant">Start chanting</button><p id="homeTodayCount" aria-live="polite"></p><div class="home-secondary"><button data-home-link="learn">Learn the Chalisa</button><button data-home-link="hi">h.i · Stories to reflect with</button></div>';music.after(daily);document.getElementById("homeChantStart").onclick=function(){if(cur>0&&cur<N-1)showTab("chant");else startChant()};daily.addEventListener("click",function(e){var b=e.target.closest("[data-home-link]");if(b)showTab(b.dataset.homeLink)});paintDailyHome();}
 window.addEventListener("bh:home-refresh",paintDailyHome);
  // ---- Home pager:`);
 engine=engine.replace('function showTab(t,sub){','function showTab(t,sub){if(localStorage.getItem("bh_simple")==="1"&&t!=="settings")t="chant";');
 engine=engine.replace('tb.style.setProperty("--i",Math.max(0,TABN.indexOf(t)));','tb.style.setProperty("--n",localStorage.getItem("bh_simple")==="1"?2:TABN.length);tb.style.setProperty("--i",localStorage.getItem("bh_simple")==="1"?(t==="settings"?1:0):Math.max(0,TABN.indexOf(t)));');

 body+='<dialog id="themePicker" class="theme-picker" aria-labelledby="themePickerTitle"><h2 id="themePickerTitle">Choose your appearance</h2><div role="radiogroup" aria-label="Appearance"><button role="radio" data-theme-choice="dk-w">Dark Warm</button><button role="radio" data-theme-choice="dk-c">Dark Cool</button><button role="radio" data-theme-choice="lt-w">Light Warm</button><button role="radio" data-theme-choice="lt-c">Light Cool</button></div><button id="themePickerClose">Done</button></dialog>';
 engine=engine.replace('if(diyaEl)diyaEl.addEventListener("click",function(){PB.theme.set(theme==="dk"?"lt":"dk");tilePaint()});','if(diyaEl){diyaEl.setAttribute("aria-label","Choose appearance");diyaEl.addEventListener("click",openThemePicker)}');
 engine=engine.replace('var pb=e.target.closest("[data-pb]");if(pb){','var pb=e.target.closest("[data-pb]");if(pb&&pb.dataset.pb==="theme"){openThemePicker();return}if(pb){');
 engine=engine.replace('else if(k==="dark"){theme=theme==="dk"?"":"dk";setPref("bh_theme",theme);applyPrefs()}','else if(k==="dark"){openThemePicker()}');
 const themeAnchor=' function paintDailyHome(){';
 engine=engine.replace(themeAnchor,` function openThemePicker(){var d=document.getElementById("themePicker");if(!d)return;var selected=(theme==="dk"?"dk":"lt")+"-"+(warm?"w":"c");d.querySelectorAll("[data-theme-choice]").forEach(function(b){b.setAttribute("aria-checked",String(b.dataset.themeChoice===selected));b.tabIndex=b.dataset.themeChoice===selected?0:-1});if(!d.open)d.showModal();d.querySelector('[aria-checked="true"]').focus();}
 var themeDialog=document.getElementById("themePicker");if(themeDialog){themeDialog.addEventListener("click",function(e){var b=e.target.closest("[data-theme-choice]");if(!b)return;theme=b.dataset.themeChoice.indexOf("dk")===0?"dk":"";warm=b.dataset.themeChoice.endsWith("w")?1:0;setPref("bh_theme",theme);setPref("bh_wf",warm);applyPrefs();openThemePicker();});themeDialog.addEventListener("keydown",function(e){if(!["ArrowDown","ArrowRight","ArrowUp","ArrowLeft"].includes(e.key))return;var bs=Array.from(themeDialog.querySelectorAll("[data-theme-choice]")),i=bs.indexOf(document.activeElement);if(i<0)return;e.preventDefault();bs[(i+(["ArrowDown","ArrowRight"].includes(e.key)?1:3))%4].click();});document.getElementById("themePickerClose").onclick=function(){themeDialog.close()};}
`+themeAnchor);
 engine=engine.replace('function stkRender(){','function stkRender(){paintGadaGoal();');
 body=body.replace(/(<b>)(<img class="header-gada"[^>]+>)Be Hanuman(<\/b>)/,'$1<span class="brand-name">Be Hanuman</span>$2$3');
 // Remove the old automatic iOS reminder; the new invitation is optional and dismissible.
 engine=engine.replace(/    if\(iOS&&!standalone[^\n]*\n/,'');
 // Direct guest reading is permission to read, not completed setup or authentication.
 engine=engine.replace('return onbDone()||!!s','return stg("bh_guest_read","")==="1"||onbDone()||!!s');
 engine=engine.replace('window.addEventListener("bh:welcome-complete",', 'window.addEventListener("bh:guest-read",function(){showTab("chant");if(cur===0)goTo(1)});window.addEventListener("bh:welcome-complete",');
 // One installation controller serves Welcome, post-welcome and existing app controls.
 const installFrom=engine.indexOf('  // Add to Home Screen.'),installTo=engine.indexOf('  var mf=',installFrom);
 if(installFrom<0||installTo<0)throw Error('Install controller anchors missing');
 engine=engine.slice(0,installFrom)+'  function installApp(){window.dispatchEvent(new Event("bh:install"))}\n  var standalone=window.matchMedia&&matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;var installButton=document.getElementById("install");if(installButton)installButton.style.display=standalone?"none":"";window.addEventListener("appinstalled",function(){if(installButton)installButton.style.display="none"});\n'+engine.slice(installTo);
 // Signal that all legacy navigation listeners are bound before React can finish welcome.
 engine=engine.replace('window.dispatchEvent(new Event("bh:ready"));','document.documentElement.dataset.rendererReady="1";window.dispatchEvent(new Event("bh:ready"));');
 // Set the active page label for assistive technology on both navigation surfaces.
 engine=engine.replace('b.classList.toggle("on",b.dataset.tab===t)','b.classList.toggle("on",b.dataset.tab===t);b.setAttribute("aria-current",b.dataset.tab===t?"page":"false")');
 return {body,engine,styles};
}
