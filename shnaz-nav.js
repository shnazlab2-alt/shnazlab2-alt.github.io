/* SHNaZ Lab shared ecosystem nav. One nav, every app. Concept: Jeff SHNaZLab. */
(function(){
  var APPS=[["/","SHNaZ Lab","sz-brand"],["/what-matters/","What Matters"],["/q-stamp/","Q Stamp"],["/q-stamp/apps-directory.html","Apps Directory"],["/mosaic/","Mosaic"],["/mosaic/daily/","Daily Tiles"],["/emotional-filter-gate/eruption-sample/","Filter Gate"]];
  var THEMES=[["dark","Dark"],["light","Light"],["neon","Neon"],["calm","Calm"]];
  var T="dark";try{T=localStorage.getItem("sz-theme")||"dark"}catch(e){}
  if(!THEMES.some(function(t){return t[0]===T}))T="dark";
  document.documentElement.setAttribute("data-sz-theme",T);
  window.SZTheme={list:THEMES,get:function(){return document.documentElement.getAttribute("data-sz-theme")},set:function(t){document.documentElement.setAttribute("data-sz-theme",t);try{localStorage.setItem("sz-theme",t)}catch(e){}var s=document.querySelector(".sz-theme");if(s)s.value=t}};
  window.addEventListener("storage",function(e){if(e.key==="sz-theme"&&e.newValue)SZTheme.set(e.newValue)});
  var ROOT=(location.protocol==="file:")?"https://shnazlab2-alt.github.io":"";
  (document.currentScript&&document.currentScript.dataset.root!=null)&&(ROOT=document.currentScript.dataset.root);
  function load(src){var x=document.createElement("script");x.src=src;x.async=false;document.head.appendChild(x)}
  var OWN=document.currentScript&&document.currentScript.dataset.shared==="0"; /* page ships its own highlight.js/bank.js */
  if(!OWN&&!window.SHNHighlight)load(ROOT+"/shared/highlight.js");
  if(!OWN&&!window.SHNBank)load(ROOT+"/shared/bank.js");
  load(ROOT+"/shnaz-tools.js");
  function mount(){
    if(document.querySelector(".sz-nav"))return;
    var base=(location.protocol==="file:")?"https://shnazlab2-alt.github.io":"";if(ROOT&&ROOT.indexOf("http")===0)base=ROOT;
    var here=location.pathname.replace(/index\.html$/,"");
    var n=document.createElement("nav");n.className="sz-nav";n.setAttribute("aria-label","SHNaZ Lab apps");
    APPS.forEach(function(a){var l=document.createElement("a");l.href=base+a[0];l.textContent=a[1];if(a[2])l.className=a[2];
      if(!a[2]&&(here===a[0]||(a[0].length>1&&here.indexOf(a[0])===0&&!APPS.some(function(b){return b[0].length>a[0].length&&here.indexOf(b[0])===0}))))l.classList.add("on");n.appendChild(l)});
    var sel=document.createElement("select");sel.className="sz-theme";sel.setAttribute("aria-label","Theme");
    THEMES.forEach(function(t){var o=document.createElement("option");o.value=t[0];o.textContent="🎨 "+t[1];sel.appendChild(o)});
    sel.value=SZTheme.get();sel.onchange=function(){SZTheme.set(sel.value)};n.appendChild(sel);
    document.body.insertBefore(n,document.body.firstChild);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();

/* ---------- Question Wheel (2026-10-17) — concept: Jeff SHNaZLab ----------
   A spinning, tappable category wheel that pops up one meaningful question.
   Answer anonymously or privately, vote, and see the tally (kept on this device for now).
   Cadence: pops up once on your first visit to any SHNaZ Lab app, then only when you tap ❓ Q-Wheel. */
(function(){
  "use strict";
  if(window.SZQWheel)return;
  var CATS=[["truth","Truth","#8b5cf6"],["connection","Connection","#f472b6"],["joy","Joy","#facc15"],["wellness","Wellness","#39ff88"],["collab","Collaboration","#38bdf8"],["creativity","Creativity","#fb923c"],["civic","Civic voice","#e8b923"],["tech","Tech & AI","#a78bfa"]];
  var JEFF="Jeff SHNaZLab",AI="SI/AI";
  var V3=["Yes","Maybe","No"];
  var Q=[
   ["civic","What if you had a voice, centralized, organized, categorized, that you could be asked to have a say in?",JEFF,["I'd use it daily","Only for big things","I'd want to see it first","Not for me"]],
   ["civic","If one question from you reached every city council tomorrow, what would it be about?",AI,["Housing","Safety","Schools","Something else"]],
   ["civic","Should people be asked before a decision about their street is made — not after?",AI,V3],
   ["truth","When was the last time you changed your mind because of evidence?",AI,["This week","This year","Long ago","Can't remember"]],
   ["truth","Would you rather hear a hard truth today or a kind story that isn't quite true?",AI,["Hard truth","Kind story","Depends who tells it"]],
   ["truth","Should every idea online show who had it first, and when?",AI,V3],
   ["connection","Who would you call at 3 a.m. — and do they know that?",AI,["Yes, they know","They might","I should tell them","No one yet"]],
   ["connection","What is one thing you wish people asked you more often?",AI,["How I really am","What I think","What I'm making","What I need"]],
   ["connection","Do you feel more connected after scrolling, or less?",AI,["More","Less","The same"]],
   ["joy","What small thing made you smile this week?",AI,["A person","A place","A moment alone","Something I made"]],
   ["joy","Do you make time for joy, or wait for it to find you?",AI,["I make time","I wait","Both","Neither lately"]],
   ["joy","If today had a soundtrack, what would the first song feel like?",AI,["Upbeat","Calm","Bittersweet","Loud"]],
   ["wellness","How rested do you feel, honestly, on a scale of tired to ready?",AI,["Ready","Okay","Tired","Running on empty"]],
   ["wellness","What does your body need right now that you keep postponing?",AI,["Sleep","Movement","Food","Stillness"]],
   ["wellness","Is your phone a tool you use, or a place you live?",AI,["A tool","A place","Both"]],
   ["collab","What's easier for you: asking for help or offering it?",AI,["Asking","Offering","Both are hard","Both are easy"]],
   ["collab","Should teams vote on ideas without knowing whose idea it was?",AI,V3],
   ["collab","What would you build if five strangers joined you for a month?",AI,["Something for my town","An app","Art","A business"]],
   ["creativity","What idea of yours have you never said out loud?",AI,["A business","A story","An invention","A change in my life"]],
   ["creativity","Do you create more when you're happy or when you're struggling?",AI,["Happy","Struggling","Both","Neither"]],
   ["creativity","Should the original creator always get credit, even when someone improves the idea?",AI,V3],
   ["tech","Should AI have to say when it wrote something?",AI,V3],
   ["tech","Would you let an AI help decide something important for you if you could see exactly why it chose?",AI,["Yes","Only small things","No"]],
   ["tech","Who should own the record of your ideas: you, the platform, or no one?",AI,["Me","The platform","No one","Shared"]]
  ];
  var K="sz-qw-v1";
  function st(){var s;try{s=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}s=s||{};s.votes=s.votes||{};s.answers=s.answers||[];s.mine=s.mine||{};return s}
  function save(s){try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}}
  function esc(x){return String(x).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function css(){if(document.getElementById("sz-qw-css"))return;var c=document.createElement("style");c.id="sz-qw-css";c.textContent=
   ".sz-qw-bg{position:fixed;inset:0;z-index:1100;background:rgba(3,3,12,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:none;align-items:flex-end;justify-content:center}"+
   ".sz-qw-bg.open{display:flex}.sz-qw{width:100%;max-width:520px;max-height:92vh;overflow:auto;background:var(--sz-card,#14142e);color:var(--sz-tx,#f2f0ff);border:1px solid var(--sz-line);border-radius:22px 22px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom));font:15px/1.45 var(--sz-font,system-ui);box-shadow:0 -20px 60px rgba(0,0,0,.5)}"+
   ".sz-qw h2{margin:4px 0 10px;font:900 22px/1.2 var(--sz-font);letter-spacing:-.01em}.sz-qw .x{float:right;background:none;border:0;color:var(--sz-mu);font-size:24px;cursor:pointer}"+
   ".sz-qw-wheelwrap{position:relative;width:250px;height:250px;margin:6px auto 4px}.sz-qw-wheel{width:250px;height:250px;transition:transform 2.2s cubic-bezier(.17,.67,.21,1)}"+
   ".sz-qw-wheel path{cursor:pointer;stroke:var(--sz-card,#14142e);stroke-width:2}.sz-qw-wheel text{font:800 10px var(--sz-font,system-ui);fill:#120c00;pointer-events:none}"+
   ".sz-qw-ptr{position:absolute;left:50%;top:-6px;transform:translateX(-50%);width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:20px solid var(--sz-gold,#e8b923);filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))}"+
   ".sz-qw-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:70px;height:70px;border-radius:50%;border:0;background:var(--sz-gold-grad,#e8b923);color:var(--sz-gold-tx,#2a1a00);font:900 15px var(--sz-font);cursor:pointer;box-shadow:var(--sz-gold-glow)}"+
   ".sz-qw-card{border:1px solid var(--sz-line);border-radius:18px;padding:14px;margin-top:10px;background:linear-gradient(180deg,var(--sz-card2,#1b1b3d),var(--sz-card,#14142e))}"+
   ".sz-qw-q{font:800 19px/1.3 var(--sz-font);margin:6px 0 10px}.sz-qw-by{display:inline-block;font:700 11px var(--sz-font);padding:3px 9px;border-radius:999px;border:1px solid var(--sz-line);color:var(--sz-mu)}"+
   ".sz-qw-by.ai{color:var(--sz-cy,#38bdf8);border-color:rgba(56,189,248,.45)}.sz-qw-opt{display:block;width:100%;text-align:left;margin:6px 0;padding:11px 12px;border-radius:14px;border:1px solid var(--sz-line);background:var(--sz-input,#0b0b22);color:var(--sz-tx);font:700 14px var(--sz-font);cursor:pointer;position:relative;overflow:hidden}"+
   ".sz-qw-opt i{position:absolute;left:0;top:0;bottom:0;background:rgba(232,185,35,.22);pointer-events:none}.sz-qw-opt span{position:relative}.sz-qw-opt b{float:right;position:relative}.sz-qw-opt.mine{border-color:var(--sz-ok,#39ff88)}"+
   ".sz-qw textarea{width:100%;box-sizing:border-box;padding:10px;border-radius:12px;border:1px solid var(--sz-line);background:var(--sz-input);color:var(--sz-tx);font:14px var(--sz-font);margin:6px 0}"+
   ".sz-qw-mode{display:flex;gap:6px;margin:4px 0 8px}.sz-qw-mode label{flex:1;border:1px solid var(--sz-line);border-radius:12px;padding:8px;font:700 12px var(--sz-font);text-align:center;cursor:pointer}.sz-qw-mode input{margin-right:4px}"+
   ".sz-qw .row2{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.sz-nav a.sz-qwbtn{color:var(--sz-tx);border-color:var(--sz-gold,#e8b923)}";document.head.appendChild(c)}
  var ui=null,rot=0,cur=null;
  function wheelSVG(){var n=CATS.length,R=120,c=125,out="";CATS.forEach(function(k,i){var a0=(i/n)*2*Math.PI-Math.PI/2,a1=((i+1)/n)*2*Math.PI-Math.PI/2;var x0=c+R*Math.cos(a0),y0=c+R*Math.sin(a0),x1=c+R*Math.cos(a1),y1=c+R*Math.sin(a1);var am=(a0+a1)/2,tx=c+R*.66*Math.cos(am),ty=c+R*.66*Math.sin(am);var deg=am*180/Math.PI+90;
    out+='<path data-cat="'+k[0]+'" d="M'+c+','+c+' L'+x0.toFixed(1)+','+y0.toFixed(1)+' A'+R+','+R+' 0 0,1 '+x1.toFixed(1)+','+y1.toFixed(1)+' Z" fill="'+k[2]+'"><title>'+k[1]+'</title></path><text x="'+tx.toFixed(1)+'" y="'+ty.toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" transform="rotate('+deg.toFixed(1)+' '+tx.toFixed(1)+' '+ty.toFixed(1)+')">'+esc(k[1])+'</text>'});
    return '<svg class="sz-qw-wheel" viewBox="0 0 250 250" role="img" aria-label="Question categories">'+out+'</svg>'}
  function build(){if(ui)return;css();ui=document.createElement("div");ui.className="sz-qw-bg";ui.innerHTML='<div class="sz-qw" role="dialog" aria-label="Question Wheel"><button class="x" data-qw="close" aria-label="Close">×</button><div class="sz-kicker">Question Wheel · <span class="sz-q">Q</span></div><h2>Spin, or tap a color</h2><div class="sz-qw-wheelwrap"><div class="sz-qw-ptr"></div>'+wheelSVG()+'<button class="sz-qw-hub" data-qw="spin">SPIN</button></div><div id="sz-qw-card"></div><p class="sz-mut" style="font-size:12px;margin-top:10px">Answers and votes stay on this device for now. Anonymous answers are saved without being linked to your history. This wheel opens by itself only on your first visit; after that, tap ❓ Q-Wheel.</p></div>';
    document.body.appendChild(ui);ui.addEventListener("click",onClick)}
  function pick(cat){var pool=Q.map(function(q,i){return i}).filter(function(i){return !cat||Q[i][0]===cat});var s=st();var fresh=pool.filter(function(i){return s.mine[i]==null});var from=fresh.length?fresh:pool;return from[Math.floor(Math.random()*from.length)]}
  function spin(cat){var n=CATS.length,idx=cat?CATS.findIndex(function(c){return c[0]===cat}):Math.floor(Math.random()*n);var target=-(idx+.5)*(360/n);rot=rot-(rot%360)+360*4+target;var w=ui.querySelector(".sz-qw-wheel");w.style.transform="rotate("+rot+"deg)";
    var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;setTimeout(function(){show(pick(CATS[idx][0]))},reduce?50:2300)}
  function show(i){cur=i;var q=Q[i],s=st(),cat=CATS.find(function(c){return c[0]===q[0]}),v=s.votes[i]||{},tot=0;q[3].forEach(function(_,j){tot+=v[j]||0});var mine=s.mine[i];
    var ai=q[2]===AI;
    document.getElementById("sz-qw-card").innerHTML='<div class="sz-qw-card"><span class="sz-pill" style="background:'+cat[2]+';color:#120c00;border-color:transparent">'+esc(cat[1])+'</span> <span class="sz-qw-by'+(ai?' ai':'')+'">asked by '+esc(q[2])+'</span><div class="sz-qw-q">'+esc(q[1])+'</div>'+
     q[3].map(function(o,j){var n=v[j]||0,p=tot?Math.round(n/tot*100):0;return '<button type="button" class="sz-qw-opt'+(mine===j?' mine':'')+'" data-qw="vote" data-j="'+j+'">'+(mine!=null?'<i style="width:'+p+'%"></i>':'')+'<span>'+(mine===j?'✓ ':'')+esc(o)+'</span>'+(mine!=null?'<b>'+p+'% · '+n+'</b>':'')+'</button>'}).join("")+
     (mine!=null?'<p class="sz-mut" style="font-size:12px">Tally from this device: '+tot+' vote'+(tot===1?'':'s')+'. A shared tally across everyone comes later.</p>':'<p class="sz-mut" style="font-size:12px">Vote to see the tally.</p>')+
     '<textarea id="sz-qw-txt" rows="2" placeholder="Say more (optional)…"></textarea><div class="sz-qw-mode"><label><input type="radio" name="sz-qw-m" value="anonymous" checked>Anonymous</label><label><input type="radio" name="sz-qw-m" value="private">Private (my history)</label></div>'+
     '<div class="row2"><button type="button" class="sz-btn" data-qw="answer">Save answer</button><button type="button" class="sz-btn ghost" data-qw="next">Another question</button></div><div id="sz-qw-saved"></div>'+
     myHistory(i)+'</div>'}
  function myHistory(i){var a=st().answers.filter(function(x){return x.q===i&&x.mode==="private"});if(!a.length)return"";return '<details style="margin-top:8px"><summary>Your private answers ('+a.length+')</summary>'+a.map(function(x){return '<p>'+esc(x.text)+' <span class="sz-mut" style="font-size:11px">'+new Date(x.ts).toLocaleString("en-US",{timeZone:"America/Denver",dateStyle:"medium",timeStyle:"short"})+' MT</span></p>'}).join("")+'</details>'}
  function onClick(e){var t=e.target.closest("[data-qw],path[data-cat]");if(e.target===ui)return close();if(!t)return;
    if(t.dataset.cat)return spin(t.dataset.cat);var a=t.dataset.qw;
    if(a==="close")return close();if(a==="spin")return spin(null);if(a==="next")return show(pick(null));
    if(a==="vote"){var s=st();if(s.mine[cur]!=null)return;var j=+t.dataset.j;s.votes[cur]=s.votes[cur]||{};s.votes[cur][j]=(s.votes[cur][j]||0)+1;s.mine[cur]=j;save(s);return show(cur)}
    if(a==="answer"){var txt=(document.getElementById("sz-qw-txt").value||"").trim();if(!txt){document.getElementById("sz-qw-saved").innerHTML='<p class="sz-warn-tx" style="font-size:13px">Write a few words first.</p>';return}
      var mode=(ui.querySelector('input[name=sz-qw-m]:checked')||{}).value||"anonymous";var s2=st();var rec={q:cur,mode:mode,text:txt,ts:Date.now()};if(mode==="anonymous"){rec.ts=null;rec.day=new Date().toISOString().slice(0,10)}s2.answers.push(rec);save(s2);show(cur);
      document.getElementById("sz-qw-saved").innerHTML='<p style="color:var(--sz-ok);font-size:13px">✓ Saved '+(mode==="anonymous"?"anonymously (no time, not in your history)":"privately to your history")+'.</p>'}}
  function open(){build();ui.classList.add("open");if(cur==null)show(pick(null))}
  function close(){if(ui)ui.classList.remove("open")}
  function navBtn(){var n=document.querySelector(".sz-nav");if(!n||n.querySelector(".sz-qwbtn"))return;var b=document.createElement("a");b.href="#";b.className="sz-qwbtn";b.innerHTML='❓ <span class="sz-q">Q</span>-Wheel';b.onclick=function(e){e.preventDefault();open()};var sel=n.querySelector(".sz-theme");n.insertBefore(b,sel||null)}
  function init(){navBtn();var s=st();if(!s.seen){s.seen=new Date().toISOString();save(s);setTimeout(open,2500)}}
  window.SZQWheel={open:open,close:close,QUESTIONS:Q,CATEGORIES:CATS};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(init,0)});else setTimeout(init,0);
})();
