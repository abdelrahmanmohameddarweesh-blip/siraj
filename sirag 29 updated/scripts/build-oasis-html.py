"""Builds src/oasis/oasisHtml.ts from the standalone oasis prototype (sirag-oasis.html).
The prototype keeps working on its own in a browser; this script adds the React Native bridge."""
import json, sys, pathlib
src = pathlib.Path(sys.argv[1]).read_text()
out = pathlib.Path(sys.argv[2])
def rep(a, b, n=1):
    global src
    c = src.count(a)
    assert c >= 1, ('MISSING', a[:100])
    if n == 1: assert c == 1, ('MULTI', a[:100], c)
    src = src.replace(a, b)

# safe areas come from React Native (WKWebView does not always report env() insets)
src = src.replace('env(safe-area-inset-top,0px)', 'var(--sat,env(safe-area-inset-top,0px))')
src = src.replace('env(safe-area-inset-bottom,0px)', 'var(--sab,env(safe-area-inset-bottom,0px))')
rep('<style>', '<style>\n.bridge-only{display:none}.is-bridge .bridge-only{display:grid}.is-bridge .demo-only{display:none!important}')

# home button (bridge only) and demo-only markers
rep('<button class="round glass" id="soundBtn"></button>',
    '<button class="round glass bridge-only" id="homeBtn" aria-label="الصفحة الرئيسية"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/></svg></button><button class="round glass" id="soundBtn"></button>')
rep('<div class="dfoot">', '<div class="dfoot demo-only">')

# bridge globals at the top of the script
rep('(function(){\n"use strict";', '''(function(){
"use strict";
const BRIDGE = !!window.ReactNativeWebView;
const INIT = window.__SIRAG_INIT || {};
const DEV = !BRIDGE || !!INIT.dev;
const toRN = m => { try{ window.ReactNativeWebView.postMessage(JSON.stringify(m)); }catch(e){} };
if(BRIDGE) document.documentElement.classList.add('is-bridge');
if(INIT.insets){ document.documentElement.style.setProperty('--sat', INIT.insets.top+'px'); document.documentElement.style.setProperty('--sab', INIT.insets.bottom+'px'); }''')

# habits come from the app
rep('const HABITS = [', 'let HABITS = BRIDGE ? (INIT.habits || []) : [')
rep("const doneCount = () => HABITS.filter(h=>S.done[h.id]).length;",
    "const isDone = h => BRIDGE ? !!h.done : !!S.done[h.id];\nconst doneCount = () => HABITS.filter(isDone).length;")
rep("      const d = !!S.done[h.id];", "      const d = isDone(h);")
rep("const order = HABITS.filter(h=>!S.done[h.id]).concat(HABITS.filter(h=>S.done[h.id]));", "const order = HABITS.filter(h=>!isDone(h)).concat(HABITS.filter(isDone));")
rep("$('habitChips').innerHTML = order.map(h=>{ const d=!!S.done[h.id];", "$('habitChips').innerHTML = order.map(h=>{ const d=isDone(h);")
rep("'+HICON[h.id]+'", "'+(h.icon||HICON[h.id]||'✨')+'")

# state lives in the app's AsyncStorage
rep("try{ const raw = localStorage.getItem(KEY); S = raw ? JSON.parse(raw) : freshState(); if(!S || S.v!==1) S = freshState(); }catch(e){ S = freshState(); }",
    "if(BRIDGE){ S = INIT.state || freshState(); if(!S || S.v!==1) S = freshState(); }\nelse { try{ const raw = localStorage.getItem(KEY); S = raw ? JSON.parse(raw) : freshState(); if(!S || S.v!==1) S = freshState(); }catch(e){ S = freshState(); } }")
rep("function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }",
    "let saveT = 0;\nfunction save(){ if(BRIDGE){ clearTimeout(saveT); saveT = setTimeout(()=>toRN({type:'save', state:S}), 250); return; } try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }")

# haptics through expo-haptics
rep("function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }",
    "function buzz(ms){ if(BRIDGE){ toRN({type:'haptic', kind: Array.isArray(ms) ? 'success' : (ms>=16 ? 'medium' : 'light')}); return; } try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }")

# completing a habit is recorded by the app (prayer status sheet, plan log), which then sends rewards back
rep("function completeHabit(id, src){", "function completeHabit(id, src){\n  if(BRIDGE){ const h = HABITS.find(x=>x.id===id); if(!h) return; if(h.done){ toast('سجّلت هذه العادة اليوم'); return; } toRN({type:'complete', id}); return; }")

# journey day label in the app = number of active days
rep("$('dayLabel').textContent = dc<HABITS.length ? 'اليوم '+ar(S.day)", "const dayN = BRIDGE ? Math.max(1,S.daysActive) : S.day;\n  $('dayLabel').textContent = !HABITS.length ? 'أضف عادة لتبدأ واحتك' : dc<HABITS.length ? 'اليوم '+ar(dayN)")
rep(": 'اليوم '+ar(S.day)+'، أكملتها كلها';", ": 'اليوم '+ar(dayN)+'، أكملتها كلها';")

# menu: demo tools only in development builds
rep("$('menuBtn').onclick = menuSheet;", "$('menuBtn').onclick = menuSheet;\nif(!DEV) $('menuBtn').style.display = 'none';\n$('homeBtn').onclick = ()=>toRN({type:'navigate', to:'Home'});")

# empty-state chip to add habits
rep("  $('habitRing').innerHTML = ringSVG(dc, HABITS.length);",
    "  if(BRIDGE) $('habitChips').innerHTML += '<button class=\"chip-h\" id=\"addHabitChip\" aria-label=\"إضافة عادة\"><span class=\"cc\" style=\"border-style:dashed\"><span class=\"gi\" style=\"font-size:22px;line-height:22px;text-align:center\" aria-hidden=\"true\">＋</span></span><small>إضافة</small></button>';\n  const ahc = $('addHabitChip'); if(ahc) ahc.onclick = e=>{ e.stopPropagation(); toRN({type:'navigate', to:'HabitSetup'}); };\n  $('habitRing').innerHTML = ringSVG(dc, Math.max(1,HABITS.length));")

# public API for the app
rep("DB.open().then(()=>DB.all())", '''function applyGrants(grants, fromOpen){
  if(!Array.isArray(grants) || !grants.length) return false;
  S.applied = S.applied || [];
  let seeds=0, drops=0, lantern=false, any=false;
  grants.forEach(g=>{
    if(S.applied.indexOf(g.id)>=0) return;
    S.applied.push(g.id); any = true;
    S.seeds += g.seeds||0; S.drops += g.drops||0; seeds += g.seeds||0; drops += g.drops||0;
    if(g.lanterns){ cur().lanterns += g.lanterns; lantern = true; }
    if(g.firstOfDay) S.daysActive++;
    if(!fromOpen){ const src = document.querySelector('.chips [data-h="'+g.habitId+'"]') || document.querySelector('[data-h="'+g.habitId+'"]');
      if(g.drops) flyReward(src,'drop'); if(g.seeds) flyReward(src,'seed', g.lanterns?240:0); if(g.lanterns) flyReward(src,'lantern',120); AU.drip(.04); }
  });
  if(S.applied.length>300) S.applied = S.applied.slice(-300);
  if(!any) return false;
  save();
  if(lantern){ W.ignite={k:Math.min(cur().lanterns,12)-1, t:performance.now()}; setTimeout(()=>{ AU.lantern(); lanternSheet(); }, fromOpen?700:350); setTimeout(checkResidents, fromOpen?1400:900); }
  else setTimeout(checkResidents, 300);
  if(fromOpen && (seeds||drops)){ const parts=[]; if(seeds) parts.push(seeds===1?'بذرة':seeds===2?'بذرتين':cnt(seeds,'بذرة','بذور')); if(drops) parts.push(drops===1?'قطرة ماء':drops===2?'قطرتي ماء':cnt(drops,'قطرة','قطرات')); setTimeout(()=>toast('حصلت من عاداتك على '+parts.join(' و')), 900); }
  return true;
}
window.SiragOasis = {
  update(d){ if(d && Array.isArray(d.habits)) HABITS = d.habits; applyGrants(d && d.grants, false); renderAll(); },
  setInsets(i){ document.documentElement.style.setProperty('--sat', i.top+'px'); document.documentElement.style.setProperty('--sab', i.bottom+'px'); syncDrawerH(); }
};
if(BRIDGE){ applyGrants(INIT.grants, true); toRN({type:'ready'}); }
DB.open().then(()=>DB.all())''')


# ---------------- display modes: 'game' (default), 'hero' (home card), 'splash' (cinematic intro) ----------------
rep("const DEV = !BRIDGE || !!INIT.dev;", "const DEV = !BRIDGE || !!INIT.dev;\nconst MODE = INIT.mode || 'game';\nif(MODE!=='game') document.documentElement.classList.add('mode-'+MODE);")
rep('<style>\n', """<style>
.mode-hero .hud,.mode-hero .hint,.mode-hero .visit,.mode-hero .tools,.mode-hero .drawer,.mode-hero #notif,
.mode-splash .hud,.mode-splash .hint,.mode-splash .visit,.mode-splash .tools,.mode-splash .drawer,.mode-splash #notif{display:none!important}
.mode-hero .game,.mode-splash .game{max-width:none}\n.mode-splash .game{background:#1d2357}
.mode-splash .scene{transform:scale(1.18) translateY(4%);transform-origin:50% 60%;transition:transform 7.5s cubic-bezier(.16,.6,.2,1)}
.mode-splash.go .scene{transform:none}
.sp-vig{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,rgba(8,10,34,.72) 0%,rgba(8,10,34,.25) 30%,rgba(8,10,34,0) 46%,rgba(8,10,34,0) 70%,rgba(6,10,20,.55) 100%)}
.sp-ui{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:calc(var(--sat,0px) + 11vh) 24px calc(var(--sab,0px) + 34px);pointer-events:none;text-align:center;color:#fff3d6}
.sp-mark{width:46px;height:46px;opacity:0;transform:translateY(10px);transition:opacity 1.2s ease,transform 1.2s ease}
.sp-ui h1{margin:6px 0 0;font-family:Amiri,"Traditional Arabic","Geeza Pro",serif;font-weight:700;font-size:clamp(76px,24vw,110px);line-height:1.15;background:linear-gradient(180deg,#fff6dc 0%,#f6d48a 45%,#c9973f 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 22px rgba(246,200,110,.45)) drop-shadow(0 4px 10px rgba(0,0,0,.5));opacity:0;transform:translateY(16px) scale(.97);transition:opacity 1.6s ease,transform 1.8s cubic-bezier(.2,.7,.2,1)}
.sp-ui .tag{margin:2px 0 0;font-size:19px;font-weight:600;letter-spacing:0;color:#ffeccb;text-shadow:0 2px 10px rgba(0,0,0,.55);opacity:0;transform:translateY(10px);transition:opacity 1.4s ease,transform 1.4s ease}
.sp-ui .rule{width:120px;height:1px;margin:16px auto 0;background:linear-gradient(90deg,transparent,#f1c76a,transparent);opacity:0;transition:opacity 1.4s ease .2s}
.sp-ui .grow{flex:1}
.sp-cta{pointer-events:auto;min-width:min(320px,86%);padding:17px 22px;border:1px solid #ffe2a3;border-radius:999px;background:linear-gradient(180deg,#f9d58a,#e9b45a);color:#0d2b25;font:inherit;font-size:19px;font-weight:700;box-shadow:0 14px 30px -10px rgba(240,170,60,.7),inset 0 1px 0 rgba(255,255,255,.6);opacity:0;transform:translateY(14px);transition:opacity 1s ease,transform 1s ease;cursor:pointer}
.sp-skip{margin:12px 0 0;font-size:13px;color:rgba(255,240,210,.75);opacity:0;transition:opacity 1s ease}
.sp-ui.t0 .sp-mark{opacity:1;transform:none}
.sp-ui.t1 h1{opacity:1;transform:none}
.sp-ui.t2 .tag,.sp-ui.t2 .rule{opacity:1;transform:none}
.sp-ui.t3 .sp-cta,.sp-ui.t3 .sp-skip{opacity:1;transform:none}
""")
# showcase oasis for the splash
rep("if(BRIDGE){ S = INIT.state || freshState(); if(!S || S.v!==1) S = freshState(); }",
"""if(BRIDGE && MODE==='splash'){ S = freshState(); const oa=S.oases[0]; const pool=['palm','basil','palm','chamomile','wheat','palm','grass','basil','palm','chamomile','grass','wheat','palm','basil','chamomile','palm']; oa.plots=oa.plots.map((_,k)=>({plant:pool[k%pool.length],stage:2})); oa.lanterns=12; oa.complete=true; oa.res=['fish','butterflies','ducks','sparrows','bees','gazelle']; S.seenIntro=true; S.time='sunset'; S.seen={}; }
else if(BRIDGE){ S = INIT.state || freshState(); if(!S || S.v!==1) S = freshState(); }""")
rep("function save(){ if(BRIDGE){", "function save(){ if(MODE!=='game') return; if(BRIDGE){")
rep("interactive:!isVisiting(), seeds:S.seeds", "interactive:!isVisiting() && MODE==='game', seeds:S.seeds")
rep("if(!S.seenIntro) setTimeout(introSheet, 300);", "if(!S.seenIntro && MODE==='game') setTimeout(introSheet, 300);")
rep("setTimeout(()=>{ if(S.seenIntro) checkResidents(); }, 1600);", "setTimeout(()=>{ if(S.seenIntro && MODE==='game') checkResidents(); }, 1600);")
rep("if(BRIDGE){ applyGrants(INIT.grants, true); toRN({type:'ready'}); }", """if(BRIDGE){ if(MODE==='game') applyGrants(INIT.grants, true); toRN({type:'ready'}); }
if(MODE==='hero'){ document.addEventListener('click', ()=>toRN({type:'navigate', to:'Oasis'})); }
if(MODE==='splash') runSplash();
function runSplash(){
  const root = document.documentElement, game = $('game');
  W.glowAll = true; W.litCount = 0;
  const vig = document.createElement('div'); vig.className = 'sp-vig'; game.appendChild(vig);
  const ui = document.createElement('div'); ui.className = 'sp-ui';
  ui.innerHTML = '<svg class="sp-mark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="3" r="1.6" fill="none" stroke="#f1c76a" stroke-width="1.2"/><path d="M8 6h8l-1.2-2H9.2z" fill="#e2b462"/><rect x="7.5" y="6.5" width="9" height="11" rx="1.6" fill="rgba(246,210,122,.25)" stroke="#f1c76a" stroke-width="1.2"/><path d="M12 9c1.4 1.6 1.6 2.6 1.6 3.2a1.6 1.6 0 0 1-3.2 0c0-.6.2-1.6 1.6-3.2z" fill="#ffcf6b"/><path d="M6.5 17.5h11l-1.4 3.5H7.9z" fill="#e2b462"/></svg>'+
    '<h1>سراج</h1><p class="tag">كل عمل طيب يترك أثرًا</p><div class="rule"></div><div class="grow"></div>'+
    (INIT.auto ? '<p class="sp-skip">اضغط للمتابعة</p>' : '<button class="sp-cta" type="button">'+(INIT.cta||'ابدأ رحلتك')+'</button>');
  game.appendChild(ui);
  let started = false; const go = ()=>{ if(started) return; started = true; toRN({type:'start'}); };
  const cta = ui.querySelector('.sp-cta'); if(cta) cta.onclick = go;
  if(INIT.auto) document.addEventListener('click', go);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ root.classList.add('go'); ui.classList.add('t0'); }));
  setTimeout(()=>ui.classList.add('t1'), 700);
  setTimeout(()=>ui.classList.add('t2'), 1500);
  setTimeout(()=>{ $('tint').style.backgroundColor = 'rgba(46,18,60,.2)';
    const n = Math.min(12, cur().lanterns); let k = 0;
    const iv = setInterval(()=>{ k++; W.litCount = k; const lp = LANTERN_POS[k-1];
      if(lp) spawn('spark', lp.x, lp.y-9, 5, {jx:3, jy:3, smin:.01, smax:.03, lmin:500, lmax:900, rmin:.7, rmax:1.3});
      if(k>=n) clearInterval(iv); }, 160); }, 2100);
  setTimeout(()=>ui.classList.add('t3'), 3300);
  if(INIT.auto) setTimeout(go, 4600);
}""")
# lantern glow and fireflies during the splash
rep("if(t==='night' || W.ignite){", "if(t==='night' || W.ignite || W.glowAll){")
rep("if(t!=='night') { if(W.ignite && W.ignite.k===k)", "if(W.glowAll && k>=W.litCount) continue;\n      if(t!=='night' && !W.glowAll) { if(W.ignite && W.ignite.k===k)")
rep("if(t==='night' && live){\n    fctx.globalCompositeOperation = 'lighter';", "if((t==='night' || W.glowAll) && live){\n    fctx.globalCompositeOperation = 'lighter';")
# hero card crops the scene around the spring
rep("SC = Math.max(w/400, h/760); OX = (w-400*SC)/2; OY = h-760*SC;",
    "if(MODE==='hero'){ SC = Math.max(w/400, h/400); OX = (w-400*SC)/2; OY = (h-400*SC)/2 - 140*SC; }\n  else if(MODE==='splash'){ SC = Math.max(w/400, h/880); OX = (w-400*SC)/2; OY = h-760*SC; }\n  else { SC = Math.max(w/400, h/760); OX = (w-400*SC)/2; OY = h-760*SC; }")
# richer three-stop sunset sky
rep('''<stop offset="0" stop-color="\'+s1+\'"/><stop offset=".42" stop-color="\'+s2+\'"/></linearGradient>''', '''<stop offset="0" stop-color="\'+s1+\'"/>\'+(t===\'sunset\'?\'<stop offset=".2" stop-color="#6a3a6e"/><stop offset=".33" stop-color="#d9715a"/>\':\'\')+\'<stop offset=".42" stop-color="\'+s2+\'"/></linearGradient>''')
rep("const SKY = { dawn:['#5f6fa3','#f0b48c'], day:['#7fbfd8','#f4e3ba'], sunset:['#384a7a','#f19a58'], night:['#081630','#1f3459'] };", "const SKY = { dawn:['#5f6fa3','#f0b48c'], day:['#7fbfd8','#f4e3ba'], sunset:['#1d2357','#f6b26a'], night:['#081630','#1f3459'] };")
rep("if(BRIDGE) document.documentElement.classList.add('is-bridge');", "if(BRIDGE) document.documentElement.classList.add('is-bridge');\nif(MODE==='hero') document.addEventListener('DOMContentLoaded', ()=>{ ['bg','mid'].forEach(id=>{ const el=document.getElementById(id); el.setAttribute('viewBox','0 140 400 400'); el.setAttribute('preserveAspectRatio','xMidYMid slice'); }); });")

rep("if(MODE==='hero') document.addEventListener('DOMContentLoaded', ()=>{", "if(MODE==='splash') document.addEventListener('DOMContentLoaded', ()=>{ ['bg','mid'].forEach(id=>document.getElementById(id).setAttribute('viewBox','0 -120 400 880')); });\nif(MODE==='hero') document.addEventListener('DOMContentLoaded', ()=>{")
rep("    if(t==='night'){\n      STARS.forEach(st=>{ ectx.globalAlpha = live ?", "    if(t==='night' || W.glowAll){\n      STARS.forEach(st=>{ ectx.globalAlpha = (W.glowAll?.55:1) * (live ?")
rep(".45+.45*Math.sin(now/650+st[3]) : .8; ectx.fillStyle='#fff';", ".45+.45*Math.sin(now/650+st[3]) : .8); ectx.fillStyle='#fff';")
html = src
ts = '// Generated by scripts/build-oasis-html.py from the standalone oasis prototype. Do not edit by hand.\n' \
     '/* eslint-disable */\nexport const OASIS_HTML: string = ' + json.dumps(html, ensure_ascii=False) + ';\n'
out.write_text(ts)
pathlib.Path(str(out).replace('.ts','.html')).write_text(html) if len(sys.argv)>3 else None
print('wrote', out, len(ts))
