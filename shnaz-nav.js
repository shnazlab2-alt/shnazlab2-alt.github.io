/* SHNaZ Lab shared ecosystem nav. One nav, every app. Concept: Jeff SHNaZLab. */
(function(){
  var APPS=[["/","SHNaZ Lab","sz-brand"],["/what-matters/","What Matters"],["/q-stamp/","Q Stamp"],["/q-stamp/apps-directory.html","Apps Directory"],["/mosaic/","Mosaic"],["/mosaic/daily/","Daily Tiles"],["/emotional-filter-gate/eruption-sample/","Filter Gate"]];
  function mount(){
    if(document.querySelector(".sz-nav"))return;
    var base=(location.protocol==="file:")?"https://shnazlab2-alt.github.io":"";
    var here=location.pathname.replace(/index\.html$/,"");
    var n=document.createElement("nav");n.className="sz-nav";n.setAttribute("aria-label","SHNaZ Lab apps");
    APPS.forEach(function(a){var l=document.createElement("a");l.href=base+a[0];l.textContent=a[1];if(a[2])l.className=a[2];
      if(!a[2]&&(here===a[0]||(a[0].length>1&&here.indexOf(a[0])===0&&!APPS.some(function(b){return b[0].length>a[0].length&&here.indexOf(b[0])===0}))))l.classList.add("on");n.appendChild(l)});
    document.body.insertBefore(n,document.body.firstChild);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
