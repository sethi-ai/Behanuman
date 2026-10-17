export function upgradeWelcome({body,engine,styles}) {
 const from=engine.indexOf('  // ---- onboarding ----'),to=engine.indexOf('  // ---- Settings tiles',from);
 if(from<0||to<0)throw Error('Welcome bridge anchors missing');
 engine=engine.slice(0,from)+`  var onbEl=document.getElementById("onb");
 function openOnb(){window.dispatchEvent(new Event("bh:open-onboarding"))}
 document.getElementById("afterReadingSetup").onclick=openOnb;
 window.__firstRun=function(){window.dispatchEvent(new Event("bh:first-run"))};
 window.addEventListener("bh:navigate",function(e){var t=e.detail.tab;if(["chant","home","learn","settings"].indexOf(t)<0)return;showTab(t);if(t==="chant"&&e.detail.fresh)goTo(0)});
 window.addEventListener("bh:welcome-complete",function(e){skInfoPaint();hpPaint();showTab(e.detail.journey||"chant");if((e.detail.journey||"chant")==="chant")goTo(0)});
 `+engine.slice(to);
 body=body.replace(/<div id="onb">[\s\S]*?(?=<button id="diya")/,'<div id="onb" hidden></div><div id="welcome-root"></div>');
 engine=engine.replace('return !!(s&&s.intent&&s.intent.trim()&&s.promise&&s.promise.trim())','return onbDone()||!!s');
 engine=engine.replaceAll('onbEl.classList.contains("open")','document.documentElement.classList.contains("welcome-open")');
 engine=engine.replace(/  function bio\(t\)\{[\s\S]*?(?=  function esc\(s\))/, '');
 engine=engine.replaceAll(/\bbioDev\(/g,'esc(').replaceAll(/\bbio\(/g,'esc(');
 engine=engine.replace('fontSel=0,bionic=0,warm=0','fontSel=0,warm=0');
 engine=engine.replace('fontSel=+localStorage.getItem("bh_font")||0;bionic=+localStorage.getItem("bh_br")||0;if(fontSel!==2)bionic=0;', 'fontSel=localStorage.getItem("bh_font")==="1"?1:0;localStorage.removeItem("bh_br");');
 engine=engine.replace(/h\.classList\.toggle\("br",[\s\S]*?(?=h\.classList\.toggle\("dk")/,'h.classList.remove("br","fl");');
 engine=engine.replace('h.classList.toggle("fl",fontSel===2);','');
 engine=engine.replace('fontSel=+b.dataset.ft;if(fontSel!==2)bionic=0;', 'fontSel=+b.dataset.ft===1?1:0;');
 engine=engine.replace(/    if\(b\.dataset\.br!==undefined\)[^\n]*\n/,'');
 engine=engine.replace(/    br:\{get:[^\n]*\n/,'');
 engine=engine.replace(/    else if\(k==="br"\)[^\n]*\n/,'');
 engine=engine.replace('br:!!bionic,','');
 engine=engine.replace(/font:\{get:[^\n]*/, 'font:{get:function(){return fontSel===1?"s":"m"},set:function(v){fontSel=v==="s"?1:0;setPref("bh_font",fontSel);applyPrefs();fit()}},');
 body=body.replace(/<div class="row" id="rowBr">[\s\S]*?<\/div><\/div>/,'').replace(/<button[^>]+data-pb="font" data-v="l"[^>]*>.*?<\/button>/,'');
 body=body.replace(/<button[^>]+data-(?:ft="2"|br=)[^>]*>[\s\S]*?<\/button>/g,'');
 styles=styles.replace(/@font-face\{font-family:'Lexend'[^}]*\}/g,'');
 styles=styles.replace(/([^{}]+)\{([^{}]*)\}/g,(rule,selector)=>/\.fl\b|\.bn\b|html\.br\b/.test(selector)?'':rule).replaceAll('Lexend','removed font');
 // Superseding brief names this actual navigation tab Feed.
 body=body.replaceAll('<span>Home</span>','<span>Feed</span>');
 engine=engine.replaceAll('data-sidebar-tab="home">Home','data-sidebar-tab="home">Feed').replaceAll('on Home','on Feed');
 body=body.replace('id="learning-settings"></div>','id="learning-settings"></div><div id="tour-settings"></div>');
 body=body.replace('Review my Sankalp','Choose my journey');
 engine=engine.replaceAll('<button data-sd="11">11 days</button><button data-sd="21">21 days</button><button data-sd="40">40 days</button>','<button data-sd="3">3 days</button><button data-sd="7">7 days</button><button data-sd="11">11 days</button><button data-sd="21">21 days</button>');
 if(/\bbionic\b|\bbioDev\b|function bio\(/i.test(engine)||/Lexend|Bionic reading/.test(body+styles))throw Error('Old typography still present');
 body=body.replace('<details><summary>Privacy</summary>','<details><summary>Privacy</summary><p>Demo registration is not phone authentication. A supplied demo phone number remains in this browser and is not sent to the account database or treated as verified identity.</p>');
 engine=engine.replace('function skInfoPaint(){','function skInfoPaint(){var finishButton=document.getElementById("complete");if(finishButton)finishButton.textContent=sk2Get()?"Complete Sankalp":"Complete reading";');
 engine=engine.replace('window.dispatchEvent(new Event("bh:ready"));','document.querySelectorAll("#hpDots i").forEach(function(dot,i){dot.setAttribute("role","button");dot.setAttribute("tabindex","0");dot.setAttribute("aria-label","Feed page "+(i+1));dot.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();dot.click()}})});window.dispatchEvent(new Event("bh:ready"));');
 return {body,engine,styles};
}
