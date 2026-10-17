/* SHNaZ Lab shared tools: Jeff's color wheel legend + highlight-and-correct.
   Concept & design: Jeff SHNaZLab. Strand colors come from shared/highlight.js (SHNHighlight.COLORS);
   the log is a SHA-256 hash chain from shared/bank.js (SHNBank.chain). Everything stays on this device. */
(function(){
  "use strict";
  if(window.SZTools)return;
  var STRANDS=[["green","Authorship / site"],["red","Needs review"],["orange","Warning"],["yellow","To confirm"],["blue","Method"],["purple","Machine"]];
  function C(){return (window.SHNHighlight&&SHNHighlight.COLORS)||{green:{hex:"#1f9d55",bg:"rgba(31,157,85,.28)"},red:{hex:"#d64545",bg:"rgba(214,69,69,.26)"},orange:{hex:"#e8820c",bg:"rgba(232,130,12,.28)"},yellow:{hex:"#d4a900",bg:"rgba(245,200,0,.38)"},blue:{hex:"#2f6fd6",bg:"rgba(47,111,214,.24)"},purple:{hex:"#8a4fd0",bg:"rgba(138,79,208,.24)"}}}
  function bg(colors){var c=colors.map(function(k){return (C()[k]||C().yellow).bg});if(c.length===1)return c[0];var st=100/c.length,p=[];c.forEach(function(x,i){p.push(x+" "+(i*st)+"%",x+" "+((i+1)*st)+"%")});return "linear-gradient(135deg,"+p.join(",")+")"}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function mt(ts){try{return new Date(ts).toLocaleString("en-US",{timeZone:"America/Denver",dateStyle:"medium",timeStyle:"short"})+" MT"}catch(e){return ts}}
  var KEY="sz-hl:"+location.pathname.replace(/index\.html$/,"");
  var chain=null;function ch(){if(!chain&&window.SHNBank)chain=SHNBank.chain(KEY);return chain}
  var ui={},pending=null,picked=["green"];
  function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
  function inTool(n){while(n){if(n.nodeType===1&&(n.classList.contains("sz-sheet")||n.classList.contains("sz-fab")||n.classList.contains("sz-nav")))return true;n=n.parentNode}return false}
  function legendHTML(){return STRANDS.map(function(s){return '<div class="sz-legend-row"><i style="background:'+C()[s[0]].hex+'"></i><b>'+s[0]+'</b>&nbsp;= '+s[1]+'</div>'}).join("")+'<div class="sz-legend-row"><i style="background:'+bg(["green","orange","blue"])+'"></i><b>merged stripes</b>&nbsp;= merged ideas</div>'}
  function build(){
    ui.wheel=el("button","sz-fab wheel");ui.wheel.type="button";ui.wheel.title="Color wheel legend";ui.wheel.setAttribute("aria-label","Color wheel legend");
    ui.hl=el("button","sz-fab hl","✎");ui.hl.type="button";ui.hl.setAttribute("aria-label","Highlight selected text");
    ui.log=el("button","sz-fab log","☰");ui.log.type="button";ui.log.setAttribute("aria-label","Highlight log");ui.log.title="Highlights & corrections log";
    ui.sheet=el("div","sz-sheet");ui.sheet.setAttribute("role","dialog");
    [ui.wheel,ui.hl,ui.log,ui.sheet].forEach(function(x){document.body.appendChild(x)});
    ui.wheel.onclick=function(){openSheet('<button class="sz-x" data-x>×</button><h3>The wheel: what each color means</h3>'+legendHTML()+'<p class="sz-mut" style="margin-top:8px">Select any text on this page, then tap ✎ to highlight it with a strand, say why, and suggest a correction. Red only means "needs review". Warnings are orange or yellow.</p>')};
    ui.log.onclick=showLog;
    ui.hl.onmousedown=function(e){e.preventDefault()};
    ui.hl.onclick=startHighlight;
    ui.sheet.addEventListener("click",onSheet);
    document.addEventListener("selectionchange",function(){var s=getSelection();var ok=s&&s.rangeCount&&!s.isCollapsed&&String(s).trim().length>0&&!inTool(s.anchorNode)&&!isField(s.anchorNode);ui.hl.classList.toggle("show",!!ok);if(ok)pending=s.getRangeAt(0).cloneRange()});
  }
  function isField(n){n=n&&(n.nodeType===1?n:n.parentNode);return !!(n&&n.closest&&n.closest("input,textarea,select,[contenteditable]"))}
  function openSheet(h){ui.sheet.innerHTML=h;ui.sheet.classList.add("open")}
  function closeSheet(){ui.sheet.classList.remove("open")}
  function strandsHTML(){return STRANDS.map(function(s){return '<button type="button" class="sz-strand" data-strand="'+s[0]+'" aria-pressed="'+(picked.indexOf(s[0])>=0)+'"><i style="background:'+C()[s[0]].hex+'"></i>'+s[0]+'</button>'}).join("")}
  function startHighlight(){if(!pending)return;var text=String(pending.toString()).trim().slice(0,500);if(!text)return;
    openSheet('<button class="sz-x" data-x>×</button><h3>Highlight &amp; correct</h3><p>“'+esc(text.slice(0,160))+(text.length>160?'…':'')+'”</p><div class="sz-kicker">Strand (pick 2+ to merge)</div><div id="sz-strands">'+strandsHTML()+'</div>'+
      '<div class="sz-kicker" style="margin-top:8px">Why this?</div><textarea id="sz-why" rows="2" placeholder="Why does this deserve this color?"></textarea>'+
      '<div class="sz-kicker">Suggest a correction (optional)</div><textarea id="sz-fix" rows="2" placeholder="What should it say instead?"></textarea><button type="button" class="sz-btn" data-save>Save highlight</button> <span class="sz-mut">Saved on this device, hash-chained.</span>')}
  function wrap(range,id,colors){try{var m=document.createElement("mark");m.className="sz-hl";m.dataset.szid=id;m.style.background=bg(colors);m.appendChild(range.extractContents());range.insertNode(m);return true}catch(e){return false}}
  function onSheet(e){var t=e.target.closest("button");if(!t)return;
    if(t.hasAttribute("data-x"))return closeSheet();
    if(t.dataset.strand){var k=t.dataset.strand,i=picked.indexOf(k);if(i>=0){if(picked.length>1)picked.splice(i,1)}else picked.push(k);document.getElementById("sz-strands").innerHTML=strandsHTML();return}
    if(t.hasAttribute("data-save")){var c=ch();if(!c||!pending)return;var text=String(pending.toString()).trim().slice(0,500);var id="h"+Date.now().toString(36);
      var data={id:id,page:location.pathname,text:text,colors:picked.slice(),why:document.getElementById("sz-why").value.trim(),correction:document.getElementById("sz-fix").value.trim(),theme:document.documentElement.getAttribute("data-sz-theme")};
      wrap(pending,id,data.colors);pending=null;getSelection().removeAllRanges();ui.hl.classList.remove("show");
      c.append("highlight.deposited",data).then(function(){openSheet('<button class="sz-x" data-x>×</button><h3>Saved ✓</h3><p class="sz-mut">Record #'+(c.records.length-1)+' · '+mt(Date.now())+'</p><p class="sz-mono">sha256 '+c.records[c.records.length-1].hash+'</p>')});return}
    if(t.hasAttribute("data-verify")){var c2=ch();c2.verify().then(function(r){var o=document.getElementById("sz-vres");if(o)o.innerHTML=r.ok?'<span style="color:var(--sz-ok)">✓ Chain intact ('+r.n+' records)</span>':'<span class="sz-review">Chain broken at #'+r.at+' — needs review</span>'});return}
    if(t.hasAttribute("data-export")){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(ch().records,null,2)],{type:"application/json"}));a.download="highlights-"+KEY.replace(/[^a-z0-9]+/gi,"-")+".json";a.click();return}
  }
  function showLog(){var c=ch();var rs=c?c.records.filter(function(r){return r.type==="highlight.deposited"}):[];
    openSheet('<button class="sz-x" data-x>×</button><h3>Highlights &amp; corrections ('+rs.length+')</h3><button type="button" class="sz-btn ghost" data-verify>Verify chain</button> <button type="button" class="sz-btn ghost" data-export>Export</button><p id="sz-vres"></p>'+
      (rs.slice().reverse().map(function(r){var d=r.data;return '<div class="sz-card" style="padding:10px;margin:8px 0"><span style="background:'+bg(d.colors)+';border-radius:4px;padding:0 3px">'+esc(d.text.slice(0,140))+'</span><div class="sz-mut" style="margin-top:4px">'+d.colors.join(" + ")+' · '+mt(r.ts)+'</div>'+(d.why?'<div><b>Why this?</b> '+esc(d.why)+'</div>':'')+(d.correction?'<div><b>Suggested:</b> '+esc(d.correction)+'</div>':'')+'<div class="sz-mono sz-mut">#'+r.seq+' '+r.hash.slice(0,24)+'…</div></div>'}).join("")||'<p class="sz-mut">No highlights on this page yet. Select text, then tap ✎.</p>'))}
  function reapply(){var c=ch();if(!c)return;c.records.forEach(function(r){if(r.type!=="highlight.deposited"||document.querySelector('mark[data-szid="'+r.data.id+'"]'))return;var tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return inTool(n)||isField(n)||!n.parentNode||/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)?2:1}});var n;while((n=tw.nextNode())){var i=n.nodeValue.indexOf(r.data.text);if(i>=0){var rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,i+r.data.text.length);wrap(rg,r.data.id,r.data.colors);break}}})}
  document.addEventListener("click",function(e){var m=e.target.closest&&e.target.closest("mark.sz-hl");if(!m)return;var c=ch();var r=c&&c.records.find(function(x){return x.data&&x.data.id===m.dataset.szid});if(!r)return;var d=r.data;openSheet('<button class="sz-x" data-x>×</button><h3>'+d.colors.join(" + ")+'</h3><p>“'+esc(d.text)+'”</p>'+(d.why?'<p><b>Why this?</b> '+esc(d.why)+'</p>':'')+(d.correction?'<p><b>Suggested correction:</b> '+esc(d.correction)+'</p>':'')+'<p class="sz-mut">'+mt(r.ts)+' · #'+r.seq+'</p>')});
  function init(){build();reapply();setTimeout(reapply,1500)}
  window.SZTools={legendHTML:legendHTML,chain:ch,reapply:reapply,STRANDS:STRANDS};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
