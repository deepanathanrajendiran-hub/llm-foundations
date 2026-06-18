/* ============================================================
   Teaching Slides — shared reveal.js runtime (assets/deck.js)
   Loaded at end of <body> after the reveal + plugin + mermaid CDN
   scripts. Handles: dark toggle, Mermaid init/render, reveal init
   with Math(KaTeX)/Highlight/Notes plugins, and the animation
   registry (mechanism step-throughs + approach-evolution anims).
   Each animation mounts into a <div data-anim="..."> in a slide.
   ============================================================ */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- dark toggle ---------- */
  function applyDark(on) {
    root.classList.toggle("deck-dark", on);
    try { localStorage.setItem("deck-theme", on ? "dark" : "light"); } catch (e) {}
    var b = document.getElementById("deck-darkbtn");
    if (b) b.textContent = on ? "☀" : "☾";
  }
  var darkStored = null;
  try { darkStored = localStorage.getItem("deck-theme"); } catch (e) {}
  var darkInit = darkStored ? darkStored === "dark"
    : (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("deck-dark", !!darkInit);
  (function () {
    var b = document.createElement("button");
    b.id = "deck-darkbtn"; b.className = "deck-darkbtn"; b.type = "button";
    b.title = "Toggle light / dark"; b.setAttribute("aria-label", "Toggle theme");
    b.textContent = darkInit ? "☀" : "☾";
    b.addEventListener("click", function () { applyDark(!root.classList.contains("deck-dark")); });
    document.body.appendChild(b);
  })();

  /* ============================================================
     Animation registry — keyed by the data-anim attribute value
     ============================================================ */
  var mechanisms = [];   // {section, play, pause, reset}

  function makeStepper(opts) {
    var i = 0, timer = null;
    function show(n) { var N = opts.steps; i = ((n % N) + N) % N; opts.render(i); }
    function play() {
      if (timer || reduce) return;
      if (opts.playBtn) opts.playBtn.classList.add("on");
      timer = setInterval(function () { show(i + 1); }, opts.intervalMs || 1900);
    }
    function pause() { if (timer) { clearInterval(timer); timer = null; } if (opts.playBtn) opts.playBtn.classList.remove("on"); }
    function step() { pause(); show(i + 1); }
    function reset() { pause(); show(0); }
    if (opts.playBtn) opts.playBtn.addEventListener("click", play);
    if (opts.pauseBtn) opts.pauseBtn.addEventListener("click", pause);
    if (opts.stepBtn) opts.stepBtn.addEventListener("click", step);
    if (opts.resetBtn) opts.resetBtn.addEventListener("click", reset);
    show(0);
    return { play: play, pause: pause, reset: reset };
  }

  function controlsHTML() {
    return '<div class="anim-controls">' +
      '<button class="deckbtn ATPLAY" type="button">▶ Play</button>' +
      '<button class="deckbtn ghost ATPAUSE" type="button">⏸ Pause</button>' +
      '<button class="deckbtn ghost ATSTEP" type="button">Step ›</button>' +
      '<button class="deckbtn ghost ATRESET" type="button">⟲ Reset</button>' +
      '</div>';
  }

  // ---- mechanism: build nodes from defs (label, sub) joined by arrows ----
  function buildNodes(stage, defs, loopChar) {
    var nodes = [];
    defs.forEach(function (d, idx) {
      if (idx > 0) { var a = document.createElement("span"); a.className = "anim-arrow"; a.textContent = "→"; stage.appendChild(a); }
      var n = document.createElement("span"); n.className = "anim-node";
      n.innerHTML = d[0] + (d[1] ? "<small>" + d[1] + "</small>" : "");
      stage.appendChild(n); nodes.push(n);
    });
    if (loopChar) { var l = document.createElement("span"); l.className = "anim-arrow"; l.textContent = loopChar; stage.appendChild(l); nodes.push(l); }
    return nodes;
  }

  function mountMechanism(container, slug) {
    container.classList.add("anim");
    container.innerHTML = '<div class="anim-stage"></div>' +
      (slug === "synthetic-data" ? '<div class="anim-meter"><span></span></div><div class="anim-metalabel">Model quality on the target task</div>' : '') +
      '<div class="anim-caption"></div>' + controlsHTML();
    var stage = container.querySelector(".anim-stage");
    var cap = container.querySelector(".anim-caption");
    var meterEl = container.querySelector(".anim-meter > span");
    var ctl = {
      playBtn: container.querySelector(".ATPLAY"), pauseBtn: container.querySelector(".ATPAUSE"),
      stepBtn: container.querySelector(".ATSTEP"), resetBtn: container.querySelector(".ATRESET")
    };
    var render, steps;

    if (slug === "pretraining") {
      var TOK = ["The", "cat", "sat", "on", "the", "mat"];
      var spans = TOK.map(function (t) { var s = document.createElement("span"); s.className = "anim-tok"; s.textContent = t; stage.appendChild(s); return s; });
      steps = 5;
      render = function (i) {
        spans.forEach(function (s, p) { s.className = "anim-tok"; if (p <= i) s.classList.add("ctx"); else if (p === i + 1) s.classList.add("pred"); else s.classList.add("future"); });
        cap.innerHTML = '<span class="step-num">Step ' + (i + 1) + '/5</span> Given “<code>' + TOK.slice(0, i + 1).join(" ") +
          '</code>”, predict the next token → “<code>' + TOK[i + 1] + '</code>”. Loss += <code>&minus;log p(' + TOK[i + 1] +
          ')</code>. The causal mask hides everything to the right — so one pass gives <em>n</em> training signals.';
      };
    } else if (slug === "finetuning-peft") {
      var defs = [["x", "input"], ["W₀", "frozen"], ["A", "d→r"], ["r", "rank-r"], ["B", "r→d"], ["× α/r", "scale"], ["⊕", "add"], ["h", "output"]];
      var nodes = buildNodes(stage, defs);
      var S = [
        { on: [0, 1], done: [], c: 'The pretrained <code>W₀</code> is <strong>frozen</strong> — it still computes the base output <code>W₀x</code>.' },
        { on: [0, 2, 3], done: [1], c: '<span class="step-num">Down-project.</span> <code>A</code> maps <code>x</code> into a tiny rank-<code>r</code> space (<code>r ≪ d</code>).' },
        { on: [3, 4], done: [1, 2], c: '<span class="step-num">Up-project.</span> <code>B</code> maps back to <code>d</code>. <code>BA</code> is a low-rank ΔW — only <code>A,B</code> train (≈ <code>r(d+k)</code> params).' },
        { on: [5], done: [1, 2, 3, 4], c: '<span class="step-num">Scale</span> by <code>α/r</code>. At init <code>B=0</code> ⇒ ΔW=0, so the model starts exactly as the base.' },
        { on: [1, 5, 6, 7], done: [0, 2, 3, 4], c: '<span class="step-num">Add.</span> <code>h = W₀x + (α/r)·BAx</code>.' },
        { on: [6, 7], done: [0, 1, 2, 3, 4, 5], c: '<span class="step-num">Merge (optional).</span> Fold <code>(α/r)BA</code> into <code>W₀</code> → zero extra inference latency.' }
      ];
      steps = S.length;
      render = function (i) { nodes.forEach(function (n, idx) { n.className = "anim-node"; if (S[i].on.indexOf(idx) >= 0) n.classList.add("on"); else if (S[i].done.indexOf(idx) >= 0) n.classList.add("done"); else n.classList.add("dim"); }); cap.innerHTML = S[i].c; };
    } else if (slug === "rlhf") {
      var rdefs = [["Prompt x", "from set"], ["Policy πθ", "generate"], ["Response y", "rollout"], ["Reward r(x,y)", "RM"], ["− β·KL", "vs ref"], ["Advantage Aₜ", "GAE"], ["PPO update", "clipped"]];
      var rnodes = buildNodes(stage, rdefs, "↺");
      var C = [
        'Sample a <strong>prompt</strong> <code>x</code> matching deployment.',
        'The <strong>policy</strong> <code>πθ</code> generates response <code>y</code> (on-policy rollout).',
        'A full completion <code>y</code> to score — reward is a single sequence-level scalar.',
        'The <strong>frozen reward model</strong> scores it: <code>r(x,y)</code>.',
        'Subtract a per-token <strong>KL penalty</strong> <code>β·KL(πθ‖π_ref)</code> so it can’t drift / reward-hack.',
        'A critic + GAE turn (reward − KL) into per-token <strong>advantages</strong> <code>Aₜ</code>.',
        '<strong>PPO</strong> takes a clipped step up the advantage, then <code>↺</code> loops.'
      ];
      steps = 7;
      render = function (i) {
        rnodes.forEach(function (n, idx) {
          var loop = idx === rnodes.length - 1; n.className = loop ? "anim-arrow" : "anim-node";
          if (loop) { if (i === 6) n.classList.add("on"); return; }
          if (idx === i) n.classList.add("on"); else if (idx < i) n.classList.add("done"); else n.classList.add("dim");
        });
        cap.innerHTML = '<span class="step-num">Stage ' + (i + 1) + '/7</span> ' + C[i];
      };
    } else if (slug === "synthetic-data") {
      var fdefs = [["Seed prompts", "tasks"], ["Generate N", "high temp"], ["Verify / filter", "keep correct"], ["Accumulate", "real + synth"], ["Re-train", "improves"]];
      var fnodes = buildNodes(stage, fdefs, "↺");
      var FS = [
        { on: 0, q: 18, c: 'Start from a few <strong>seed prompts</strong> / tasks.' },
        { on: 1, q: 18, c: 'Generate many <strong>candidates</strong> per prompt (sample with temperature).' },
        { on: 2, q: 30, c: '<span class="step-num">The crux.</span> A <strong>verifier</strong> keeps only correct samples — run the code, check the answer, majority-vote.' },
        { on: 3, q: 30, c: '<strong>Accumulate</strong>: add verified samples to the <em>real</em> data (don’t replace) — prevents collapse.' },
        { on: 4, q: 55, c: '<strong>Re-train</strong> on the bigger set — quality climbs.' },
        { on: -1, q: 78, c: 'Better model → better generations → more verified data. <code>↺</code> repeat (STaR / rejection sampling).' }
      ];
      steps = FS.length;
      render = function (i) {
        fnodes.forEach(function (n, idx) { var loop = idx === fnodes.length - 1; n.className = loop ? "anim-arrow" : "anim-node"; if (loop) { if (FS[i].on === -1) n.classList.add("on"); return; } if (idx === FS[i].on) n.classList.add("on"); else if (FS[i].on === -1 || idx < FS[i].on) n.classList.add("done"); else n.classList.add("dim"); });
        if (meterEl) meterEl.style.width = FS[i].q + "%";
        cap.innerHTML = '<span class="step-num">Step ' + (i + 1) + '/6</span> ' + FS[i].c;
      };
    } else { return; }

    var s = makeStepper({ steps: steps, render: render, intervalMs: slug === "rlhf" ? 2100 : 1900,
      playBtn: ctl.playBtn, pauseBtn: ctl.pauseBtn, stepBtn: ctl.stepBtn, resetBtn: ctl.resetBtn });
    mechanisms.push({ section: container.closest("section"), play: s.play, pause: s.pause, reset: s.reset });
  }

  /* ---- approach-evolution: fragment-driven (advancing the slide animates A→B→C) ---- */
  var evolutions = [];   // {id, render, frags:[el], state}

  function mountEvolution(container, slug) {
    container.classList.add("anim");
    var visual = document.createElement("div");
    var cap = document.createElement("div"); cap.className = "anim-caption";
    var frags = document.createElement("div"); frags.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";
    container.appendChild(visual); container.appendChild(cap); container.appendChild(frags);
    var render, K;

    if (slug === "finetuning-peft") {
      var grid = document.createElement("div"); grid.className = "wgrid";
      var cells = []; for (var c = 0; c < 64; c++) { var d = document.createElement("div"); d.className = "wcell"; grid.appendChild(d); cells.push(d); }
      visual.style.textAlign = "center"; visual.appendChild(grid);
      var ST = [
        { c: '<strong>① Full fine-tuning.</strong> <em>Every</em> weight of <code>W</code> is trainable — best quality, but you store a full-size copy + optimizer states (≈ model size × ~3–4). One model per task.', f: function () { cells.forEach(function (x) { x.className = "wcell train"; }); } },
        { c: '<strong>② LoRA.</strong> Freeze <code>W₀</code>; train only a low-rank <code>BA</code> (the highlighted stripe). ~0.1–1% of params, a few MB per task, mergeable at inference.', f: function () { cells.forEach(function (x, idx) { x.className = (idx % 8 < 2) ? "wcell lowrank" : "wcell frozen"; }); } },
        { c: '<strong>③ QLoRA.</strong> Same low-rank adapter, but the frozen base is <em>4-bit NF4</em> (hatched) — fits a 65B fine-tune on one 48GB GPU. The evolution: train less, then store less.', f: function () { cells.forEach(function (x, idx) { x.className = (idx % 8 < 2) ? "wcell lowrank" : "wcell q4"; }); } }
      ];
      K = ST.length; render = function (i) { ST[i].f(); cap.innerHTML = ST[i].c; };
    } else if (slug === "rlhf") {
      var lanes = [
        ["RLHF (PPO)", ["Prefs", "Reward model", "PPO + KL loop", "πθ"]],
        ["DPO", ["Prefs", "—  no RM", "closed-form loss", "πθ"]],
        ["GRPO", ["Prompt", "sample a GROUP", "group mean = baseline", "πθ"]]
      ];
      var laneEls = lanes.map(function (L) {
        var el = document.createElement("div"); el.className = "evo-lane";
        var row = '<div class="lane-row">';
        L[1].forEach(function (b, k) { row += (k ? '<span class="anim-arrow">→</span>' : '') + '<span class="anim-node">' + b + '</span>'; });
        row += '</div>';
        el.innerHTML = "<h5>" + L[0] + "</h5>" + row; visual.appendChild(el); return el;
      });
      visual.className = "evo-lanes";
      var RC = [
        '<strong>① RLHF / PPO.</strong> Train a <em>reward model</em> on preferences, then optimize the policy with PPO + a KL leash. Powerful but heavy: 3 models in memory, unstable, reward-hackable.',
        '<strong>② DPO.</strong> Skip the reward model and the RL loop — a closed-form classification loss on (chosen, rejected) pairs moves the policy directly. Stable, cheap, offline.',
        '<strong>③ GRPO.</strong> Drop the critic too: sample a <em>group</em> of completions per prompt and use the group’s mean reward as the baseline. The engine behind verifiable-reward reasoning models.'
      ];
      K = 3; render = function (i) { laneEls.forEach(function (el, idx) { el.classList.toggle("on", idx === i); }); cap.innerHTML = RC[i]; };
    } else if (slug === "pretraining") {
      var T = ["the", "cat", "sat", "on", "the", "mat"];
      var row = document.createElement("div"); row.className = "anim-stage";
      var toks = T.map(function (t) { var s = document.createElement("span"); s.className = "anim-tok"; s.textContent = t; row.appendChild(s); return s; });
      visual.appendChild(row);
      var OC = [
        { cls: function (idx) { return idx === T.length - 1 ? "pred" : "ctx"; }, c: '<strong>① Causal LM (GPT).</strong> Predict the <em>next</em> token left-to-right under a triangular mask. Generative; the dominant objective.' },
        { cls: function (idx) { return (idx === 1 || idx === 4) ? "mask" : "ctx"; }, c: '<strong>② Masked LM (BERT).</strong> Mask ~15% of tokens and predict them from <em>both</em> sides. Bidirectional → great encoder, not generative.' },
        { cls: function (idx) { return (idx === 2 || idx === 3) ? "mask" : "ctx"; }, c: '<strong>③ Span corruption (T5).</strong> Replace a whole <em>span</em> with one sentinel and predict the span — unifies the two as text-to-text.' },
        { cls: function (idx) { return idx >= 4 ? "pred" : (idx === 0 ? "ctx" : "ctx"); }, c: '<strong>④ Fill-in-the-Middle.</strong> Move the suffix before the middle so a causal LM learns to <em>infill</em> — what powers code completion.' }
      ];
      K = OC.length; render = function (i) { toks.forEach(function (s, idx) { s.className = "anim-tok " + OC[i].cls(idx); }); cap.innerHTML = OC[i].c; };
    } else if (slug === "synthetic-data") {
      function gauss(sig, peak) { var pts = [], w = 200, h = 110, mid = w / 2; for (var x = 0; x <= w; x += 5) { var y = h - peak * Math.exp(-Math.pow((x - mid) / sig, 2) / 2); pts.push((x === 0 ? "M" : "L") + x + " " + y.toFixed(1)); } return pts.join(" "); }
      var box = document.createElement("div"); box.className = "distbox";
      box.innerHTML =
        '<div class="dist collapse"><h5>“Replace” — train only on synthetic</h5><svg viewBox="0 0 200 120"><path class="curve" d=""/></svg></div>' +
        '<div class="dist"><h5>“Accumulate” — keep real + synthetic</h5><svg viewBox="0 0 200 120"><path class="curve" d=""/></svg></div>';
      visual.appendChild(box);
      var rep = box.querySelectorAll(".curve")[0], acc = box.querySelectorAll(".curve")[1];
      var sig = [46, 26, 11], pk = [95, 100, 108];
      var DC = [
        'Generation 0: both pipelines match the real distribution — broad, with tails.',
        'After a few rounds: <strong>replacing</strong> real data with model output starts to <em>narrow</em> the distribution; accumulating stays broad.',
        '<strong>Model collapse.</strong> Pure “replace” recursion forgets the tails and spikes to a few modes; <strong>accumulating</strong> real + synthetic keeps the distribution intact. Always keep real data in the mix.'
      ];
      K = 3; render = function (i) { rep.setAttribute("d", gauss(sig[i], pk[i])); acc.setAttribute("d", gauss(46, 95)); cap.innerHTML = DC[i]; };
    } else { return; }

    // build K-1 fragment markers so advancing the slide steps the animation
    var fels = [];
    for (var k = 1; k < K; k++) { var sp = document.createElement("span"); sp.className = "fragment"; sp.setAttribute("data-evo", slug); sp.setAttribute("data-idx", k); frags.appendChild(sp); fels.push(sp); }
    render(0);
    evolutions.push({ slug: slug, render: render, K: K, frags: fels });
  }

  /* ---- generic spec-driven interactive widget for "key" approaches ----
     <div class="keyanim"><script type="application/json">{title,nodes,steps,loop,interval,meter}</script></div> */
  function mountKeyAnim(container, spec) {
    container.classList.add("anim");
    container.innerHTML =
      (spec.title ? '<div class="anim-title">' + spec.title + '</div>' : '') +
      '<div class="anim-stage"></div>' +
      (spec.meter ? '<div class="anim-meter"><span></span></div>' : '') +
      '<div class="anim-caption"></div>' + controlsHTML();
    var stage = container.querySelector(".anim-stage");
    var cap = container.querySelector(".anim-caption");
    var meterEl = container.querySelector(".anim-meter > span");
    var defs = (spec.nodes || []).map(function (n) { return (n && n.join) ? n : [String(n), ""]; });
    var nodes = buildNodes(stage, defs, spec.loop || null);
    var steps = (spec.steps && spec.steps.length) ? spec.steps : [{ cap: "" }];
    function render(i) {
      var s = steps[i] || {}, on = s.on || [], done = s.done || [];
      nodes.forEach(function (n, idx) {
        var isLoop = spec.loop && idx === nodes.length - 1;
        n.className = isLoop ? "anim-arrow" : "anim-node";
        if (isLoop) { if (s.loopOn) n.classList.add("on"); return; }
        if (on.indexOf(idx) >= 0) n.classList.add("on");
        else if (done.indexOf(idx) >= 0) n.classList.add("done");
        else n.classList.add("dim");
      });
      if (meterEl && typeof s.q === "number") meterEl.style.width = s.q + "%";
      cap.innerHTML = s.cap || "";
    }
    var st = makeStepper({
      steps: steps.length, render: render, intervalMs: spec.interval || 1900,
      playBtn: container.querySelector(".ATPLAY"), pauseBtn: container.querySelector(".ATPAUSE"),
      stepBtn: container.querySelector(".ATSTEP"), resetBtn: container.querySelector(".ATRESET")
    });
    mechanisms.push({ section: container.closest("section"), play: st.play, pause: st.pause, reset: st.reset });
  }

  /* ---- click-to-reveal practice answers (click a question to toggle its answer) ---- */
  function wireAnswers() {
    document.querySelectorAll(".qa").forEach(function (li) {
      if (li.__wired) return; li.__wired = true;
      var q = li.querySelector(".q") || li;
      function toggle(ev) { ev.stopPropagation(); li.classList.toggle("open"); }
      q.addEventListener("click", toggle);
      q.setAttribute("role", "button"); q.setAttribute("tabindex", "0");
      q.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(ev); } });
    });
  }

  function mountAll() {
    document.querySelectorAll("[data-anim]").forEach(function (el) {
      var v = el.getAttribute("data-anim");
      if (v.indexOf("mech-") === 0) mountMechanism(el, v.slice(5));
      else if (v.indexOf("evo-") === 0) mountEvolution(el, v.slice(4));
    });
    document.querySelectorAll(".keyanim").forEach(function (el) {
      var sc = el.querySelector('script[type="application/json"]');
      if (!sc) return;
      try { var spec = JSON.parse(sc.textContent); el.removeChild(sc); mountKeyAnim(el, spec); } catch (e) {}
    });
  }

  function evoStateFromDom(ev) {
    var n = 0; ev.frags.forEach(function (f) { if (f.classList.contains("visible")) n++; });
    return n;
  }

  /* ============================================================
     Mermaid
     ============================================================ */
  function initMermaid() {
    if (typeof mermaid === "undefined") return;
    try {
      mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "neutral",
        flowchart: { curve: "basis", htmlLabels: false, padding: 10, nodeSpacing: 45, rankSpacing: 55, useMaxWidth: true },
        themeVariables: { fontSize: "14px" } });
    } catch (e) {}
  }
  // Render lazily, scoped to a slide. Mermaid measures text via the live layout,
  // so a diagram inside a display:none slide renders to a 0-size box and is then
  // marked done forever — we must render each diagram only once its slide is visible.
  function renderMermaidIn(scope) {
    if (typeof mermaid === "undefined") return;
    var root = scope || document;
    var nodes = [].slice.call(root.querySelectorAll(".mermaid")).filter(function (n) { return !n.getAttribute("data-processed"); });
    if (!nodes.length) return;
    try { mermaid.run({ nodes: nodes }); } catch (e) {}
  }

  /* ============================================================
     Reveal init (build anims first so fragments exist at init)
     ============================================================ */
  mountAll();
  initMermaid();

  Reveal.initialize({
    hash: true,
    center: false,
    progress: true,
    slideNumber: "c/t",
    overview: true,
    transition: "slide",
    backgroundTransition: "fade",
    width: 1180, height: 740,
    margin: 0.06,
    minScale: 0.2, maxScale: 1.8,
    katex: {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
    },
    plugins: [RevealMath.KaTeX, RevealHighlight, RevealNotes]
  }).then(function () {
    wireAnswers();
    handleSlide(Reveal.getCurrentSlide());
  });

  function handleSlide(slide) {
    renderMermaidIn(slide);                       // render this slide's diagrams while it is visible
    if (slide && slide.parentElement) renderMermaidIn(slide.parentElement); // also the stack wrapper
    mechanisms.forEach(function (m) {
      if (m.section === slide) { if (!reduce) m.play(); }
      else { m.reset(); }
    });
    // sync evolutions on this slide to however many of their fragments are visible
    evolutions.forEach(function (ev) { ev.render(evoStateFromDom(ev)); });
  }

  Reveal.on("slidechanged", function (e) { handleSlide(e.currentSlide); });
  Reveal.on("overviewshown", function () { renderMermaidIn(document); }); // overview shows all slides at once
  Reveal.on("fragmentshown", function (e) {
    var slug = e.fragment.getAttribute && e.fragment.getAttribute("data-evo");
    if (slug) evolutions.forEach(function (ev) { if (ev.slug === slug) ev.render(evoStateFromDom(ev)); });
  });
  Reveal.on("fragmenthidden", function (e) {
    var slug = e.fragment.getAttribute && e.fragment.getAttribute("data-evo");
    if (slug) evolutions.forEach(function (ev) { if (ev.slug === slug) ev.render(evoStateFromDom(ev)); });
  });
})();
