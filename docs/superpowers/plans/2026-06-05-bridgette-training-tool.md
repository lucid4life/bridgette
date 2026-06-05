# Bridgette Bar Calgary Training Tool — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **This is a master plan across 6 sessions (S1a → S1b → S2 ∥ S3 → S4 → S5).** It locks the shared contracts (file layout, data schema, bundler, engine API, tests). **At the start of each session, run `superpowers:writing-plans` to expand THAT session's task list below into bite-sized, TDD-style steps**, then execute. Design source of truth: [`../specs/2026-06-05-bridgette-calgary-training-tool-design.md`](../specs/2026-06-05-bridgette-calgary-training-tool-design.md). Research basis: [`../../research/2026-06-05-research-convergence.md`](../../research/2026-06-05-research-convergence.md).

**Goal:** Turn the existing Calgary reference dashboard into an evidence-based active-recall training tool (flashcards + quizzes + Leitner spacing + Wine School + progress) that makes a beginner fluent in the wine list, substitutions, pairings, and pronunciation.

**Architecture:** Static, vanilla-JS, multi-file source in `src/` (loads from `file://`, offline, no framework, no ES-module `import`). A standard-library Python bundler inlines everything to one shareable `dist/Bridgette_Training.html`. State persists in `localStorage`. Content lives as structured data in `src/data.js`; logic in `src/app.js` (reference) + `src/training.js` (engine) + `src/wineschool.js` (lessons).

**Tech Stack:** HTML5, CSS3 (the existing Bridgette design system), vanilla ES5/ES2015-classic JavaScript (no modules, no bund30 build for the browser), `localStorage`, Web Speech API (pronunciation), Python 3 standard library (bundler + tests), `git`.

---

## Conventions (every session obeys these)

1. **No ES modules / no framework.** All JS is classic `<script src="...">` in `src/index.html`, executed in order, sharing a single global namespace `window.BB`. This is required for `file://` to work offline by double-click.
2. **Data is data.** No menu/wine/pairing/lesson strings hard-coded in `app.js`/`training.js`/`wineschool.js` — they read from `window.BB.data`.
3. **Accessibility is not a final-session afterthought** — each session ships its own `aria-*`, focus handling, and keyboard support; S5 is the audit, not the first time it's considered.
4. **Verify before claiming done.** Every session ends by running the Python checks AND a manual smoke test in a browser, using `superpowers:verification-before-completion`.
5. **Commit frequently**, then run `/code-review` before the final commit of the session.
6. **Preserve the Bridgette palette + contrast guardrails** from the spec (§11) — extend the design system, never replace it.

## File structure (locked in S1a)

```
Bridgette Barr/
  src/
    index.html        # landmarks + surface containers + <link>/<script> tags
    styles.css        # the Bridgette design system + new components
    data.js           # window.BB.data = { wines, foods, cocktails, translator, lessons, beerZero, bottleLadders, bottleMap }
    app.js            # window.BB.app — reference rendering, search/filter, nav, notes, print
    training.js       # window.BB.training — Leitner engine, deck generation, practice UI, progress, readiness, export/import
    wineschool.js     # window.BB.wineschool — lessons + deductive-grid tool
  dist/
    Bridgette_Training.html   # bundler output (gitignored)
  build_single_file.py        # the bundler (stdlib only)
  tests/
    check_dashboard.py          # existing static checks (extended)
    check_dashboard_contrast.py # existing contrast checks (kept)
    check_training.py           # NEW: decks/data/bundler integrity
  Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html  # legacy single-file, kept until S5 for rollback
  docs/ ...
  .gitignore        # dist/, verification/chrome-profile*/, __pycache__/
```

## The data contract (authored in S1b; consumed by S2/S3/S4)

`src/data.js` assigns one global. Stable `id` slugs are mandatory — they key Leitner state.

```javascript
window.BB = window.BB || {};
window.BB.data = {
  wines: [
    {
      id: "hiedler-loss",                 // stable slug — NEVER reuse/rename casually
      name: "Hiedler Löss",               // correct accents, matched to source_menus/
      category: "White",                  // Bubbly | White | Rosé | Red | No-Alcohol
      glass: true,                         // by-the-glass vs bottle-only
      price: "15 | 24 | 75",
      grape: "Grüner Veltliner",
      region: "Niederösterreich, Austria",
      country: "Austria",                  // drives speak-button utterance.lang
      vintage: "2024",
      vegan: true,                          // from the 'v' menu marker
      pronunciation: { say: "Hiedler Löss", respell: "HEED-ler LURSS" },  // respell is authoritative
      structure: { acidity: "high", body: "medium", tannin: "low", sweetness: "dry" }, // low|medium|high (WSET 3-pt)
      tenSecond: "The crisp, peppery white — my pick for green, tangy, spicy, or herb-driven plates.",
      profile: "Lime, green apple, white pepper, herbs, and a food-friendly snap.",
      pair: ["Smashed Cucumbers", "Eggplant Fries", "Hummus Chips", "Bibb Lettuce", "Tuna Crudo"],
      avoid: "Not the best match for ribeye or very rich mushroom pasta.",
      say: "This is the crisp, peppery white I'd use for green, tangy, spicy, or herb-driven dishes.",
      mnemonic: "Löss = loess = the chalky soil = chalky-crisp white pepper",   // optional
      upgrade: "Landron Muscadet for seafood, or Denizot Sancerre for a premium crisp-white lane.",
      tags: ["white", "gruner", "spice", "green", "seafood", "safe"]
    }
    // ... all BTG wines + the bottle-only wines needed by ladders/map/translator
  ],
  foods: [ /* existing FOOD entries; pair/flags as arrays; + why, + optional mnemonic */ ],
  cocktails: [ /* existing COCKTAILS entries; reference-only in v1 */ ],
  translator: [
    {
      ask: "Sauvignon Blanc",
      aliases: ["sauv blanc", "sauvignon"],
      bestGlass: "Hiedler Löss",
      bottleOptions: ["Denizot Sancerre", "Landron Muscadet"],
      familiar: "High freshness, citrus, green/herbal lift, clean finish.",
      different: "Grüner is less grassy, more white-peppery, with a bit more weight.",
      phrase: "If you like Sauvignon for crispness, I'd go Grüner by the glass; if you want the exact grape, Sancerre is our bottle lane."
    }
    // ... all common asks from the current static translator table
  ],
  lessons: [
    {
      id: "structure-words",
      title: "What the structure words mean",
      body: "Acidity / body / tannin / sweetness, explained with wines from THIS list.",
      workedExample: "Hiedler Löss = high acidity (makes your mouth water) + low tannin...",
      quickCheck: { q: "Which has the most tannin?", choices: ["Hiedler Löss", "St. John Claret", "Ameztoi Rubentis"], answer: 1 }
    }
    // ... the lessons listed in spec §10
  ],
  beerZero: [ /* existing BEER_ZERO strings */ ],
  bottleLadders: [ /* existing */ ],
  bottleMap: [ /* existing */ ]
};
```

**Card** objects are derived at runtime (NOT stored in data.js):
`{ id: "<deck>:<itemId>:<type>", deck, prompt, answer, why?, choices?, audioText?, lang?, learnLink? }`

**Progress** (localStorage key `bb_progress_v1`) — exact shape locked in the spec §6.

## The bundler (authored in S1a — this is the complete file)

```python
# build_single_file.py — inline src/styles.css + src/*.js into one portable HTML.
# Standard library only. Usage: python build_single_file.py
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

def inline(html: str) -> str:
    def css_repl(m):
        css = (SRC / m.group(1)).read_text(encoding="utf-8")
        return f"<style>\n{css}\n</style>"
    html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', css_repl, html)
    def js_repl(m):
        js = (SRC / m.group(1)).read_text(encoding="utf-8")
        return f"<script>\n{js}\n</script>"
    html = re.sub(r'<script[^>]*\ssrc="([^"]+)"[^>]*>\s*</script>', js_repl, html)
    return html

def main():
    DIST.mkdir(exist_ok=True)
    html = (SRC / "index.html").read_text(encoding="utf-8")
    out = inline(html)
    (DIST / "Bridgette_Training.html").write_text(out, encoding="utf-8")
    print(f"Built dist/Bridgette_Training.html ({len(out):,} bytes)")

if __name__ == "__main__":
    main()
```

## Test strategy (extended each session)

- `tests/check_dashboard.py` — keep existing required-content / no-stale-language / landmark checks; update IDs as surfaces change.
- `tests/check_dashboard_contrast.py` — keep as-is.
- `tests/check_training.py` (new, S1a onward) — asserts: `src/data.js` parses under Node `--check`; every `wines[].id` is unique; wine names/accents appear in `source_menus/` text; after S4, each deck generates ≥1 card with non-empty prompt+answer; **bundler integrity** = re-run `build_single_file.py` and assert `dist/Bridgette_Training.html` is byte-identical to the committed copy.
- Python runner: `& "C:\Users\abeek\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"` (or any Python 3); JS parse via the bundled Node `--check`.
- **Manual smoke test** each session (browser, `src/index.html`): the session-specific flows in its acceptance list.

---

## Session S1a — Structural refactor + bundler + git  ·  thinking: **think hard**

**Goal:** Split the 111KB single file into `src/` multi-file, behavior-identical, with a working bundler and git history. **No content changes, no new features** — pure, verifiable refactor.

**Files:** Create `src/index.html`, `src/styles.css`, `src/data.js`, `src/app.js`; create `build_single_file.py`, `.gitignore`, `tests/check_training.py`; keep legacy HTML at root.

**Tasks (expand each to TDD steps via writing-plans at session start):**
- [ ] `git init`; add `.gitignore` (`dist/`, `verification/chrome-profile*/`, `__pycache__/`); initial commit of the current tree.
- [ ] Extract the `<style>` block from the legacy HTML verbatim into `src/styles.css`.
- [ ] Extract the existing `WINE/FOOD/COCKTAILS/BEER_ZERO/bottleLadders/bottleMap` arrays verbatim into `src/data.js` as `window.BB.data = {...}` (rename keys to `wines/foods/cocktails/...`; **do not enrich yet** — that's S1b). Add `id` slugs now (the only structural addition).
- [ ] Move the remaining JS (rendering/search/filter/notes/print) into `src/app.js` reading from `window.BB.data`.
- [ ] Build `src/index.html` = the legacy markup with `<link rel="stylesheet" href="styles.css">` and `<script src="data.js"></script><script src="app.js"></script>`.
- [ ] Write `build_single_file.py` (code above); run it; confirm `dist/Bridgette_Training.html` opens and behaves like the legacy file.
- [ ] Write `tests/check_training.py` (data parses, unique ids, names-in-source, bundler byte-identical). 
- [ ] Update `tests/check_dashboard.py` to point at `src/index.html` (or the built dist) for its content checks.

**Verification / acceptance:** all three Python checks pass; `src/index.html` and `dist/Bridgette_Training.html` are visually + behaviorally identical to the legacy file (search, filters, notes, print, save). Commit. Run `/code-review`.

**Depends on:** nothing. **Blocks:** everything.

---

## Session S1b — Data enrichment + accuracy verification  ·  thinking: **ultrathink**

**Goal:** Enrich `src/data.js` to the full contract and make the static translator table data-driven — with every new fact accuracy-checked. **This is the data contract everything downstream consumes; correctness is the priority.**

**Files:** Modify `src/data.js`; modify `src/app.js` (render translator + structure meters from data, remove the static `<table>`); modify `tests/check_training.py`.

**Tasks:**
- [ ] For every wine: add `pronunciation.respell` (verify against a wine-pronunciation source; respelling is authoritative), `structure` as low/medium/high (seed from grape/region norms; label uncertain ones — see spec §13), `tenSecond`, `mnemonic` (optional), `country`, `vegan`, convert `pair` to arrays, add `aliases` where useful.
- [ ] Fix names/accents to match `source_menus/` (e.g. **Hiedler Löss**, **Dürkheimer**, **Cusumano**). 
- [ ] Build `data.translator[]` from the current static table; delete the static HTML table; render it from data in `app.js`.
- [ ] For every food: add `why` (the structural reason, WSET levers), arrays for `pair`/`flags`.
- [ ] Add `data.lessons[]` stubs (titles + ids) so S3 has anchors for `learnLink` (full lesson bodies are S3).
- [ ] Extend `check_training.py`: assert every wine has pronunciation+structure+tenSecond; structure values ∈ {low,medium,high,dry,off-dry,...}; translator non-empty; names still match source.

**Verification / acceptance:** Python checks pass; spot-check 5 pronunciations + 5 structure ratings against sources; translator renders from data and matches the old table's coverage. Commit. Run `/code-review`.

**Depends on:** S1a. **Blocks:** S2, S3, S4.

---

## Session S2 — Learning engine + Practice + Progress  ·  thinking: **ultrathink**

**Goal:** Build `src/training.js`: the Leitner engine (per spec §8 with the convergence corrections), Practice UI (flashcards + quiz, Focus + Mixed), Progress surface (mastery, weak list, lenient streak, guided path), and Export/Import.

**Files:** Create `src/training.js`; modify `src/index.html` (Practice + Progress containers, nav, `<script src="training.js">`); modify `src/styles.css` (cards, flip, rings, feedback states, study screen).

**Key interfaces (define exactly; expand to TDD via writing-plans):**
```javascript
// Leitner
const BOX_DUE_DAYS = {1:0, 2:1, 3:3, 4:7, 5:14};        // spec §8
function grade(card, correct) { /* correct→+1 box; wrong→ -1 box, reset to 1 only after 2 consecutive misses; set due = today + BOX_DUE_DAYS[box] */ }
function isDue(cardState, today) { /* today >= due */ }
function buildSession(deckId|null, {newCap:~9, sizeCap:~18}) { /* due + weak + capped new; Smart Review when deckId null */ }
function normalizeAnswer(s) { /* lowercase, strip accents/punct/articles */ }
function gradeTyped(card, input) { /* normalize + alias/token match → bool; UI still offers self-override */ }
// Progress
function masteryFor(deckId|tag) {...}  function recordResult(card, correct) {...}
function exportProgress() {...}  function importProgress(json) {...}
```
**Card difficulty by box** (spec §8): box 1–2 multiple-choice + worked example; 3–4 typed; 5 scenario. **Streak** lenient (1 grace day). **Backlog** capped + "you're caught up" state.

**Tasks:** engine module + unit tests (grade/isDue/buildSession/normalizeAnswer) → Practice UI (flashcard flip with reduced-motion fallback; quiz MC + typed + self-override; keyboard: Space flip, 1–4 choose/grade, Enter next; `aria-live` feedback) → Progress surface (rings with text labels, weak list, streak, guided-path "start here / do next", export/import buttons) → wire localStorage `bb_progress_v1` with schema-migration on load.

**Verification / acceptance:** engine unit tests pass; a Focus and a Mixed session each serve capped cards, grade, persist box+due+mastery+streak across reload; export then import round-trips; reduced-motion respected. Commit. Run `/code-review`.

**Depends on:** S1b. **Parallelizable with S3** (separate worktrees — see Parallelization). **Blocks:** S4.

---

## Session S3 — Wine School fundamentals  ·  thinking: **think hard**

**Goal:** Build `src/wineschool.js`: the focused lessons (spec §10), each with a worked example + quick check, and the beginner deductive-grid tool. Provide the `learnLink` anchor targets cards use.

**Files:** Create `src/wineschool.js`; modify `src/index.html` (Learn container, nav, `<script src="wineschool.js">`); modify `src/styles.css` (lesson + grid styles); fill `data.lessons[]` bodies in `src/data.js`.

**Tasks:** author lesson content (structure words; tasting in 4 steps; the 6 pairing levers with exact WSET phrasings — acid cuts fat, tannin binds protein, salt softens tannin, sweet tames heat, etc.; pronunciation primer; Ask→Match→Explain→Confirm) → render lessons (body + worked example + one quick-check, `aria-live` result) → deductive-grid tool (pick structure clues → reveal likely grape/style using the list's own wines) → ensure each lesson `id` is a stable `learnLink` target.

**Verification / acceptance:** every spec §10 lesson present with worked example + quick check; deductive grid returns sensible results; quick-check answers correct; keyboard + `aria` on interactive bits. Commit. Run `/code-review`.

**Depends on:** S1b (lesson stubs/anchors). **Parallelizable with S2.** **Blocks:** S4 (its cards `learnLink` into these lessons).

---

## Session S4 — Decks, content depth & Readiness Check  ·  thinking: **think hard**

**Goal:** Build the five deck generators, scenario cards, card→lesson links, and the Readiness Check gauntlet — all reading from `data` and feeding the S2 engine.

**Files:** Modify `src/training.js` (deck generators + readiness); modify `src/data.js` only if a field is missing; modify `src/index.html` (Readiness Check entry).

**Decks (each a pure function `data → Card[]`):** Translator (`ask → bestGlass + phrase`), Wine Identity (name↔grape/region/style + structure), Pronunciation (name → respell + speak), Pairing+why (dish → BTG **and** the reason; box-5 scenario), Structure (low/med/high discrimination). Each card sets `learnLink` to a lesson id.

**Tasks:** implement + unit-test each generator (≥1 valid card, correct answer keys) → scenario card format for box 5 → **Readiness Check**: sample N cards across all live decks, score %, compute weak areas by tag, write `readiness` to progress → "speak" button via Web Speech API with `utterance.lang` from `wine.country`, respelling always visible.

**Verification / acceptance:** `check_training.py` deck assertions pass; each deck drillable end-to-end through the engine; Readiness Check returns a score + weak-area list; pronunciation speaks and shows respelling. Commit. Run `/code-review`.

**Depends on:** S2 (engine) + S1b (data) + S3 (lesson targets). **Blocks:** S5.

---

## Session S5 — Visual polish, accessibility & final QA  ·  thinking: **think hard** (use **ultrathink** for the QA/audit pass)

**Goal:** Make it beautiful and correct: design refinement within the Bridgette system, a real WCAG-oriented a11y pass, reduced-motion, print modes, final verification, and ship the bundle.

**Files:** Modify `src/styles.css`, small touch-ups across `src/*.js`/`index.html`; rebuild `dist/`; optionally remove the legacy root HTML.

**Tasks:** visual refinement (rings, flip, feedback states, study screen, structure meters, deductive grid — laptop-first depth) → accessibility audit (landmarks, focus order, keyboard traps, `aria-live` regions, ring text-labels, contrast incl. gold-on-ink) using `accessibility` + `web-quality-audit` skills → reduced-motion verification → print modes intact → run full `tests/*` + the full manual smoke test (spec §13) → rebuild bundle, confirm byte-diff test passes → optional: delete legacy single-file after parity confirmed.

**Verification / acceptance:** every spec §15 acceptance criterion demonstrably met; all Python checks pass; full smoke test passes; `dist/Bridgette_Training.html` is current. Final commit. Run `/code-review`, then `/security-review` is **not required** (static, no backend/secrets).

**Depends on:** S1a, S1b, S2, S3, S4.

---

## Parallelization

- **S1a → S1b** strictly sequential, block everything.
- **S2 ∥ S3** is the only parallel opportunity. Safe ONLY in **separate git worktrees** because both touch `index.html` and `styles.css`. If running parallel: `git worktree add ../bb-s2 -b session/engine` and `git worktree add ../bb-s3 -b session/wineschool`; each session owns its own JS file; merge S3 then S2 (or vice-versa) and resolve the small `index.html`/`styles.css` overlaps. **Recommendation: run S2 then S3 back-to-back** unless you want the speed — the merge risk usually outweighs the time saved for a solo build.
- **S4** then **S5** strictly sequential.

## Self-review (writing-plans checklist)

- **Spec coverage:** every spec §4 in-scope item maps to a session (Reference→S1a/b; Practice+engine→S2; decks→S4; Wine School→S3; Progress/guided path/export-import→S2; Readiness→S4; audio→S4; accuracy→S1b/§13; bundler/git→S1a; polish/a11y→S5). ✔
- **Type consistency:** `window.BB.data` keys, `id` slug scheme, `BOX_DUE_DAYS`, card shape, and `bb_progress_v1` schema are used identically across S1b/S2/S4. ✔
- **No placeholders:** bundler is complete code; data contract is a concrete example; engine interfaces are named. Per-step TDD code is intentionally produced by each session's own `writing-plans` pass (this is a master plan over 6 subsystems). ✔
