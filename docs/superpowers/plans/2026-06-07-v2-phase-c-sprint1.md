# Bridgette v2 — Phase C Sprint 1 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **NOTE (2026-06-07):** the account hit a session limit mid-session (resets ~3:30pm America/Edmonton). Phase B content-sourcing must be re-run after reset. This sprint is built **inline by the main agent** and needs no subagents.

**Goal:** Ship the audit's highest-ROI wins that run on data that *already exists* — render the recommendations/upselling/pairing data the UI currently drops, add the two missing retrieval decks (cocktail-pairing, upsell), tighten distractors, and bank a free perf win — all gates green, frozen contracts intact.

**Architecture:** SvelteKit 2 + Svelte 5 runes; pure Leitner engine in `app/src/lib/engine/training.js` (data-in → Card[] out); canonical content in `src/data.js` → generated to `app/src/lib/data/data.js` via `node tools/build_app_data.mjs`. Card-id slug scheme + `bb_progress_v1` key are FROZEN; new decks add **net-new** ids only (regenerate the card-id snapshot deliberately; golden migration test stays green).

**Tech stack:** Svelte 5, Vitest, Playwright + axe, @vite-pwa/sveltekit, @fontsource/oswald.

**Gates (run from `app/`):** `npm run test` · `npm run check` · `npx playwright test` · `npm run build`. Commit only when green.

---

## File structure (what each task touches)

| File | Responsibility | Tasks |
|---|---|---|
| `app/vite.config.ts` | PWA precache globs | PERF-01 |
| `app/src/routes/+layout.svelte` | font subset imports | PERF-01 |
| `src/data.js` (canonical) → regen | Wagner climate; (later) new fields | ACC-01 |
| `app/src/routes/reference/+page.svelte` | Wine / Translator / Food / Cocktail cards | CT-04, UX-02, CT-10, UX-13(later) |
| `app/src/routes/today/+page.svelte` | streak snowflake a11y | A11Y-09 |
| `app/src/routes/+page.svelte` | practice reveal "Explain this" | UX-03 |
| `app/src/lib/engine/training.js` | deck generators, distractors, DECKS | LS-01, LS-02, LS-05 |
| `app/src/lib/engine/training.test.ts` | engine tests | LS-01, LS-02, LS-05 |
| `app/src/lib/engine/__fixtures__/card-ids.json` | frozen id snapshot (regen) | LS-01, LS-02 |
| `app/src/routes/practice/simulator/+page.svelte` | simulator pick distractors | LS-05 |

---

## Task 1 — PERF-01: trim font precache (free ~344 KiB)

**Files:** Modify `app/vite.config.ts:27`; `app/src/routes/+layout.svelte:4-7`.

- [ ] **Step 1 — Baseline number.** Record current precache: `cd app && npm run build` → note "precache N entries (… KiB)" (baseline: 98 entries / 1174.53 KiB).
- [ ] **Step 2 — Drop `woff` from globs** (keep `woff2`; every SW-capable browser reads woff2). In `vite.config.ts` change the glob to `['**/*.{js,css,html,svg,png,ico,webp,woff2,mp3,json}']`.
- [ ] **Step 3 — Import only Latin subsets** in `+layout.svelte` (replace the 4 whole-family imports, which pull cyrillic/greek/vietnamese, with per-subset latin + latin-ext for each weight — data uses Löss/Grüner/Dürkheimer/Niederösterreich = Latin-1 Supplement, so KEEP latin-ext):
```js
import '@fontsource/oswald/latin-400.css';
import '@fontsource/oswald/latin-ext-400.css';
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/latin-ext-500.css';
import '@fontsource/oswald/latin-600.css';
import '@fontsource/oswald/latin-ext-600.css';
import '@fontsource/oswald/latin-700.css';
import '@fontsource/oswald/latin-ext-700.css';
```
- [ ] **Step 4 — Verify subset files exist** before relying on them: `ls app/node_modules/@fontsource/oswald/latin-400.css` (if the package names subsets differently, fall back to the documented `oswald-latin-400-normal.css`-style path; confirm by `ls node_modules/@fontsource/oswald/`). Adjust imports to the real filenames.
- [ ] **Step 5 — Rebuild & confirm** precache entry count + KiB dropped meaningfully and the wordmark/headings still render Oswald in the browser (preview). Expected: ~452→~108 KiB of fonts; entry count down ~20.
- [ ] **Step 6 — Gates:** `npm run test && npm run check && npm run build`. Then `npx playwright test e2e/offline.spec.ts` (offline still works from precache).
- [ ] **Step 7 — Commit:** `perf(v2): precache only latin/latin-ext woff2 — drop dead font subsets (PERF-01)`

## Task 2 — ACC-01: Wagner-Stempel climate moderate→cool

**Files:** Modify `src/data.js` (the `wagner-stempel-weissburgunder` entry, ~line 13); regenerate `app/src/lib/data/data.js`.

- [ ] **Step 1 — Edit canonical data.** In `src/data.js`, the Wagner entry: change `climate:"moderate"` → `climate:"cool"`, and add `structureNote:"Siefersheim is a cool, porphyry-soil pocket of Rheinhessen — the cool site keeps the soft pear/apple fruit fresh and lean, so 'cool climate' and 'round white' aren't a contradiction."` (verified: GWC / VDP / Metrovino). Keep `acidity:"medium"`, family "Round Whites".
- [ ] **Step 2 — Regenerate app data:** `node tools/build_app_data.mjs` (from repo root). Confirm `app/src/lib/data/data.js` now shows `climate:"cool"` for Wagner.
- [ ] **Step 3 — Update the verification record:** in `docs/research/2026-06-07-v2-content-verification.md` change the Wagner line to "cool (high confidence)" with the GWC/VDP/Metrovino sources.
- [ ] **Step 4 — Gates:** `npm run test` (data tests + RegionMap climate mapping must still pass) `&& npm run check && npm run build`. Verify the v1 `python tests/check_training.py` still passes (run from repo root) since `src/data.js` feeds v1.
- [ ] **Step 5 — Commit:** `fix(v2): Wagner-Stempel climate cool not moderate — Siefersheim is a cool site (ACC-01)`

## Task 3 — A11Y-09: Today streak snowflake text alternative

**Files:** Modify `app/src/routes/today/+page.svelte:52`.

- [ ] **Step 1 — Replace** the bare emoji with an aria-hidden glyph + visually-hidden text mirroring Progress's wording. Current:
```svelte
<div><b class="streak">{streak}</b><span class="meta">day streak {daily.protectedRecently ? '🔥❄️' : '🔥'}</span></div>
```
becomes:
```svelte
<div><b class="streak">{streak}</b><span class="meta">day streak <span aria-hidden="true">{daily.protectedRecently ? '🔥❄️' : '🔥'}</span>{#if daily.protectedRecently}<span class="visually-hidden"> — a missed day was forgiven</span>{/if}</span></div>
```
- [ ] **Step 2 — Verify** in preview + accessibility snapshot: SR announces "… day streak — a missed day was forgiven" when protected, just "… day streak" otherwise (no orphan "fire snowflake").
- [ ] **Step 3 — Gates:** `npm run check && npx playwright test e2e/axe*.spec.ts && npm run build`.
- [ ] **Step 4 — Commit:** `a11y(v2): text alternative for Today streak snowflake (A11Y-09)`

## Task 4 — CT-04 / UX-11 + UX-02 + CT-10: Reference card render wins

All on existing wine/translator fields. Modify `app/src/routes/reference/+page.svelte`.

- [ ] **Step 1 — Price decoder helper** (script block): parse `"18 | 29 | 90"`:
```ts
function priceLadder(price: string): { pour5: string; pour8: string; bottle: string } | null {
  const p = price.split('|').map((s) => s.trim());
  return p.length === 3 ? { pour5: p[0], pour8: p[1], bottle: p[2] } : null;
}
```
- [ ] **Step 2 — Wine card (UX-02 + CT-10):** after the meters block (line ~73), add: the decoded ladder ("5oz $18 · 8oz $29 · bottle $90 ≈ 5 glasses" — only when 3 parts), the `profile`, an "Upgrade to:" line from `w.upgrade`, a "Best with" chip row from `w.pair` (first ~5), and a `<details>` "Guest objections" listing `w.objections` (cue → reply). Plain text for bottle names (names-only scope).
- [ ] **Step 3 — Translator card (CT-04):** render `t.bottleOptions` as a "Bottle upgrade →" line, `t.different` as a "Point of difference" line, and keep `t.phrase`. Add an alias/cue search box on the Translator filter mirroring the Wine search, matching against `t.ask + t.aliases` (so "meiomi"/"napa cab"/"malbec" resolve). Add `const translatorRows = $derived(...)` filtered by `ql` over `[t.ask, ...(t.aliases??[])].join(' ')`.
- [ ] **Step 4 — Search state:** the existing `q`/`ql` is shared; reset `q=''` on filter change is already wired (line 43). Reuse `ql` for the translator filter; show a "{n} of {total}" + empty state like Wine.
- [ ] **Step 5 — Styles:** add `.price-ladder`, `.upgrade-line`, `.best-with` chip styles within the existing token palette (reuse `.pill`/`.pill.alt`; no new colors).
- [ ] **Step 6 — Verify in browser** (preview): Wine card shows ladder/upgrade/profile/objections; Translator card shows bottle options + difference; translator search resolves "meiomi" → the sweet-red row (once COMP-04 lands) and "malbec" → Cerrón Tinto today. a11y snapshot: `<details>` is keyboard-operable; chips are not focusable noise.
- [ ] **Step 7 — Gates:** `npm run check && npx playwright test && npm run build`.
- [ ] **Step 8 — Commit:** `feat(v2): surface upsell ladder, profile, objections, pairings + translator bottle options & cue search (UX-02/CT-04/CT-10)`

## Task 5 — UX-03 / CT-07: "Explain this" link on a wrong reveal

**Files:** Modify `app/src/routes/+page.svelte` (the reveal block, ~lines 257-272). Read it first to get exact markup.

- [ ] **Step 1 — On `pendingCorrect===false`**, render a ghost link to the deck's lesson: `href={'/school#' + engine.DECKS[card.deck].learnLink}` labelled "Explain this →". Gate to misses only. (Note: target the LESSON id `deductive-grid`, not the tool article.)
- [ ] **Step 2 — Verify** the link appears only after a wrong answer and navigates to the right lesson (depends on UX-08 scroll/focus for full polish — out of this sprint; the anchor still jumps).
- [ ] **Step 3 — Gates + Commit:** `feat(v2): 'Explain this' miss→lesson link on wrong reveal (UX-03/CT-07)`

## Task 6 — LS-01: cocktail-pairing retrieval deck

**Files:** Modify `app/src/lib/engine/training.js`; add tests in `app/src/lib/engine/training.test.ts`; regenerate card-id snapshot.

- [ ] **Step 1 — Failing test.** Add to `training.test.ts`: `generateDeck('cocktail-pairing', data)` returns one card per food with a `cocktail`; each card's `choices[0] === f.cocktail`; distractors are OTHER cocktail names (from `data.cocktails`), never wines; id is `cocktail-pairing:<food.id>:match`; `deck === 'cocktail-pairing'`. Run → FAIL.
- [ ] **Step 2 — Add `'cocktail-pairing'` to `DECKS`** with `{ label: 'Cocktail Pairing', learnLink: 'talking-to-a-guest' }`.
- [ ] **Step 3 — Implement `genCocktailPairing(data)`** mirroring `genPairing` but answer = `f.cocktail`, distractor pool = `data.cocktails.map(c=>c.name)`, prompt "A guest at {f.name} wants a cocktail. Best call — and why?", why = a cocktail-pairing rationale (use the cocktail's `say` or the food `why`), scenario for box 5, tags `['cocktail-pairing', ...f.tags]`. Filter foods to those with a `cocktail`. Add the `case` in `generateDeck`. (Zero-proof beat: add `why` mention of `f.zero`; a full zero deck is later.)
- [ ] **Step 4 — Run tests → PASS.**
- [ ] **Step 5 — Regenerate the card-id snapshot** (the new deck adds net-new ids). Inspect `card-ids.test.ts` for the regen command/flag; regenerate, then **diff the snapshot to confirm existing ids are unchanged and only `cocktail-pairing:*` ids were added.** Run the migration golden test → still PASS (old progress migrates; new ids are just "fresh").
- [ ] **Step 6 — Gates + Commit:** `feat(v2): cocktail-pairing retrieval deck (LS-01)`

## Task 7 — LS-02: upsell glass→bottle retrieval deck

**Files:** `app/src/lib/engine/training.js` + tests + snapshot.

- [ ] **Step 1 — Failing test.** `generateDeck('upsell', data)` returns one card per wine that has an `upgrade`; `answer === w.upgrade`; prompt mentions the glass wine; `why` references the economics; id `upsell:<w.id>:bottle`; box-5 mode is scenario. Run → FAIL.
- [ ] **Step 2 — Add `'upsell'` to `DECKS`** `{ label: 'Upselling', learnLink: 'common-substitutions' }` (or a dedicated lesson later).
- [ ] **Step 3 — Implement `genUpsell(data)`:** prompt "A guest is enjoying the {w.name} by the glass. What's the bottle move?", answer `w.upgrade`, why = "A bottle is about 5× the 5 oz pour ({decoded price}); offer the upgrade once they're enjoying it — never push." distractors = other wines' `upgrade` strings. Add `case` in `generateDeck`.
- [ ] **Step 4 — Tests PASS → regen snapshot (net-new `upsell:*` ids) → migration test PASS.**
- [ ] **Step 5 — Gates + Commit:** `feat(v2): glass→bottle upsell retrieval deck (LS-02)`

## Task 8 — LS-05: adjacency-aware MC distractors

**Files:** `app/src/lib/engine/training.js` (genTranslator, genPairing, genWineIdentity, genCocktailPairing where wine-based); `simulator/+page.svelte`; tests.

- [ ] **Step 1 — Failing test.** For a steak pairing (answer St. John Claret), assert the 3 MC distractors are among the structurally-nearest wines (reuse `adjacentWines`) — i.e. NOT a sparkling/Txakoli. Assert determinism (stable across runs). Run → FAIL.
- [ ] **Step 2 — Refactor distractors:** add `wineDistractors(answerName, data, count)` that resolves the answer wine and returns `adjacentWines(answer, data.wines).slice(0,count).map(w=>w.name)`, falling back to `pickDistractors` when the answer isn't a wine. Use it in genTranslator (answer=bestGlass), genPairing (answer=f.wine), genWineIdentity `:name` direction. Keep `:grape` (answer is a "grape — region" string) on `pickDistractors` over the ident list, but bias to same-category if cheap.
- [ ] **Step 3 — Simulator:** replace `pick(wineNames,3)` with the adjacency picks relative to the correct answer.
- [ ] **Step 4 — Tests PASS.** Confirm choices still always include the answer and have no dupes (existing card-id tests + a new distractor-quality test). Snapshot ids unchanged (distractors aren't in the id), so no snapshot regen — but card *choices* changed: verify no test asserts exact choice contents that would break.
- [ ] **Step 5 — Gates + Commit:** `feat(v2): structurally-adjacent MC distractors for translator/pairing/identity + simulator (LS-05)`

---

## Self-review notes
- **Frozen contract:** Tasks 6/7 add deck ids; 8 changes only `choices`. After each snapshot regen, diff to prove existing ids are a strict superset (no renames). Migration golden fixture must stay green every time.
- **Readiness:** new decks flow into `buildReadiness`/`scoreReadiness` automatically (they iterate `Object.keys(DECKS)`) — confirm the readiness smoke test still passes and the gauntlet size grows as expected.
- **Mastery/Progress UI** iterates `DECKS` too — the two new decks will appear as rings; confirm labels render.
- **Deferred to Sprint 2+ (need engine/UX depth or Phase-B data):** CT-05 readiness confidence-weighting, LS-03 self-generate-why, CT-02 My Mistakes, UX-01 gestures, the simulator overhaul (CT-09/LS-06), and all COMP-* content integration (after Phase B re-runs).
