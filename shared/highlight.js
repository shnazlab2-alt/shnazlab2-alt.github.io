/*!
 * highlight.js — SHNaZLab Truth Highlighter (vanilla JS, no dependencies)
 * By Jeff SHNaZLab · 2026-10-16 · status: claimed
 *
 * Renders text with a color-coded truth/authorship system:
 *   green  = authorship / novel        red    = claim needing review
 *   orange = warning                   yellow = caution / to confirm
 *   blue   = method                    purple = machine (computed by code)
 * An annotation may carry several colors; overlaps render as merged stripes.
 *
 * Usage:
 *   SHNHighlight.render(containerEl, {
 *     paragraphs: [{ coded: "B€€*4 ...", plain: "Be for one ..." }] // or text: "..."
 *     annotations: [{ id, match: "phrase" | ["coded","plain"], colors:["green"],
 *                     reason, confidence, credibility, suggestions:["..."],
 *                     // optional lexicon fields: word, coded, meaning, strand, link:{href,label}, record }]
 *   }, { storageKey: "my-page", mode: "plain" });
 */
(function (global) {
  "use strict";

  var COLORS = {
    green:  { hex: "#1f9d55", bg: "rgba(31,157,85,.28)",  label: "Authorship / novel" },
    red:    { hex: "#d64545", bg: "rgba(214,69,69,.26)",  label: "Claim — needs review" },
    orange: { hex: "#e8820c", bg: "rgba(232,130,12,.28)", label: "Warning" },
    yellow: { hex: "#d4a900", bg: "rgba(245,200,0,.38)",  label: "Caution / to confirm" },
    blue:   { hex: "#2f6fd6", bg: "rgba(47,111,214,.24)", label: "Method" },
    purple: { hex: "#8a4fd0", bg: "rgba(138,79,208,.24)", label: "Machine (computed by code)" }
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function bgFor(colors) {
    var c = colors.map(function (k) { return (COLORS[k] || COLORS.yellow).bg; });
    if (c.length === 1) return c[0];
    var step = 100 / c.length, parts = [];
    c.forEach(function (col, i) { parts.push(col + " " + (i * step) + "%", col + " " + ((i + 1) * step) + "%"); });
    return "linear-gradient(135deg," + parts.join(",") + ")";
  }

  // ---- storage (votes + chosen suggestion), localStorage with in-memory fallback
  function Store(key) {
    this.key = "shnhl:" + (key || "default");
    this.mem = {};
    try { this.mem = JSON.parse(localStorage.getItem(this.key) || "{}"); } catch (e) { this.mem = {}; }
  }
  Store.prototype.get = function (id) {
    return this.mem[id] || (this.mem[id] = { up: 0, down: 0, my: null, sugg: {} });
  };
  Store.prototype.save = function () {
    try { localStorage.setItem(this.key, JSON.stringify(this.mem)); } catch (e) { /* private mode */ }
  };

  // Find non-overlapping match ranges for annotations in a string.
  function findRanges(text, annotations) {
    var ranges = [];
    annotations.forEach(function (a) {
      var list = Array.isArray(a.match) ? a.match : [a.match];
      list.forEach(function (m) {
        if (!m) return;
        var i = text.indexOf(m);
        while (i !== -1) {
          ranges.push({ start: i, end: i + m.length, ann: a });
          i = text.indexOf(m, i + m.length);
        }
      });
    });
    // Merge overlapping ranges: overlapping annotations become one span with merged colors.
    ranges.sort(function (x, y) { return x.start - y.start || y.end - x.end; });
    var out = [];
    ranges.forEach(function (r) {
      var last = out[out.length - 1];
      if (last && r.start < last.end) {
        last.end = Math.max(last.end, r.end);
        if (last.anns.indexOf(r.ann) === -1) last.anns.push(r.ann);
      } else {
        out.push({ start: r.start, end: r.end, anns: [r.ann] });
      }
    });
    return out;
  }

  function renderString(text, annotations) {
    var ranges = findRanges(text, annotations), html = "", pos = 0;
    ranges.forEach(function (r) {
      html += esc(text.slice(pos, r.start));
      var colors = [];
      r.anns.forEach(function (a) { a.colors.forEach(function (c) { if (colors.indexOf(c) === -1) colors.push(c); }); });
      var ids = r.anns.map(function (a) { return a.id; }).join(" ");
      html += '<mark class="shnhl-mark' + (colors.length > 1 ? " shnhl-merged" : "") +
        '" tabindex="0" role="button" data-ids="' + esc(ids) + '" data-colors="' + esc(colors.join(" ")) +
        '" style="background:' + bgFor(colors) + ';border-bottom-color:' + (COLORS[colors[0]] || COLORS.yellow).hex +
        '" aria-label="Why this? ' + esc(colors.join(" + ")) + '">' + esc(text.slice(r.start, r.end)) + "</mark>";
      pos = r.end;
    });
    return html + esc(text.slice(pos));
  }

  var CSS = [
    ".shnhl-mark{color:inherit;border-radius:4px;padding:0 2px;border-bottom:2px solid;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    ".shnhl-mark:focus{outline:2px solid #fff;outline-offset:1px}",
    ".shnhl-off .shnhl-mark{background:none!important;border-bottom-color:transparent!important}",
    ".shnhl-panel{position:fixed;left:0;right:0;bottom:0;max-height:72vh;overflow:auto;background:#111a14;color:#eef;border-top:3px solid #1f9d55;",
    "border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -8px 30px rgba(0,0,0,.5);z-index:9999;",
    "transform:translateY(105%);transition:transform .22s ease;font:15px/1.45 -apple-system,system-ui,sans-serif}",
    ".shnhl-panel.open{transform:none}",
    "@media(min-width:760px){.shnhl-panel{left:auto;right:20px;bottom:20px;width:380px;border-radius:16px;border:1px solid #2a3a2f}}",
    ".shnhl-panel h3{margin:0 0 6px;font-size:17px}.shnhl-close{float:right;background:none;border:0;color:#aaa;font-size:24px;line-height:1;cursor:pointer}",
    ".shnhl-chip{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;margin:0 4px 4px 0;color:#fff}",
    ".shnhl-bar{height:8px;background:#2a332d;border-radius:4px;overflow:hidden;margin:2px 0 8px}.shnhl-bar i{display:block;height:100%}",
    ".shnhl-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}",
    ".shnhl-btn{min-height:44px;padding:8px 14px;border-radius:10px;border:1px solid #3a4a3f;background:#1b261f;color:#eef;font-size:15px;cursor:pointer}",
    ".shnhl-btn.on{background:#1f9d55;border-color:#1f9d55;color:#fff}",
    ".shnhl-sugg{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #243028}",
    ".shnhl-key{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.shnhl-key span{padding:4px 10px;border-radius:8px;font-size:13px;border-bottom:2px solid}",
    ".shnhl-sep{border:0;border-top:1px solid #243028;margin:12px 0}"
  ].join("");

  function injectCSS() {
    if (document.getElementById("shnhl-css")) return;
    var s = document.createElement("style"); s.id = "shnhl-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  // ---- RULES: words that must automatically carry a credibility check ----
  // RULE: inspiration → must carry source + credit + date
  var RULES = {
    inspiration: {
      id: "rule-inspiration",
      name: "inspiration → must carry source + credit + date",
      english: "Any time someone says where an idea came from, it has to show where the info came from (source), who gets named (credit), and when (date).",
      terms: ["inspiration", "inspired", "¥nspiration", "pollen"],
      mustCarry: ["source", "credit", "date"],
      colors: ["blue"]
    }
  };
  function checkStatus(rule, check) {
    check = check || {};
    var missing = rule.mustCarry.filter(function (k) { return !check[k]; });
    return { complete: missing.length === 0, missing: missing };
  }
  // Find every place a rule term appears (any capitalisation) and build one annotation per rule.
  function applyRules(texts, rules) {
    var out = [];
    (rules || []).forEach(function (r) {
      var rule = typeof r === "string" ? RULES[r] : (RULES[r.rule] ? Object.assign({}, RULES[r.rule], r) : r);
      if (!rule || !rule.terms) return;
      var found = {}, hits = [];
      texts.forEach(function (t) {
        rule.terms.forEach(function (term) {
          var re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), m;
          while ((m = re.exec(t))) { found[m[0]] = 1; hits.push(m[0]); }
        });
      });
      if (!hits.length) return;
      var st = checkStatus(rule, rule.check);
      out.push({
        id: rule.id, rule: rule.name, match: Object.keys(found), word: rule.label || "inspiration",
        colors: rule.colors.concat(st.complete ? ["green"] : ["yellow"]),
        reason: "Auto-tagged by the rule “" + rule.name + "”. " + rule.english,
        confidence: 99, credibility: st.complete ? 90 : 40,
        check: rule.check || {}, mustCarry: rule.mustCarry, status: st, hits: hits,
        suggestions: rule.suggestions || []
      });
    });
    return out;
  }

  function render(container, data, opts) {
    opts = opts || {};
    injectCSS();
    var store = new Store(opts.storageKey);
    var annotations = (data.annotations || []).slice();
    var allTexts = (data.paragraphs || [{ plain: data.text || "" }]).reduce(function (a, p) { return a.concat([p.plain || "", p.coded || ""]); }, []);
    var ruleAnns = applyRules(allTexts, opts.rules);
    // rule annotations go first so they are matched on every occurrence
    annotations = ruleAnns.concat(annotations);
    var byId = {}; annotations.forEach(function (a) { byId[a.id] = a; });
    var paragraphs = data.paragraphs || [{ plain: data.text || "", coded: data.text || "" }];
    var state = { mode: opts.mode || "plain", showDecodeBelow: !!opts.showDecodeBelow };

    var panel = document.createElement("aside");
    panel.className = "shnhl-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-live", "polite");
    document.body.appendChild(panel);

    function draw() {
      container.innerHTML = paragraphs.map(function (p) {
        var main = state.mode === "coded" && p.coded ? p.coded : p.plain;
        var tag = p.tag || "p";
        var html = "<" + tag + ' class="shnhl-p' + (p.cls ? " " + esc(p.cls) : "") + '">' + renderString(main, annotations) + "</" + tag + ">";
        if (state.mode === "coded" && p.coded && p.coded !== p.plain && state.showDecodeBelow) {
          html += '<p class="shnhl-decoded">↳ ' + renderString(p.plain, annotations) + "</p>";
        }
        return html;
      }).join("");
    }

    function pct(label, v, color) {
      return "<div><small>" + label + ": <b>" + v + "%</b></small><div class='shnhl-bar'><i style='width:" + v + "%;background:" + color + "'></i></div></div>";
    }

    function openPanel(ids) {
      var html = '<button class="shnhl-close" aria-label="Close">×</button>';
      ids.forEach(function (id, idx) {
        var a = byId[id]; if (!a) return;
        var v = store.get(id);
        if (idx) html += "<hr class='shnhl-sep'>";
        html += "<h3>Why this? <span style='opacity:.7;font-weight:400'>“" + esc(a.word || a.label || (Array.isArray(a.match) ? a.match[a.match.length - 1] : a.match)) + "”</span></h3>";
        html += "<div>" + a.colors.map(function (c) { var C = COLORS[c] || COLORS.yellow; return "<span class='shnhl-chip' style='background:" + C.hex + "'>" + c + " · " + C.label + "</span>"; }).join("") + "</div>";
        if (a.meaning) {
          var tbc = /jeff to confirm/i.test(a.meaning);
          html += "<p style='margin:8px 0 4px'><small>" + (a.coded && a.coded !== a.word ? "Coded <code>" + esc(a.coded) + "</code> → " : "") +
            "Decoded:</small> <b" + (tbc ? " style='color:#f5c800'" : "") + ">" + esc(a.meaning) + "</b></p>";
        }
        if (a.rule) {
          var lbl = { source: "Source: where did the info come from?", credit: "Credit: who gets named?", date: "Date: when?" };
          html += "<div style='background:#0b2233;border:1px solid #2f6fd6;border-radius:10px;padding:8px 10px;margin:8px 0'><small>🔎 <b>Credibility check</b> · rule <code>" + esc(a.rule) + "</code></small>" +
            a.mustCarry.map(function (k) { var v = a.check[k]; return "<div style='display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-top:1px solid #1d3a50'><span>" + esc(lbl[k] || k) + "</span><b style='text-align:right;color:" + (v ? "#7fe0a5" : "#f5c800") + "'>" + (v ? esc(v) : "❓ awaiting") + "</b></div>"; }).join("") +
            "<small>" + (a.status.complete ? "✅ Complete: source, credit and date are all there." : "⏳ Waiting on: " + esc(a.status.missing.join(" + ")) + ". They get to go first.") + "</small>" +
            (opts.onRuleOpen ? "<div><button class='shnhl-btn' data-act='rule' style='margin-top:6px'>Open the credibility checks →</button></div>" : "") + "</div>";
        }
        if (a.strand) html += "<p style='margin:0 0 4px'><small>Strand color: <b>" + esc(a.strand) + "</b></small></p>";
        html += "<p style='margin:6px 0 10px'>" + esc(a.reason || "") + "</p>";
        if (a.link && /^https?:\/\//.test(a.link.href)) html += "<p style='margin:0 0 10px'><a style='color:#7fe0a5' target='_blank' rel='noopener' href='" + esc(a.link.href) + "'>" + esc(a.link.label || a.link.href) + " ↗</a></p>";
        if (a.record) html += "<p class='shnhl-rec' style='margin:0 0 8px;font:11px ui-monospace,monospace;opacity:.75;word-break:break-all'>" + esc(a.record) + "</p>";
        html += pct("Confidence", a.confidence || 0, "#4aa3ff") + pct("Credibility", a.credibility || 0, "#1f9d55");
        html += "<div class='shnhl-row' data-id='" + esc(id) + "'>" +
          "<button class='shnhl-btn" + (v.my === "up" ? " on" : "") + "' data-act='up'>👍 Agree <b>" + v.up + "</b></button>" +
          "<button class='shnhl-btn" + (v.my === "down" ? " on" : "") + "' data-act='down'>👎 Disagree <b>" + v.down + "</b></button></div>";
        if (a.suggestions && a.suggestions.length) {
          html += "<div><small><b>Better-word suggestions</b> — vote for one:</small>";
          a.suggestions.forEach(function (s, si) {
            var n = v.sugg[si] || 0;
            html += "<div class='shnhl-sugg' data-id='" + esc(id) + "'><span>" + esc(s) + "</span>" +
              "<button class='shnhl-btn" + (v.mySugg === si ? " on" : "") + "' data-act='sugg' data-si='" + si + "'>▲ " + n + "</button></div>";
          });
          html += "</div>";
        }
      });
      panel.innerHTML = html;
      panel.dataset.ids = ids.join(" ");
      panel.classList.add("open");
      if (opts.onOpen) opts.onOpen(ids);
    }

    function closePanel() { panel.classList.remove("open"); }

    panel.addEventListener("click", function (e) {
      if (e.target.closest(".shnhl-close")) return closePanel();
      if (e.target.closest("[data-act='rule']")) { closePanel(); if (opts.onRuleOpen) opts.onRuleOpen(); return; }
      var btn = e.target.closest("[data-act]"); if (!btn) return;
      var id = btn.parentNode.dataset.id, v = store.get(id), act = btn.dataset.act;
      if (act === "up" || act === "down") {
        if (v.my === act) { v[act]--; v.my = null; }
        else { if (v.my) v[v.my]--; v[act]++; v.my = act; }
      } else if (act === "sugg") {
        var si = +btn.dataset.si;
        if (v.mySugg === si) { v.sugg[si] = (v.sugg[si] || 1) - 1; v.mySugg = null; }
        else { if (v.mySugg != null) v.sugg[v.mySugg] = (v.sugg[v.mySugg] || 1) - 1; v.sugg[si] = (v.sugg[si] || 0) + 1; v.mySugg = si; }
      }
      store.save();
      openPanel(panel.dataset.ids.split(" "));
      if (opts.onVote) opts.onVote(id, v);
    });

    function onActivate(e) {
      var m = e.target.closest && e.target.closest(".shnhl-mark");
      if (!m || !container.contains(m)) return;
      if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      openPanel(m.dataset.ids.split(" "));
    }
    container.addEventListener("click", onActivate);
    container.addEventListener("keydown", onActivate);
    if (opts.hover !== false && global.matchMedia && global.matchMedia("(hover:hover)").matches) {
      container.addEventListener("mouseover", function (e) {
        var m = e.target.closest && e.target.closest(".shnhl-mark");
        if (m) openPanel(m.dataset.ids.split(" "));
      });
    }
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });

    draw();

    return {
      setMode: function (mode) { state.mode = mode; draw(); },
      getMode: function () { return state.mode; },
      setDecodeBelow: function (b) { state.showDecodeBelow = !!b; draw(); },
      setHighlights: function (on) { container.classList.toggle("shnhl-off", !on); },
      open: openPanel, close: closePanel,
      annotation: function (id) { return byId[id]; },
      ruleAnnotations: function () { return ruleAnns; },
      isOpen: function () { return panel.classList.contains("open"); },
      votes: function () { return JSON.parse(JSON.stringify(store.mem)); },
      plainText: function () { return paragraphs.map(function (p) { return p.plain; }).join("\n"); },
      codedText: function () { return paragraphs.map(function (p) { return p.coded || p.plain; }).join("\n"); }
    };
  }

  function legend(el) {
    injectCSS();
    el.innerHTML = '<div class="shnhl-key">' + Object.keys(COLORS).map(function (k) {
      return "<span style='background:" + COLORS[k].bg + ";border-color:" + COLORS[k].hex + "'><b>" + k + "</b> — " + COLORS[k].label + "</span>";
    }).join("") + "<span class='shnhl-merged' style='background:" + bgFor(["green", "orange"]) + ";border-color:#888'><b>merged</b> — overlapping signals</span></div>";
  }

  var api = { render: render, legend: legend, COLORS: COLORS, RULES: RULES, applyRules: applyRules, checkStatus: checkStatus, version: "1.3.0" };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.SHNHighlight = api;
})(typeof window !== "undefined" ? window : this);
