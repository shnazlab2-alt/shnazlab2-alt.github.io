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
