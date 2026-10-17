/*!
 * bank.js — SHNaZLab "Put it in the Bank" engine (vanilla JS, no dependencies)
 * Created by Jeff SHNaZLab · founder education project · 2026-10-16
 *
 * Every highlight, vote and suggestion becomes a DEPOSIT: a small record that is
 * fingerprinted with SHA-256 and chained to the one before it (like paper clips).
 * Works with highlight.js (SHNHighlight) but does not require it.
 *
 *   const chain = SHNBank.chain("my-lesson");          // localStorage-backed hash chain
 *   await chain.append("highlight.deposited", {...});   // add a deposit
 *   await SHNBank.verify(chain.records);                // {ok:true,n} or {ok:false,at}
 *   SHNBank.renderBank(el, chain.records);               // animated deposit cards
 *   SHNBank.explainer(el, chain.records);                // kid-friendly "how it works" + try-its
 *   SHNBank.legendBar(el);                               // always-visible color legend
 *   SHNBank.learn.start();                               // guided Learn mode
 *
 * Record hash rule (same as What Matters / Q Stamp):
 *   hash = SHA-256( prev + JSON.stringify({seq, ts, type, data}) ),  prev of #0 = "GENESIS"
 */
(function (global) {
  "use strict";

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  // Default color meanings (pages and lessons may relabel them).
  var COLOR_INFO = {
    green:  { hex: "#1f9d55", label: "Authorship",  kid: "Someone made this up: it's their original idea." },
    red:    { hex: "#d64545", label: "Review",      kid: "Check this! It's a claim that needs proof." },
    orange: { hex: "#e8820c", label: "Warning",     kid: "Careful: read this one kindly or carefully." },
    yellow: { hex: "#d4a900", label: "To confirm",  kid: "Not sure yet: waiting for the author to confirm." },
    blue:   { hex: "#2f6fd6", label: "Method",      kid: "A way of doing something, like a recipe step." },
    purple: { hex: "#8a4fd0", label: "Machine",     kid: "The computer worked this out, not a person's opinion." }
  };

  function sha(s) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, "0"); }).join("");
    });
  }
  function recordHash(prev, r) {
    return sha(prev + JSON.stringify({ seq: r.seq, ts: r.ts, type: r.type, data: r.data }));
  }

  // ---------- chain ----------
  function chain(key, opts) {
    opts = opts || {};
    var storeKey = "shnbank:" + key, self = { records: [], listeners: [] }, q = Promise.resolve();
    try { self.records = JSON.parse(localStorage.getItem(storeKey) || "[]"); } catch (e) { self.records = []; }
    self.save = function () { try { localStorage.setItem(storeKey, JSON.stringify(self.records)); } catch (e) {} };
    self.append = function (type, data) {
      q = q.then(function () {
        var prev = self.records.length ? self.records[self.records.length - 1].hash : "GENESIS";
        var r = { seq: self.records.length, ts: new Date().toISOString(), type: type, data: data, prev: prev };
        return recordHash(prev, r).then(function (h) {
          r.hash = h; self.records.push(r); self.save();
          self.listeners.forEach(function (fn) { fn(r); });
          return r;
        });
      });
      return q;
    };
    self.onDeposit = function (fn) { self.listeners.push(fn); };
    self.reset = function () { self.records = []; self.save(); };
    self.verify = function () { return verify(self.records); };
    return self;
  }

  function verify(records) {
    var prev = "GENESIS", i = 0;
    function step() {
      if (i >= records.length) return Promise.resolve({ ok: true, n: records.length });
      var r = records[i];
      return recordHash(prev, r).then(function (h) {
        if (r.prev !== prev || h !== r.hash) return { ok: false, at: r.seq };
        prev = r.hash; i++; return step();
      });
    }
    return step();
  }

  // ---------- time ----------
  function fmtMT(ts) {
    try {
      return new Date(ts).toLocaleString("en-US", { timeZone: "America/Denver", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" }) + " MT";
    } catch (e) { return ts; }
  }

  // ---------- plain English ----------
  var TYPE_TITLE = {
    "piece.stamped": "📜 The whole text was stamped",
    "lesson.stamped": "📜 The whole lesson was stamped",
    "codeword.logged": "🔤 A code word was logged",
    "highlight.deposited": "🖍 A highlight was put in the bank",
    "word.vote": "👍 A vote on a word",
    "suggestion.deposited": "💡 A better-word suggestion",
    "question.vote": "🙋 A vote on a question",
    "votes.reset": "↩️ Votes were reset on this device",
    "inspiration.checked": "🔎 An inspiration credibility check"
  };
  function colorLine(colors) {
    return (colors || []).map(function (c) {
      var i = COLOR_INFO[c] || { hex: "#888", label: c };
      return "<span class='shnb-chip' style='background:" + i.hex + "'>" + esc(c) + " = " + esc(i.label) + "</span>";
    }).join(" ");
  }
  function short(h) { return h ? h.slice(0, 12) + "…" : "—"; }

  function english(r) {
    var d = r.data || {}, out = [];
    var add = function (k, v) { if (v !== undefined && v !== null && v !== "") out.push("<div class='shnb-kv'><span>" + k + "</span><span>" + v + "</span></div>"); };
    add("When", esc(fmtMT(r.ts)));
    if (r.type === "highlight.deposited" || r.type === "codeword.logged") {
      add("Word", "<b>“" + esc(d.word) + "”</b>");
      add("Decoded meaning", esc(d.decoded || d.meaning || ""));
      add("Color", colorLine(d.colors));
      add("Strand", esc(d.strand || (d.colors || []).join(" + ")));
      add("Why", esc(d.why || ""));
      if (d.confidence != null) add("Confidence", d.confidence + "%  <small>(how sure the color is right)</small>");
      if (d.credibility != null) add("Credibility", d.credibility + "%  <small>(how well-supported it is)</small>");
    } else if (r.type === "inspiration.checked") {
      add("Rule", "<code>" + esc(d.rule) + "</code>");
      add("Whose", esc(d.whose || ""));
      if (d.occurrences != null) add("Tagged in text", d.occurrences + "× (" + esc((d.terms || []).join(", ")) + ")");
      add("Source", d.source ? esc(d.source) : "❓ awaiting");
      add("Credit", d.credit ? esc(d.credit) : "❓ awaiting");
      add("Date", d.date ? esc(d.date) : "❓ awaiting");
      add("Status", d.complete ? "✅ complete" : "⏳ waiting on " + esc((d.missing || []).join(" + ")));
    } else if (r.type === "word.vote") {
      add("Word", "<b>“" + esc(d.word || d.annotation) + "”</b>");
      add("Tally now", "👍 " + d.agree + " · 👎 " + d.disagree);
    } else if (r.type === "suggestion.deposited") {
      add("Word", "<b>“" + esc(d.word || d.annotation) + "”</b>");
      add("Suggested", d.suggestion == null ? "<i>suggestion vote withdrawn</i>" : "“" + esc(d.suggestion) + "”");
      if (d.votes != null) add("Votes for it", String(d.votes));
    } else if (r.type === "question.vote") {
      add("Question", esc(d.title || d.question));
      add("Vote", esc(d.type) + " → now " + d.count);
    } else if (r.type === "piece.stamped" || r.type === "lesson.stamped") {
      add("Title / id", esc(d.title || d.id || ""));
      add("Author", esc(d.author || ""));
      add("Text fingerprint", "<span class='shnb-mono'>" + short(d.sha256) + "</span>");
    } else {
      Object.keys(d).forEach(function (k) { add(esc(k), esc(typeof d[k] === "object" ? JSON.stringify(d[k]) : d[k])); });
    }
    add("Previous hash", "<span class='shnb-mono'>" + esc(short(r.prev)) + "</span> <small>(the coin before this one)</small>");
    add("This hash", "<span class='shnb-mono'>" + esc(short(r.hash)) + "</span> <small>(this coin's fingerprint)</small>");
    return out.join("");
  }

  // ---------- code view (clean, commented JS object) ----------
  var COMMENTS = {
    seq: "position in the chain (0 = the very first deposit)",
    ts: "when it landed, ISO time in UTC",
    type: "what kind of deposit this is",
    data: "the facts being saved",
    prev: "hash of the deposit right before this one",
    hash: "SHA-256(prev + JSON of seq, ts, type, data)",
    id: "short name the computer uses",
    word: "the highlighted word",
    coded: "how it's spelled in code-speak",
    decoded: "what it means in plain words",
    meaning: "what it means in plain words",
    confirmed: "true = the author confirmed the meaning",
    colors: "color signals on this word",
    colorMeanings: "what each color means",
    strand: "the color mix, written out",
    why: "the reason it got this color",
    confidence: "0-100: how sure the color is right",
    credibility: "0-100: how well-supported it is",
    annotation: "which highlight was voted on",
    agree: "total 👍 on this device",
    disagree: "total 👎 on this device",
    suggestion: "the better word that got the vote",
    votes: "votes for that suggestion",
    question: "which question",
    title: "the question or lesson title",
    count: "new total for this vote type",
    author: "who wrote it",
    written: "when it was written",
    status: "claimed = author says it's theirs",
    sha256: "fingerprint of the saved text",
    rule: "the rule this deposit had to follow",
    whose: "whose inspiration this is",
    terms: "which words triggered the rule",
    occurrences: "how many times they appear",
    source: "where did the info come from?",
    credit: "who gets named?",
    date: "when?",
    complete: "true = source + credit + date all present",
    missing: "what's still needed"
  };
  function val(v) {
    var s = JSON.stringify(v);
    var cls = typeof v === "number" ? "n" : typeof v === "boolean" ? "b" : v === null ? "b" : "s";
    return "<span class='shnb-" + cls + "'>" + esc(s) + "</span>";
  }
  function line(indent, k, v, last) {
    var c = COMMENTS[k];
    return indent + "<span class='shnb-k'>" + esc(k) + "</span>: " + val(v) + (last ? "" : ",") +
      (c ? "  <span class='shnb-c'>// " + esc(c) + "</span>" : "") + "\n";
  }
  function code(r) {
    var d = r.data || {}, keys = Object.keys(d), s = "";
    s += "<span class='shnb-c'>// Deposit #" + r.seq + ": " + esc((TYPE_TITLE[r.type] || r.type).replace(/^\S+\s/, "")) + "</span>\n";
    s += "<span class='shnb-kw'>const</span> deposit = {\n";
    s += line("  ", "seq", r.seq) + line("  ", "ts", r.ts) + line("  ", "type", r.type);
    s += "  <span class='shnb-k'>data</span>: {  <span class='shnb-c'>// " + COMMENTS.data + "</span>\n";
    keys.forEach(function (k, i) { s += line("    ", k, d[k], i === keys.length - 1); });
    s += "  },\n" + line("  ", "prev", r.prev) + line("  ", "hash", r.hash, true) + "};";
    return s;
  }

  // ---------- CSS ----------
  var CSS = [
    ".shnb-legend{display:flex;gap:6px;overflow-x:auto;padding:6px 12px;border-bottom:1px solid #eadfd2;background:#fbf7f0;-webkit-overflow-scrolling:touch}",
    ".shnb-legend button{flex:none;border:0;border-radius:999px;padding:4px 10px;font:600 12px/1.4 system-ui,sans-serif;color:#fff;cursor:pointer}",
    ".shnb-legend .merged{background:linear-gradient(135deg,#1f9d55 0 33%,#e8820c 33% 66%,#2f6fd6 66%)}",
    ".shnb-legend-tip{font:12px/1.4 system-ui,sans-serif;color:#5a4f46;padding:0 12px 6px;background:#fbf7f0;min-height:0}",
    ".shnb-card{background:#fff;border-radius:14px;padding:12px;margin:10px 0;box-shadow:0 1px 3px rgba(60,40,20,.1);border-left:5px solid #1f9d55;position:relative}",
    ".shnb-card h4{margin:0 0 6px;font-size:1rem;display:flex;justify-content:space-between;gap:8px}",
    ".shnb-card h4 small{color:#7a6f66;font-weight:400}",
    ".shnb-landing{animation:shnb-land .7s cubic-bezier(.2,1.4,.4,1) both}",
    ".shnb-landing::after{content:'🪙';position:absolute;right:12px;top:-6px;font-size:22px;animation:shnb-coin .9s ease-in both}",
    "@keyframes shnb-land{0%{opacity:0;transform:translateY(-36px) scale(.94)}70%{opacity:1;transform:translateY(4px) scale(1.01)}100%{transform:none}}",
    "@keyframes shnb-coin{0%{opacity:1;transform:translateY(-30px)}80%{opacity:1;transform:translateY(8px)}100%{opacity:0;transform:translateY(14px)}}",
    "@media (prefers-reduced-motion:reduce){.shnb-landing,.shnb-landing::after{animation:none}}",
    ".shnb-seg{display:flex;border:1px solid #d9ccbd;border-radius:10px;overflow:hidden;margin:6px 0 8px}",
    ".shnb-seg button{flex:1;border:0;background:#fff;padding:8px 4px;font:600 13px system-ui,sans-serif;min-height:40px;cursor:pointer}.shnb-seg button.on{background:#2e9e5b;color:#fff}",
    ".shnb-body{display:grid;gap:10px}.shnb-body.both{grid-template-columns:1fr 1fr}",
    "@media(max-width:560px){.shnb-body.both{grid-template-columns:1fr}}",
    ".shnb-body .en,.shnb-body .cd{min-width:0}.shnb-body.en-only .cd,.shnb-body.cd-only .en{display:none}",
    ".shnb-kv{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid #f0e8de;font-size:.88rem}.shnb-kv>span:first-child{color:#7a6f66;flex:none}.shnb-kv>span:last-child{text-align:right}",
    ".shnb-pre{margin:0;background:#0f1712;color:#cfe9d8;border-radius:10px;padding:10px;overflow-x:auto;font:11.5px/1.5 ui-monospace,Menlo,monospace;white-space:pre}",
    ".shnb-k{color:#9ad1ff}.shnb-s{color:#f5d76e}.shnb-n{color:#ffad7a}.shnb-b{color:#d59bff}.shnb-c{color:#7fa58c;font-style:italic}.shnb-kw{color:#ff8fb1}",
    ".shnb-chip{display:inline-block;color:#fff;border-radius:999px;padding:0 8px;font-size:.75rem;font-weight:700;margin:1px 0}",
    ".shnb-mono{font-family:ui-monospace,Menlo,monospace;font-size:.8rem}",
    ".shnb-toast{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);background:#0f2a1a;color:#e8f5ec;border:2px solid #2e9e5b;border-radius:999px;padding:8px 14px;font:600 14px system-ui,sans-serif;z-index:10001;opacity:0;transition:opacity .2s, transform .2s;pointer-events:none}",
    ".shnb-toast.show{opacity:1;transform:translateX(-50%) translateY(4px)}",
    ".shnb-steps{margin:0;padding-left:20px}.shnb-steps li{margin:8px 0}",
    ".shnb-try{background:#f4efe6;border-radius:12px;padding:10px;margin:10px 0}",
    ".shnb-try input{width:100%;padding:10px;border:1px solid #d9ccbd;border-radius:10px;font:16px system-ui,sans-serif}",
    ".shnb-btn{background:#2e9e5b;color:#fff;border:0;border-radius:10px;padding:10px 14px;margin:4px 4px 4px 0;font:600 15px system-ui,sans-serif;min-height:44px;cursor:pointer}.shnb-btn.s{background:#f1e8dc;color:#2b2622}",
    ".shnb-learn{position:fixed;left:10px;right:10px;top:calc(8px + env(safe-area-inset-top));max-width:520px;margin:0 auto;background:#fffdf7;border:2px solid #f2b632;border-radius:16px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:10000;font:15px/1.45 system-ui,sans-serif;color:#2b2622}",
    ".shnb-learn h4{margin:0 0 4px;font-size:1.05rem}.shnb-learn .task{background:#fff4d6;border-radius:10px;padding:6px 10px;margin:8px 0;font-weight:600}",
    ".shnb-learn .task.done{background:#e6f6ec;color:#1b6e3e}.shnb-learn .row{display:flex;justify-content:space-between;align-items:center;gap:8px}",
    ".shnb-learn .dots{font-size:11px;color:#7a6f66}.shnb-learn.min .body{display:none}"
  ].join("");
  function injectCSS() {
    if (document.getElementById("shnb-css")) return;
    var s = document.createElement("style"); s.id = "shnb-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  // ---------- legend bar ----------
  function legendBar(el, labels) {
    injectCSS();
    if (labels) Object.keys(labels).forEach(function (k) { if (COLOR_INFO[k]) COLOR_INFO[k].label = labels[k]; });
    var items = Object.keys(COLOR_INFO).map(function (k) {
      return "<button type='button' data-c='" + k + "' style='background:" + COLOR_INFO[k].hex + "'>" + k + " = " + esc(COLOR_INFO[k].label) + "</button>";
    }).join("") + "<button type='button' data-c='merged' class='merged'>stripes = merged ideas</button>";
    el.innerHTML = "<div class='shnb-legend' role='list' aria-label='Color legend'>" + items + "</div><div class='shnb-legend-tip' aria-live='polite'></div>";
    el.querySelector(".shnb-legend").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var c = b.dataset.c, tip = el.querySelector(".shnb-legend-tip");
      tip.textContent = c === "merged" ? "Stripes = two or more color signals on the same words, merged together." : (c + ": " + COLOR_INFO[c].kid);
      learn.signal("legend");
    });
  }

  // ---------- bank renderer ----------
  function renderBank(el, records, opts) {
    injectCSS(); opts = opts || {};
    el._seen = el._seen || {};
    el._view = el._view || {};
    var first = !el._rendered;
    var list = records.slice().reverse();
    var newCount = 0;
    el.innerHTML = list.map(function (r) {
      var isNew = !el._seen[r.seq];
      var delay = isNew ? Math.min(newCount++ * 60, 1200) : 0;
      var mode = el._view[r.seq] || opts.defaultView || "en";
      var col = (r.data && r.data.colors && COLOR_INFO[r.data.colors[0]]) ? COLOR_INFO[r.data.colors[0]].hex : (/vote|suggestion/.test(r.type) ? "#2f6fd6" : "#8a4fd0");
      return "<div class='shnb-card" + (isNew && (!first || opts.animateFirst !== false) ? " shnb-landing" : "") + "' style='border-left-color:" + col + ";animation-delay:" + delay + "ms' data-seq='" + r.seq + "'>" +
        "<h4><span>" + esc(TYPE_TITLE[r.type] || r.type) + "</span><small>#" + r.seq + "</small></h4>" +
        "<div class='shnb-seg' role='tablist'><button data-m='en' class='" + (mode === "en" ? "on" : "") + "'>Plain English</button><button data-m='cd' class='" + (mode === "cd" ? "on" : "") + "'>Code</button><button data-m='both' class='" + (mode === "both" ? "on" : "") + "'>Side by side</button></div>" +
        "<div class='shnb-body " + (mode === "both" ? "both" : mode === "cd" ? "cd-only" : "en-only") + "'><div class='en'>" + english(r) + "</div><div class='cd'><pre class='shnb-pre'>" + code(r) + "</pre></div></div></div>";
    }).join("") || "<p>No deposits yet.</p>";
    records.forEach(function (r) { el._seen[r.seq] = 1; });
    el._rendered = true;
    if (!el._wired) {
      el._wired = true;
      el.addEventListener("click", function (e) {
        var b = e.target.closest(".shnb-seg button"); if (!b) return;
        var card = b.closest(".shnb-card"), m = b.dataset.m;
        el._view[card.dataset.seq] = m;
        card.querySelectorAll(".shnb-seg button").forEach(function (x) { x.classList.toggle("on", x === b); });
        card.querySelector(".shnb-body").className = "shnb-body " + (m === "both" ? "both" : m === "cd" ? "cd-only" : "en-only");
        if (m !== "en") learn.signal("code-view");
      });
    }
  }
  function replay(el) { el._seen = {}; el._rendered = true; }

  // ---------- toast ----------
  var toastT;
  function toast(msg) {
    injectCSS();
    var t = document.getElementById("shnb-toast");
    if (!t) { t = document.createElement("div"); t.id = "shnb-toast"; t.className = "shnb-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 1600);
  }

  // ---------- kid-friendly explainer + try-its ----------
  function explainer(el, getRecords, opts) {
    injectCSS(); opts = opts || {};
    el.innerHTML =
      "<h2>🏦 How this code works</h2><p style='margin:0 0 6px'>No coding needed. Here it is one step at a time:</p>" +
      "<ol class='shnb-steps'>" +
      "<li><b>A highlight is a colored marker</b> on a word, like a highlighter pen. The color is a signal that tells you what kind of word it is.</li>" +
      "<li><b>The computer writes down the facts</b> about that word in a neat little list: the word, what it means, its color, why it got that color. In code, that list is called an <i>object</i>. Tap <b>Code</b> on any coin below to see it.</li>" +
      "<li><b>Then it makes a fingerprint.</b> A <i>hash</i> (SHA-256) turns any words into a long code. The same words always give the same fingerprint, but change even one letter and the fingerprint is totally different.</li>" +
      "<li><b>Each coin holds the fingerprint of the coin before it.</b> That makes a <i>chain</i>, like paper clips hooked together. This is the <i>bank</i>.</li>" +
      "<li><b>Why does that prove who said what?</b> If anyone sneaks in a change later, the fingerprints stop matching and the chain breaks. <b>Verify</b> checks every link.</li>" +
      "</ol>" +
      "<div class='shnb-try'><b>🧪 Try it: the fingerprint machine</b><p style='margin:4px 0'>Type anything, like your name, and watch the fingerprint change.</p>" +
      "<input type='text' class='shnb-hin' placeholder='Type here…' aria-label='Text to fingerprint'><div class='shnb-mono shnb-hout' style='margin-top:6px;word-break:break-all'>fingerprint appears here</div></div>" +
      "<div class='shnb-try'><b>🧪 Try it: be a sneaky changer</b><p style='margin:4px 0'>We copy the bank, secretly change one word in the copy, then check it. Your real bank isn't touched.</p>" +
      "<button class='shnb-btn s shnb-tamper'>🕵️ Tamper test</button><button class='shnb-btn shnb-verify'>✅ Verify the real chain</button><div class='shnb-tout' aria-live='polite'></div></div>";
    var hin = el.querySelector(".shnb-hin"), hout = el.querySelector(".shnb-hout");
    hin.addEventListener("input", function () {
      var v = hin.value;
      if (!v) { hout.textContent = "fingerprint appears here"; return; }
      sha(v).then(function (h) { if (hin.value === v) hout.textContent = h; });
      learn.signal("hash-typed");
    });
    var out = el.querySelector(".shnb-tout");
    el.querySelector(".shnb-tamper").addEventListener("click", function () {
      var copy = JSON.parse(JSON.stringify(getRecords()));
      if (!copy.length) { out.textContent = "The bank is empty. Make a deposit first!"; return; }
      var i = Math.min(1, copy.length - 1);
      copy[i].data = Object.assign({}, copy[i].data, { word: "SNEAKY CHANGE" });
      verify(copy).then(function (r) {
        out.innerHTML = r.ok ? "Hmm, the copy still passed. (This shouldn't happen.)" :
          "<b style='color:#c0412b'>❌ Caught it!</b> In the copy, coin #" + r.at + " was changed, so its fingerprint no longer matches. The chain broke right there. Your real bank is unchanged.";
        learn.signal("tamper");
      });
    });
    el.querySelector(".shnb-verify").addEventListener("click", function () {
      verify(getRecords()).then(function (r) {
        out.innerHTML = r.ok ? "<b style='color:#1b6e3e'>✅ Real chain intact:</b> all " + r.n + " coins match their fingerprints." : "<b style='color:#c0412b'>❌ Chain broken at #" + r.at + ".</b>";
        learn.signal("verify");
        if (opts.onVerify) opts.onVerify(r);
      });
    });
  }

  // ---------- Learn mode ----------
  var DEFAULT_STEPS = [
    { title: "Hi! 👋 Let's learn together", text: "This page is like a coloring book that remembers. We'll learn 6 tiny ideas, one at a time. Tap Next when you're ready." },
    { title: "1 · What's a highlight?", text: "A highlight is a colored marker on a word, like a highlighter pen.", task: "Tap any colored word in the text.", signal: "panel-open", go: "piece" },
    { title: "2 · What does a color mean?", text: "Each color is a signal. Green = someone's original idea. Red = check this. Yellow = waiting to confirm. The color bar at the top is always there to remind you.", task: "Tap a color in the color bar.", signal: "legend" },
    { title: "3 · What's the bank?", text: "Every highlight gets saved like a coin in a piggy bank. Each coin is called a deposit, and it lands with a little 🪙.", task: "Open the Bank tab.", signal: "bank-open", go: "bank" },
    { title: "4 · Words or code?", text: "Every coin can be read two ways: plain English, or code. Code is the same facts written very neatly so a computer can read them. The gray // notes explain each line.", task: "Tap Code (or Side by side) on any coin.", signal: "code-view", go: "bank" },
    { title: "5 · What's a hash?", text: "A hash is a fingerprint for words. Same words → same fingerprint. Change one letter → a totally new fingerprint.", task: "Type your name in the fingerprint machine.", signal: "hash-typed", go: "bank" },
    { title: "6 · Why does it prove who said what?", text: "Each coin holds the fingerprint of the coin before it, like paper clips in a chain. A sneaky change breaks the chain, and Verify catches it.", task: "Tap Tamper test (or Verify).", signal: ["tamper", "verify"], go: "bank" },
    { title: "Your turn! 🗳", text: "Votes and better-word ideas are saved as coins too.", task: "Open a highlighted word and vote 👍, 👎 or ▲ on a suggestion.", signal: "deposit-vote" },
    { title: "You did it! 🎉", text: "You just learned highlights, color signals, a bank, hashes and chains. Those are real computer-science ideas. Created by Jeff SHNaZLab." }
  ];
  var learn = (function () {
    var steps = DEFAULT_STEPS, i = 0, done = {}, box = null, hooks = {};
    function draw() {
      if (!box) return;
      var s = steps[i], sig = s.signal ? [].concat(s.signal) : [], ok = sig.some(function (x) { return done[x]; });
      box.innerHTML = "<div class='row'><h4>🎓 " + esc(s.title) + "</h4><span><button class='shnb-btn s lm-min' style='min-height:32px;padding:4px 10px' aria-label='Minimize'>–</button><button class='shnb-btn s lm-x' style='min-height:32px;padding:4px 10px' aria-label='Close Learn mode'>×</button></span></div>" +
        "<div class='body'><p style='margin:4px 0'>" + esc(s.text) + "</p>" +
        (s.task ? "<div class='task" + (ok ? " done" : "") + "'>" + (ok ? "✅ Done! " : "👉 Try it: ") + esc(s.task) + "</div>" : "") +
        "<div class='row'><span class='dots'>Step " + (i + 1) + " of " + steps.length + "</span><span>" +
        (i ? "<button class='shnb-btn s lm-back'>Back</button>" : "") +
        (i < steps.length - 1 ? "<button class='shnb-btn lm-next'>" + (s.task && !ok ? "Skip" : "Next") + "</button>" : "<button class='shnb-btn lm-x'>Finish</button>") +
        "</span></div></div>";
    }
    function goStep(n) { i = Math.max(0, Math.min(steps.length - 1, n)); var s = steps[i]; if (s.go && hooks.go) hooks.go(s.go); draw(); }
    return {
      start: function (opt) {
        injectCSS(); opt = opt || {};
        steps = opt.steps || DEFAULT_STEPS; hooks = opt; done = {}; i = 0;
        if (!box) {
          box = document.createElement("aside"); box.className = "shnb-learn"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box);
          box.addEventListener("click", function (e) {
            if (e.target.closest(".lm-next")) goStep(i + 1);
            else if (e.target.closest(".lm-back")) goStep(i - 1);
            else if (e.target.closest(".lm-x")) learn.stop();
            else if (e.target.closest(".lm-min")) box.classList.toggle("min");
          });
        }
        box.classList.remove("min");
        draw();
      },
      stop: function () { if (box) { box.remove(); box = null; } },
      signal: function (name) {
        done[name] = 1;
        if (box) draw();
      },
      active: function () { return !!box; },
      step: function () { return i; }
    };
  })();

  // Build the bank-coin data for a credibility check (rule: inspiration → must carry source + credit + date).
  function credibilityCoin(rule, whose, check, terms, occurrences) {
    check = check || {};
    var need = ["source", "credit", "date"], missing = need.filter(function (k) { return !check[k]; });
    return { rule: rule || "inspiration → must carry source + credit + date", whose: whose, terms: terms || [], occurrences: occurrences == null ? null : occurrences,
      source: check.source || null, credit: check.credit || null, date: check.date || null, complete: !missing.length, missing: missing };
  }

  var api = {
    version: "1.1.0", sha: sha, chain: chain, verify: verify, english: english, code: code,
    renderBank: renderBank, replay: replay, explainer: explainer, legendBar: legendBar, toast: toast,
    learn: learn, credibilityCoin: credibilityCoin, DEFAULT_STEPS: DEFAULT_STEPS, COLOR_INFO: COLOR_INFO, fmtMT: fmtMT, TYPE_TITLE: TYPE_TITLE
  };
  global.SHNBank = api;
})(typeof window !== "undefined" ? window : this);
