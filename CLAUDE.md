# Teaching Slides — Build Spec (read this first)

This is a **local, static SLIDE-DECK site** for teaching LLM/AI concepts to friends prepping for
interviews — built with **reveal.js**. I present these live (click/arrow through), so they're decks,
**not** scrollable doc pages. I'll usually hand you **several topics at once**; build **one deck per
topic**, each matching the others exactly so the set stays consistent.

When I give you one or more topics, you:
1. Create a **separate reveal.js deck (its own file) for EACH topic** — never merge topics into one deck.
2. Add **every** new deck as a card on the launcher (`index.html`).
3. Leave existing decks untouched.

So if I give you four topics, you produce four complete, independent decks and add four cards to the launcher.

---

## Hard rules (do not break)

- **Runs 100% locally**, opened by double-clicking from the filesystem (`file://`). No server, no build, no npm.
- **All libraries via CDN.** reveal.js + its plugins load from a CDN.
- **Write slides as inline HTML `<section>` elements.** Do NOT load external markdown files into reveal —
  that breaks under `file://` (fetch/CORS). Inline HTML always works locally.
- Keep it simple and consistent across decks.

## Tech (all CDN)

- **reveal.js** (core + a clean theme) — slide framework: keyboard nav, fragments, overview, speaker notes.
- reveal plugins: **Math (KaTeX)** for equations, **Highlight** for code, **Notes** for speaker view.
- **Mermaid.js** for flow / architecture / sequence diagrams (rendered into slides).
- **Animations:** reveal **fragments** for step-by-step reveals + custom CSS / vanilla-JS
  (`requestAnimationFrame`; anime.js via CDN is fine) for the mechanism animation. Self-contained, no asset files.
- Nothing else. No bundler, no framework beyond these.

## Where content comes from (use it, don't invent)

- **`../interview-prep/NN-*.md`** — 36 question files (one per topic): pull each deck's scope/subtopics
  and its practice questions from the matching file. Match the topic numbering.
- **`../interview-prep/README.md`** — index + suggested learning path.
- **`../interview-prep/answer-keys/`** — TEACHER ONLY. **Never put answers on slides** (Practice = questions only).

---

## File structure

```
teaching-site/
  index.html          ← launcher: title + grid of topic-deck cards (only built decks)
  decks/
    attention.html    ← one reveal.js deck per topic
    transformers.html
  assets/
    deck.css          ← shared theme overrides, accent color, animation keyframes
    deck.js           ← shared reveal init + plugins + Mermaid init + reusable animation helpers
  CLAUDE.md           ← this file
```

Every deck links `assets/deck.css` + `assets/deck.js` and the CDN libs, and uses the same theme + init.

---

## How deep / how long

Each deck is a **full 30–45 minute lecture** (~40–60 slides, ≈1 min each). Cover **every major
approach** for the topic, classic → modern → current SOTA, with how each works and its trade-offs.
Keep the depth — but adapt it to the slide medium:

- **Slides = what friends see:** one idea per slide, visual, concise, big text, few words.
- **Speaker notes = my script:** put the deeper explanation, what I say out loud, extra detail, and
  answers to likely questions in reveal.js speaker notes (`<aside class="notes">…</aside>`). I open
  them with **`S`** while teaching. This keeps slides clean while preserving lecture depth.

## Deck structure (slides grouped by these sections, in order)

Use **horizontal slides for sections, vertical sub-slides within a section** (→ moves between
sections, ↓ goes deeper). Map the teaching template onto slides:

1. **Title** — `NN. Topic Name` + a one-line "what & why".
2. **Roadmap** — the agenda + the 4–6 core ideas to land.
3. **Why it matters / where it fits** — where this sits in the LLM/AI stack.
4. **Intuition** — analogy + a labeled diagram (1–2 slides). No heavy math.
5. **How it works** — the mechanism across several slides, INCLUDING the deck's main **animated,
   step-through visualization** (see Animations). Build it up with fragments.
6. **The approaches — full landscape** *(go DEEP here — this is the heart of the deck)* — a **vertical
   stack of slides per approach**. For EACH approach, in detail: what it is, **how it works step by
   step**, what problem it solves, pros/cons, when it's used, and **how it differs from the prior
   approach**. **Each major approach gets its OWN animation or animated diagram** showing how it works
   (or how it improves on the previous one) — make the *evolution* A → B → C visible, not just listed.
   Don't skip older approaches — "why did we move from X to Y" gets asked constantly.
7. **Compare the approaches** — a comparison-table slide (the interview cheat-sheet).
8. **The math** — KaTeX; reveal equation terms with fragments; explain each symbol in plain words.
9. **In code** — a highlighted snippet slide (PyTorch/NumPy-ish).
10. **Worked example** — step through a concrete / numeric example with fragments.
11. **When to use what** — a decision-guide slide (a Mermaid decision flow works well).
12. **Pitfalls / misconceptions** — "people think X, but actually Y".
13. **What's new in the industry** — current SOTA / recent techniques + **real papers** (title, year, link).
14. **Practice** — a few questions from `../interview-prep/NN-*.md` (questions only) + link the file.
15. **Key takeaways + further reading** — recap + a couple of resources.

---

## Animations & diagrams (REQUIRED in every deck)

- **Fragments everywhere:** reveal bullets, equation terms, and diagram parts one at a time so ideas
  build as I advance — this is the core step-by-step teaching motion.
- **At least one custom animated visualization** of the mechanism (in "How it works"): either with
  Play / Pause / Step / Reset controls, OR driven by slide fragments (advancing the slide advances the
  animation). Annotate each step on screen. **Respect `prefers-reduced-motion`** (show the final frame,
  no autoplay).
- **Animate the approaches too (section 6):** every major approach gets its OWN animated diagram or
  step-through — showing how it works, and ideally how it *improves on the previous approach*. The
  goal is to make the evolution between approaches visible (animate A → B → C), since that contrast is
  exactly what interviewers probe. Fragment-driven animations are fine here.
- **Diagrams:** Mermaid for flow/architecture; inline SVG for concept figures (attention matrices,
  vector spaces, sinusoids). Label every box, arrow, axis, symbol. No external image files.
- **Per-topic animation ideas** (one strong animation beats three weak ones):
  - *Attention*: Q·Kᵀ → scale → softmax → weighted sum of V, highlighting one query at a time.
  - *Transformers*: a token vector flowing through embed → attention → FFN → norm, shapes updating.
  - *Tokenization*: a live box splitting typed input into tokens/IDs.
  - *Positional encoding*: sinusoids of different frequencies summing onto a token.
  - *Decoding/sampling*: probability bars reshaping as a temperature / top-p slider moves.
  - *Diffusion*: a noisy image denoising step-by-step.
  - *RAG*: query → embed → retrieve top-k → stuff context → generate, lighting up each stage.
  - *Backprop*: gradients flowing backward, lighting up each weight update.
  - *MoE*: tokens routed to their top-k experts by a gate.
  - *KV cache*: cache cells filling as tokens are decoded one at a time.
- **Approach-evolution animation ideas** (for section 6 — animate the contrast between approaches):
  - *Attention variants*: MHA → MQA → GQA — animate query heads collapsing to share fewer K/V heads.
  - *Positional encoding*: sinusoidal → RoPE (rotating Q/K vectors) → ALiBi (linear distance penalty).
  - *Decoding*: greedy → beam → temperature/top-p — same logits, different selection, side by side.
  - *PEFT*: full fine-tune (all weights glow) → LoRA (only low-rank A·B update) → QLoRA (4-bit base).
  - *RL alignment*: RLHF (reward model + PPO loop) → DPO (no reward model) → GRPO (group baseline).
  - *Efficient attention*: full O(n²) attention map → sliding-window → linear/SSM recurrence.

---

## Design / UX (keep identical across decks)

- A clean, calm reveal.js theme + small custom CSS: one accent color, big readable type, generous
  spacing. Light by default; add a dark-theme toggle if it's easy.
- Enable and rely on: **progress bar, slide numbers, overview (`O`), speaker notes (`S`),
  fullscreen (`F`)**, keyboard + click nav. Put a tiny "keys: ←/→ ·  S notes ·  O overview ·  F full"
  hint on the title slide or launcher.
- Each deck: a title slide, a clear "Practice" slide, and a closing "Takeaways" slide.
- KaTeX math, highlighted code, and Mermaid diagrams must all render under `file://`.
- PDF export should work via appending `?print-pdf` to the URL (mention this on the launcher).

## index.html launcher

A simple grid of cards — one per built deck (topic title + a "Start ▶" link to `decks/<topic>.html`),
grouped roughly by the learning path in `../interview-prep/README.md`. Add a card for every new deck.

## Tone & accuracy

- Friendly, concrete, example-first. Assume basic Python/ML; explain jargon the first time it appears.
- **Be accurate.** Don't fake math or invent paper titles/links. Keep "industry" claims grounded.

## Definition of done (per deck)

- [ ] Opens by double-click under `file://`, no console errors; arrow + click navigation works.
- [ ] All 15 template sections present, in order; approaches covered classic → modern → SOTA with trade-offs.
- [ ] ~40–60 slides — a real 30–45 min lecture; deeper detail lives in **speaker notes** (`S`).
- [ ] The core mechanism has a working **animated step-through**, AND the **approaches section (6) is
      detailed with its own animation(s)** — each major approach animated, or the A → B → C evolution
      shown. Several labeled **Mermaid/SVG diagrams**; fragments build ideas; `prefers-reduced-motion` respected.
- [ ] KaTeX math, highlighted code, Mermaid, speaker notes, overview, and fragments all work.
- [ ] Practice slide uses questions from the right `../interview-prep/NN-*.md` (questions only — never `answer-keys/`).
- [ ] Added as a card on `index.html`; other decks untouched; matches existing decks' look & feel.

## When I give you multiple topics at once

- [ ] One **separate, complete deck per topic** — no merging.
- [ ] Each follows the full 15-section structure + animations + diagrams + speaker notes.
- [ ] Every new deck added to `index.html`; shared `assets/` built once if missing, then reused.
