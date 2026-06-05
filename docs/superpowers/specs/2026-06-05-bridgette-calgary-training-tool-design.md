# Bridgette Bar Calgary Training Tool — Design Spec

**Date:** 2026-06-05
**For:** Adrian Beeksma
**Supersedes the direction of:** `2026-06-04-bridgette-calgary-reference-dashboard-design.md` (that dashboard becomes the "Reference" surface inside this tool)

---

## 1. Goal

Transform the existing Calgary **reference dashboard** into an **active-recall training tool** that makes Adrian fluent in the Bridgette Bar Calgary drink and food program. Adrian is a **beginner building fundamentals**, studying **at home on a laptop**, with **a few weeks of runway** before he needs to be floor-fluent.

"Fluent" means, without looking it up:
- When a guest asks for a common varietal (Cab, Sauv Blanc, Pinot Grigio…), confidently steer them to the right Bridgette wine **and say the line**.
- Recall the by-the-glass list — grape, region, style — and **pronounce each name** for a guest.
- Recommend a wine for any dish **and explain why it works** (the structural reason), so he can improvise.
- Understand the fundamentals beneath all of it (acid, tannin, body, sweetness; the pairing levers).

## 2. What already exists (and is reused)

A strong single-file dashboard (`Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html`, ~111KB) with:
- Structured `WINE` / `FOOD` / `COCKTAILS` data including table-ready "say" phrases and honest caveats.
- A disciplined Bridgette design system (Oswald, deep-ink workbook aesthetic, contrast-safe palette).
- A static "Common Guest Ask Translator" table, bottle ladders, bottle map.
- A11y hooks, `localStorage`, print modes, and Python verification scripts.

**~70% of this content carries forward.** The data, "say" phrases, caveats, and visual DNA are kept. What changes is the *scaffolding* (multi-file, data-driven) and what's *added* (a learning engine, Wine School, pronunciation, progress).

## 3. Pedagogical foundation (why the tool is shaped this way)

Every major design decision traces to evidence:

1. **Retrieval practice + spaced practice are the two highest-utility study techniques; rereading/highlighting are low utility** (Dunlosky et al., 2013). → The core loop is **self-testing (flashcards + quizzes) on a spaced schedule**, not a page you reread.
2. **Beginners need blocked practice first (one category at a time) to build a framework, then interleaved (mixed) practice for durable, flexible recall** (interleaving / sequence-learning research, 2021). → Two practice modes: **Focus** (drill one deck) → **Mixed** (jump across decks), with the tool nudging Adrian to Mixed as each cluster is mastered.
3. **Novices learn best from worked examples with full guidance, and that guidance must fade as expertise grows** (worked-example & expertise-reversal effects). → **Adaptive difficulty driven by the Leitner box**: recognition + worked example early → typed recall → open scenario late.
4. **Elaborative interrogation / self-explanation ("why does this work?") is a moderate-utility technique.** → The pairing deck retrieves the *reason* ("acid cuts fat", "tannin needs protein"), not just the answer.
5. **Sommelier/WSET methods:** clustered flashcards, mnemonics for hard names/geography, a structured deductive tasting grid. → **Structure meters** on every wine, a **deductive-grid lesson + card type**, and **memory hooks** for the toughest names.

**Validated by a 3-layer research-convergence pass (2026-06-05) — see [`docs/research/2026-06-05-research-convergence.md`](../../research/2026-06-05-research-convergence.md).** Refinements that pass forced into this spec: separate the new-card limit (~8–10/session) from total session size to prevent review-pile burnout (the #1 reason learners quit); soften the lapse rule (demote one box, not a hard reset); use the **WSET 3-point low/medium/high** structure scale for a beginner instead of false-precision 1–5; keep the streak lenient. Leitner (vs SM-2/FSRS) was *confirmed* correct for a small single-learner deck, and the substitution mappings (e.g. Grüner↔Sauvignon Blanc, Pinot Blanc↔Pinot Grigio) were independently validated against wine authorities.

## 4. Scope

### In scope (v1, across sessions)
- **Reference surface** — the current dashboard content, improved and rendered from data.
- **Practice surface** — Flashcards + Quiz; Focus + Mixed modes; Leitner engine; adaptive difficulty.
- **Decks** (all generated from data): Translator, Wine Identity, Pronunciation, Pairing (+why), Structure.
- **Wine School** — focused fundamentals: structure words, how to taste, the pairing levers, a beginner deductive grid, a pronunciation primer, and the Ask→Match→Explain→Confirm service rhythm.
- **Progress surface** — per-deck **and per-attribute** mastery, weak-item list, study streak, a **guided first-run path** ("start here → do this next"), and "what to study next."
- **Readiness Check** — a mixed, exam-like gauntlet across all decks that returns a % shift-ready score plus a weak-area breakdown.
- **Audio pronunciation** — browser Web Speech API ("speak" button, language set per wine's country) + phonetic respelling, which is always shown and is the authoritative guide.
- **Progress backup** — Export / Import progress as a JSON file (protects study from browser/OneDrive/`file://` quirks).
- **Data model enrichment** — pronunciation, structure ratings (low/medium/high), 10-second pitch, Q/A pairs, mnemonics, answer aliases; translator becomes structured data; wine names/accents corrected against `source_menus/`. Enriched fields are accuracy-verified (see §13).
- **Architecture** — multi-file source, a no-dependency Python bundler to one shareable HTML, and `git init`.

Deferred (still visible in Reference, just not *drilled* in v1): a **Safety deck** for allergy flags. It remains a high-priority later session.

### Out of scope (non-goals for v1)
- Full SM-2 / Anki scheduling algorithm (Leitner is deliberately simpler).
- A dedicated mobile-optimized layout (we lay responsive groundwork only; a mobile pass is a later project).
- Multi-user accounts or cloud sync (progress is per-device `localStorage`).
- POS integration or live menu sync.
- **Drilling** cocktails and allergy-safety (they remain in Reference from day one; a Cocktail/Safety deck is a deliberate later session, not v1's first decks).
- A full WSET-style curriculum.

## 5. Architecture

- **Source files:**
  - `index.html` — markup, landmarks, surface containers.
  - `styles.css` — the Bridgette design system + new components.
  - `data.js` — all menu/wine/food/cocktail/translator content + Wine School lesson content, as structured data on a global (e.g. `window.BB`). The part that changes when the menu changes.
  - `app.js` — reference rendering, search/filter, nav, notes, print.
  - `training.js` — Leitner engine, deck generation, flashcard/quiz UI, progress.
  - `wineschool.js` — lesson rendering and the deductive-grid mini-tool.
- **Loading:** classic `<script src>` tags (works from `file://`, offline, no server). **No ES-module `import`, no framework, vanilla JS** — required so it opens by double-click.
- **Shipping:** `build_single_file.py` (Python standard library only) inlines CSS + JS into one `dist/Bridgette_Training.html` for emailing/USB. Optional later: deploy `dist/` to Cloudflare Pages or GitHub Pages for a shareable link + mobile.
- **Version control:** `git init` the project for history, undo, and safe parallel sessions via worktrees. Add a `.gitignore` for `verification/chrome-profile*/` and `dist/`.

## 6. Data model (the contract)

This is the most important section: Session 1 produces this; Sessions 2–4 consume it. Stable `id` slugs are required because they key Leitner state.

**Wine entry:**
```
{
  id, name, category,            // category: Bubbly | White | Rosé | Red | No-Alcohol
  glass: bool,                   // by-the-glass vs bottle-only
  price, grape, region, country, vintage,
  vegan: bool,                   // from the 'v' menu marker
  pronunciation: { say, respell },   // respell e.g. "GROO-ner FELT-lee-ner"
  structure: { acidity, body, tannin, sweetness },  // low | medium | high (WSET 3-point beginner scale — not false-precision 1–5)
  tenSecond,                     // the 10-second pour pitch
  profile, pair: [..], avoid, say,   // 'say' = table phrase (kept)
  mnemonic,                      // optional memory hook
  upgrade, tags: [..]
}
```

**Food entry:** existing fields + `pair`/`flags` as arrays, plus a `why` (structural reason) and optional `mnemonic`.

**Cocktail entry:** existing fields (reference-only in v1).

**Translator entry** (replaces the static table):
```
{ ask, aliases: [..], bestGlass, bottleOptions: [..], familiar, different, phrase }
```

**Lesson entry (Wine School):**
```
{ id, title, body, workedExample, quickCheck: { q, choices, answer } }
```

**Card** (derived at runtime, not stored in data.js):
```
{ id: "<deck>:<itemId>:<type>", deck, prompt, answer, why?, choices?, audioText? }
```

**Progress (localStorage, `bb_progress_v1`):**
```
{
  schema: 1,                     // bumped on breaking changes; enables migration
  cards: { "<cardId>": { box: 1–5, due, lastSeen, correct, wrong } },  // due = day-based
  decks: { "<deckId>": { mastery: 0–100 } },
  tags:  { "<tag>":    { mastery: 0–100 } },   // per-attribute (regions, grapes, etc.)
  readiness: { lastScore, lastTaken, weakAreas: [..] },
  streak: { current, lastStudyDate },
  settings: { difficulty, audio }
}
```
**Content-change migration:** when `data.js` changes and card IDs appear/disappear, the engine reconciles on load — new IDs start at box 1, orphaned IDs are dropped, existing progress is preserved. Export/Import round-trips this whole object as JSON.

## 7. Surfaces & information architecture

Top nav: **Learn (Wine School) · Practice · Reference · Progress** (Notes/Print retained).

- **Practice** — pick a deck (Focus) or "Smart Review" (Mixed, due+weak cards). Serves a session of cards, grades them, updates boxes + mastery, shows a summary. Card format scales with box (recognition → recall → scenario).
- **Reference** — the improved dashboard: searchable wine/food/cocktail cards with structure meters, pronunciation buttons, the data-driven translator, ladders, map, safety notes, print modes.
- **Learn** — Wine School lessons (worked example + quick check each) and the deductive-grid tool.
- **Progress** — mastery rings per deck + per attribute, the weak list, streak, a **guided first-run path** that walks a beginner through a recommended order (Wine School L1 → Focus: translator → Focus: whites → … → Mixed review), a **Readiness Check** launcher, "study next," and **Export / Import progress**.

## 8. Learning engine

- **Leitner, 5 boxes** — validated by the research-convergence pass: for a *small, single-learner* deck, Leitner performs on par with SM-2/FSRS, and the real driver of success is **consistency + avoiding backlog**, not the algorithm. Correct → promote one box.
- **Gentle lapse rule:** a wrong answer demotes the card **one box** (not a hard reset to box 1), with a brief same-session re-show; a card resets to box 1 only after **two consecutive misses**. Hard resets are what inflate the review pile that drives quitting.
- **Concrete spaced cadence (day-based):** each box sets a "minimum days until due" — **box 1 = 0 days (same session OK), box 2 = 1, box 3 = 3, box 4 = 7, box 5 = 14 (maintenance).** A card is "due" when `today ≥ due`. This aligns with the ~20%-of-retention-interval optimum for a few-weeks horizon (Cepeda et al.).
- **Two separate limits (the key anti-burnout finding):** cap **new cards at ~8–10 per session** (introducing more is the #1 cause of review-pile burnout and quitting), *and* cap the total session at **~15–20 cards / ~10–15 min** (due + weak + a few new). These are different knobs — the original spec wrongly conflated them.
- **Backlog protection:** a missed day never builds a punishing pile — overdue cards are surfaced gently and capped, with a "you're caught up" state instead of a scary number.
- **Lenient streak:** a study streak for momentum, but with a built-in grace/freeze day — strict streaks cause anxiety and abandonment, while leniency *increases* engagement (Duolingo habit research).
- **Adaptive card difficulty by box:** boxes 1–2 = multiple-choice + worked example (recognition); boxes 3–4 = type-the-answer (recall); box 5 = scenario/production ("a guest says X — what do you pour and say?").
- **Typed-answer grading:** normalize both sides (lowercase, strip accents/punctuation/articles), accept `aliases` and key tokens, near-match tolerance — and **always offer an "I actually got it / I didn't" self-override** (self-rating is itself evidence-based). Never punish a right answer typed imperfectly.
- **Weak-item weighting:** within a session, the draw is weighted toward low-box and recently-missed cards; mastery is tracked per deck **and per attribute tag** (so the weak list can say "weak on *regions*", not just "weak on *Wine Identity*").
- **Focus → Mixed nudge:** Focus drills one deck/category (blocked practice, for initial encoding); once its mastery passes a threshold the tool suggests Mixed review (interleaved, for durable recall).
- **Stuck? Learn it.** Every card carries a deep-link to its relevant Wine School concept, so hitting an unknown card routes back to teaching instead of a dead end.
- **Session flow:** choose deck or Smart Review → serve capped set → answer → grade (auto for MC/typed + self-override) → update box + due date + mastery + streak → session summary (what improved, what's still weak, suggested next step).

## 9. Decks & card types (all generated from data)

- **Translator** — "Guest asks for {ask} — your by-the-glass answer?" → bestGlass (+ phrase, + bottle options). Adrian's #1 priority.
- **Wine Identity** — name → grape/region/style, and the reverse; structure recall.
- **Pronunciation** — show name → say it → reveal respelling + audio (speak button).
- **Pairing (+why)** — dish → best BTG **and the structural reason**; box 5 = open scenario.
- **Structure** — "Which is highest-tannin / highest-acid of these three?" reinforcing fundamentals.

Every generated card carries a `learnLink` to the Wine School concept it tests. The **Safety deck** (allergy flags) is intentionally **not** built in v1 — deferred to a later session. The **Readiness Check** is not a deck; it's a mixed gauntlet that samples across all live decks.

## 10. Wine School lessons (focused)

Structure words (acid / body / tannin / sweetness, using the list's own wines as examples) · How to taste in 4 steps · The pairing levers (fat, salt, acid, sweet, heat, intensity) · A beginner deductive grid (structure clues → likely grape/style) · Pronunciation primer (the sounds in these names) · Talking to a guest (Ask → Match → Explain → Confirm). Each lesson: short body + worked example + one quick check.

## 11. Visual / UX design

Keep the Bridgette system (Oswald, deep-ink workbook, contrast-safe `--accent-dark`/`--label-light`). New components: progress rings + mastery bars in brand colors; a tasteful flashcard flip; clear right/wrong quiz feedback states; a calm focused study-session screen; speaker buttons; structure meters (low / medium / high); the deductive grid. Laptop-first spacing and depth. Honor `prefers-reduced-motion` everywhere (flip becomes a fade; no motion-dependent meaning).

## 12. Accessibility

Maintain semantic landmarks. `aria-live` for quiz feedback and session status. Manage focus through the study flow (focus the prompt, then the answer). Keyboard support in Practice (Space = flip, 1–4 = grade/choose, Enter = next). Maintain WCAG-oriented contrast; never orange-on-cream for small text. Speaker buttons are supplementary, never the only way to get pronunciation (respelling is always shown). Progress rings/meters carry text-equivalent labels (e.g. `aria-label="Reds: 64% mastered"`), never color/shape alone. The pronunciation `speak` button sets `utterance.lang` to the wine's country where a voice exists, but the respelling remains the authoritative guide since browser TTS may mispronounce foreign names.

## 13. Testing & verification

Extend the existing Python checks:
- Required content/sections/IDs present; no stale interview-era language (existing).
- Contrast pairs (existing).
- **New:** every deck generates ≥1 valid card with non-empty prompt+answer; every wine `id` is unique; wine names match `source_menus/` (accent/spelling integrity); `data.js` parses (Node `--check`).
- **Bundler integrity (real, not a size guess):** the test re-runs `build_single_file.py` and diffs against the committed `dist/` output — they must be byte-identical, proving the shipped file is in sync.
- **Enriched-data accuracy (the highest-risk part):** during S1b, every new pronunciation respelling and structure score is cross-checked against an authoritative source; structure scores that can't be sourced are seeded from grape/region norms and labelled "approx — confirm by tasting" in the data, so the tool never asserts an unverified sensory fact as gospel.
- Manual smoke test checklist per session (search, a Focus session, a Mixed session, a Readiness Check, export then import progress, save/notes persist across reload, a Wine School quick check, a pronunciation speak button, print modes).

## 14. Session breakdown (summary — full prompts delivered separately)

```
S1a Structural refactor: split into index/styles/data/app.js, move existing
    data VERBATIM, bundler (build_single_file.py), git init + .gitignore.
    Page must look/behave identical to today.                      (blocks all)
        │
S1b Data enrichment + accuracy verification: pronunciation (respell+lang),
    structure scores (1–5, sourced or flagged approx), tenSecond, mnemonic,
    why, aliases; translator → structured data; fix accents vs source.
        │   (defines the data contract everything else consumes)
   ┌────┴────┐
  S2 Engine          S3 Wine School      ← may run in PARALLEL only in separate
  (Leitner+cadence,  (lessons + worked      git worktrees owning disjoint files
   adaptive diff,     examples + quick       (each owns its own JS; both touch
   typed grading,     checks + deductive     index.html/styles.css, so otherwise
   Practice UI,       grid + learnLink       run back-to-back).
   Progress + guided  targets)
   path + export/import)
   └────┬────┘
  S4 Decks & content depth: 5 deck generators (translator, wine-identity,
     pronunciation, pairing+why, structure) + scenarios + card→lesson links
     + the Readiness Check gauntlet.
        │
  S5 Visual polish + accessibility/WCAG pass + reduced-motion + ring labels
     + final QA + full smoke test + ship the bundle.
```

**Thinking levels:** S1a *think hard* · S1b *think hard* (accuracy-critical) · S2 *think hard* · S3 *think* · S4 *think* · S5 *think hard*.

**Dependencies & parallelism:**
- **S1a → S1b** are strictly sequential and block everything (S1b defines the data contract).
- **S2 ∥ S3** is the only parallel opportunity, and only if run in **separate git worktrees** (they share `index.html`/`styles.css`); otherwise run them back-to-back. For a solo project I lean back-to-back — small time saving, real merge risk.
- **S4** needs S2 (engine) + S1b (data) + S3 (lesson links target real lessons).
- **S5** needs everything.

## 15. Acceptance criteria

- Opens locally by double-clicking `index.html` — no server, works offline.
- `build_single_file.py` produces one self-contained `dist/Bridgette_Training.html` that behaves identically.
- Practice works: Focus and Mixed sessions serve cards, grade them, and persist Leitner state + mastery + streak across reloads.
- Difficulty adapts by box (recognition → recall → scenario); typed answers grade with normalization + alias matching + an "I got it / I didn't" self-override.
- The five decks all generate valid cards from `data.js`; the translator is data-driven; each card deep-links to its Wine School concept.
- Every wine has structure meters, a 10-second pitch, pronunciation (respelling + working speak button); enriched fields are accuracy-verified or labelled "approx."
- Wine School has the listed lessons, each with a worked example and a quick check.
- Progress surface shows per-deck **and per-attribute** mastery, weak list, streak, and the guided first-run path.
- A **Readiness Check** runs a mixed gauntlet and returns a % shift-ready score + weak-area breakdown.
- **Export / Import progress** round-trips the full progress object as JSON; content-change reconciliation keeps existing progress on data updates.
- Wine names/accents match the source menus; no stale interview-era language.
- Bridgette palette + contrast guardrails intact; reduced-motion respected; progress meters have text-equivalent labels.
- All Python checks pass (including bundler byte-diff); manual smoke test passes.
```
