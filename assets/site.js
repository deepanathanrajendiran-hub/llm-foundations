/* ============================================================
   Teaching Site — shared JS (assets/site.js)
   Vanilla, no build. Handles: dark-mode toggle (persisted),
   KaTeX auto-render, highlight.js init, copy-code buttons,
   and the mobile sidebar. Loaded once per page (at end of body).
   The tiny FOUC-guard inline script in each <head> sets the
   theme class before paint; this file wires up everything else.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Dark mode ---------- */
  var root = document.documentElement;

  function syncHljsTheme(isDark) {
    var light = document.getElementById("hljs-light");
    var dark = document.getElementById("hljs-dark");
    if (light) light.disabled = isDark;
    if (dark) dark.disabled = !isDark;
  }

  function applyTheme(theme) {
    var isDark = theme === "dark";
    root.classList.toggle("dark", isDark);
    syncHljsTheme(isDark);
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.textContent = isDark ? "☀" : "☾";
      btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      btn.title = isDark ? "Light mode" : "Dark mode";
    });
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }

  // Initial theme: stored preference, else OS preference.
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  var initial = stored || (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(initial);

  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyTheme(root.classList.contains("dark") ? "light" : "dark");
    });
  });

  /* ---------- Mobile sidebar ---------- */
  var sidebar = document.querySelector(".sidebar");
  var scrim = document.querySelector(".scrim");
  function openSidebar(open) {
    if (!sidebar) return;
    sidebar.classList.toggle("open", open);
    if (scrim) scrim.classList.toggle("show", open);
  }
  document.querySelectorAll("[data-sidebar-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openSidebar(!sidebar.classList.contains("open"));
    });
  });
  if (scrim) scrim.addEventListener("click", function () { openSidebar(false); });
  // Close the drawer after tapping a link on mobile.
  if (sidebar) sidebar.querySelectorAll("a.nav-link").forEach(function (a) {
    a.addEventListener("click", function () { openSidebar(false); });
  });

  /* ---------- Desktop sidebar collapse (persisted) ---------- */
  function setCollapsed(collapsed) {
    root.classList.toggle("sidebar-collapsed", collapsed);
    try { localStorage.setItem("sidebar", collapsed ? "collapsed" : "open"); } catch (e) {}
  }
  // sync initial state in case the inline FOUC guard didn't run
  try { if (localStorage.getItem("sidebar") === "collapsed") root.classList.add("sidebar-collapsed"); } catch (e) {}
  if (sidebar) {
    var collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "icon-btn sidebar-collapse-btn";
    collapseBtn.title = "Collapse sidebar";
    collapseBtn.setAttribute("aria-label", "Collapse sidebar");
    collapseBtn.textContent = "«";
    collapseBtn.addEventListener("click", function () { setCollapsed(true); });
    sidebar.appendChild(collapseBtn);
  }
  var expandBtn = document.createElement("button");
  expandBtn.type = "button";
  expandBtn.className = "icon-btn sidebar-expand-btn";
  expandBtn.title = "Expand sidebar";
  expandBtn.setAttribute("aria-label", "Expand sidebar");
  expandBtn.textContent = "»";
  expandBtn.addEventListener("click", function () { setCollapsed(false); });
  document.body.appendChild(expandBtn);

  /* ---------- KaTeX auto-render ---------- */
  function renderMath() {
    if (typeof renderMathInElement !== "function") return;
    try {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false,
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
      });
    } catch (e) { /* never break the page over a stray $ */ }
  }

  /* ---------- highlight.js ---------- */
  function highlightCode() {
    if (typeof hljs === "undefined") return;
    document.querySelectorAll("pre code").forEach(function (block) {
      try { hljs.highlightElement(block); } catch (e) {}
    });
  }

  /* ---------- Copy-code buttons ---------- */
  function addCopyButtons() {
    document.querySelectorAll(".codeblock").forEach(function (wrap) {
      if (wrap.querySelector(".copy-btn")) return;
      var code = wrap.querySelector("code");
      if (!code) return;
      var btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "Copy";
      btn.addEventListener("click", function () {
        var text = code.innerText;
        var done = function () {
          btn.textContent = "Copied ✓";
          btn.classList.add("copied");
          setTimeout(function () {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
        } else { fallbackCopy(text, done); }
      });
      wrap.appendChild(btn);
    });
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- Active sidebar link + run ---------- */
  function run() {
    highlightCode();
    renderMath();
    addCopyButtons();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
