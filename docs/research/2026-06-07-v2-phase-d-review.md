# Phase D — Adversarial self-review of the v2 build-out (2026-06-07)

Branch `v2-app`, 26-commit build-out. Scope: regressions, remaining gaps, and new bugs introduced this session, plus open Definition-of-Done items. This is the synthesis of a 5-angle adversarial review (engine/frozen-contract, a11y, full-menu data accuracy, UX/DoD completeness, perf/offline) after adjudication. 16 findings kept; 1 rejected (UX-2, factually wrong — the pronunciation drill already ships syllable chunks + 0.7× slow playback with live `rate` plumbing).

## 1. Verdict

The build-out is **solid and shippable** — every gate is green, the frozen card-id contract is intact (snapshot 279 == `allCards().map(id).sort()`, 0 dupes), the new decks/UX land as specified, and no wrong sommelier fact was introduced. The two issues worth acting on before calling DoD complete are both **claim-vs-reality** problems rather than runtime breaks: **(1) the headline PERF-03 client code-split does not actually exist** — core data and the 89 KB full-menu are fused into one 85 KB chunk (`Dyi5gPxt.js`) loaded by *every* route, and `fullmenu.ts:2-3` asserts the opposite, so the single most important fix is to add a `manualChunks` rule (or `await import()` the Reference data) so the win is real and the in-code comment is true; and **(2) the spec-mandated visual-regression gate (3 breakpoints vs mockup) is absent**, leaving an explicit acceptance criterion silently unmet. Everything else is medium/low polish: a cluster of new-UI focus/live-region a11y regressions in the rewritten simulator and reworked practice loop, and documentation/coverage gaps.

## 2. Punch-list (sorted by severity)

| Severity | ID | Title | Kind | Location | Fix |
|---|---|---|---|---|---|
| high | PERF-OFF-01 | PERF-03 client split failed: core + fullmenu fused into one 85 KB chunk on every route | regression | `app/src/lib/data/fullmenu.ts:2-3`; `app/src/routes/reference/+page.svelte:2,4`; `build/_app/immutable/chunks/Dyi5gPxt.js` | Add `build.rollupOptions.output.manualChunks` isolating `fullmenu.data.js`, OR `await import('$lib/data/fullmenu')` in the Reference route; fix the false `fullmenu.ts` comment |
| high | UX-1 | Mandated visual-regression gate (3 breakpoints vs mockup) is absent | gap | `app/e2e/*`; `app/playwright.config.ts:23` | Add a `toHaveScreenshot` spec at the 3 token breakpoints as Playwright projects + commit baselines, OR record a waiver in `docs/v2-open-questions.md` |
| medium | PERF-OFF-02 | "190→102 KB" headline measures the SSR server chunk, not client first-paint | accuracy | commit `e0181fc` msg; `server/chunks/data.js` (101858 B) vs `Dyi5gPxt.js` (85371 B) | Re-measure with deployed client chunks; only claim the win once PERF-OFF-01 lands |
| medium | A11Y-N1 | Simulator loses focus on every beat/table advance — SR/keyboard dropped to `<body>` | regression | `app/src/routes/practice/simulator/+page.svelte:124,126-131,160-176` | After `advance()`, focus the new beat prompt (tabindex=-1) or first choice in `tick().then()` |
| medium | A11Y-N2 | Practice loop loses focus after grading MC/flip cards (typed/scenario handled) | regression | `app/src/routes/+page.svelte:63-67,144-148,338,361-362` | Broaden the focus-on-entry `$effect` to mc/flip: add tabindex=-1 to `.q` and focus it after `reset()` |
| medium | A11Y-N3 | Reveal live region omits the why/confusion/hypercorrection teaching content | gap | `app/src/routes/+page.svelte:282-290 vs 350-354`; simulator `107-112` | Fold why/confusion into the polite live-region string, or make `.reveal` a `role="status"` + `aria-atomic` region |
| medium | UX-3 | Five DoD/coverage gaps: no scored Ask beat; weak-pills all link to generic Smart Review; Today vs buildReadiness deck-set mismatch; Food/Cocktail tabs have no search; axe skips new states | gap | simulator `57-89,121`; `progress/+page.svelte:106`; `today/+page.svelte:21-25` vs `training.js:473-476`; `reference/+page.svelte:132-144`; `e2e/a11y.spec.ts:5,26-43` | Add Ask beat; carry card id on weak-pills; align Today fallback deck set; add Food/Cocktail search; extend axe to new states |
| low | A11Y-N4 | Swipe-to-grade fires even when the drag starts on a control (guard only protects tap-to-flip) | bug | `app/src/routes/+page.svelte:188-199` | Gate the swipe-grade branch on `!onControl` too; `setPointerCapture` on pointerdown |
| low | A11Y-N5 | Simulator end-state `<h1>` is a bare score fraction ("12 / 18") — meaningless heading, silent completion | a11y | `app/src/routes/practice/simulator/+page.svelte:179-180 vs 150` | Use a descriptive done heading + move focus / announce when `done` flips true |
| low | A11Y-N6 | Reference heading doubles as a live region; result-count re-announces on every keystroke | polish | `app/src/routes/reference/+page.svelte:76,83/165/187` | Drop `aria-live` off the heading; debounce or `aria-atomic` the count region |
| low | A11Y-N7 | Two simultaneous `role="alert"` toasts possible; hypercorrection alert can pre-empt the polite reveal | a11y | `app/src/lib/components/PwaToast.svelte:57,63`; `+page.svelte:369` | Allow at most one assertive alert; make the secondary toast/hypercorrection polite |
| low | ENG-05 | Cocktail-pairing: equally-valid alias accepted when typed but not selectable in box-1/2 MC | ux-inconsistency | `app/src/lib/engine/training.js:400,409,410`; `+page.svelte:76,107` | Include `card.aliases` in MC choices (accept any aliased choice in `chooseMC`), or surface the alias in the reveal |
| low | DATA-05 | Vermentino translator (medium-confidence stand-in) has no open-questions entry despite the summary flagging one | gap | `src/data-fullmenu.json:2592-2609` vs `docs/v2-open-questions.md` | Add a one-line open-questions entry; in-app `different` field is already honest, no code fix |
| low | DATA-04 | Dönnhoff respell `DUR-nhohf` differs from the team's own "DUHN-hohf closer" note — consistency nit | accuracy | `src/data-fullmenu.json:971` vs `docs/research/2026-06-07-v2-content-sourcing-summary.md:59` | Align data and summary on one form (both are defensible ö approximations); not a wrong fact |
| low | DATA-06 | `curate_sourced.mjs` `lmh()` silently coerces unmapped structure values to "medium" (asymmetric rounding) — latent mis-grade risk on the next content pass | bug | `tools/curate_sourced.mjs:20-26` | Make `lmh()` throw / skip+report on a non-LMH value; resolve `medium-low`→`low` asymmetry |
| low | PERF-OFF-03 | Progress-store chunk transitively drags the merged fullmenu into Today/Practice/Progress | gap | `app/src/lib/state/progress.svelte.ts:5,6,12,15`; `+page.svelte:4` | Fixed by PERF-OFF-01 (split fullmenu out); report-only on eager `allCards` (pre-existing design) |
| low | PERF-OFF-04 | PERF-01 woff drop is precache-only: 8 `.woff` (125 KB) still emitted + referenced by shipped CSS | polish | `app/vite.config.ts:29`; `build/_app/immutable/assets/*.woff`, `0.D0FTUVZP.css` | Import woff2-only `@fontsource` builds (or strip woff `src` from `@font-face`) — deploy bloat only |
| low | PERF-OFF-05 | Offline e2e covers neither a graded session, audio fallback, nor the new Bottles/Beer/Digestifs views | gap | `app/e2e/offline.spec.ts:18-23` | Extend: open a Bottles/Digestifs filter offline, grade+reload to confirm `bb_progress_v1` persists, assert `playPronunciation` doesn't throw offline |
| low | PERF-OFF-06 | Reference search rebuilds all three haystacks on every keystroke regardless of active filter | polish | `app/src/routes/reference/+page.svelte:25-32,36-43,52-59` | Optional micro-opt; negligible at 85 short strings — no action unless the bottle list grows |
| low | ENG-06 | (Positive) buildReadiness pronunciation-exclusion correct; no under-fill, snapshot intact | no-regression-confirmation | `app/src/lib/engine/training.js:467-481`; `training.test.ts:360-372` | None — intentional and correct; keep the exclusion test as the regression guard |

> Note: 18 rows above include one positive confirmation (ENG-06) and the rejected UX-2 is excluded. Counting only actionable findings: **2 high, 5 medium, 10 low** = 17 actionable; ENG-06 is a kept positive.

## 3. Detail per kept finding

### PERF-OFF-01 — PERF-03 client code-split failed (high, regression)
- **Location:** `app/src/lib/data/fullmenu.ts:2-3`; `app/src/routes/reference/+page.svelte:2,4`; `build/_app/immutable/chunks/Dyi5gPxt.js`.
- **Evidence (re-verified this pass):** node read of the current build's `Dyi5gPxt.js` = **85371 bytes**, `includes('Riesling')` = true (core data) AND `includes('Aia Vecchia')` = true (bottle data) — confirmed by direct script. `data.js` (110 KB src) and `fullmenu.data.js` (89 KB src) are merged into ONE client chunk. No `manualChunks`/`rollupOptions` rule exists (`vite.config.ts` has none — read in full; lines 25-31 are workbox only). The client manifest shows `_Dyi5gPxt.js` is statically imported by the `/`, `/practice/simulator`, `/reference`, `/school`, `/today` route nodes AND by the progress store chunk. The `fullmenu.ts` header comment literally claims "only the Reference route imports this, so every other route stays ~100 KB lighter" — the build proves the opposite.
- **Fix:** Add `build.rollupOptions.output.manualChunks` isolating `fullmenu.data.js` into its own chunk, OR convert `reference/+page.svelte` to `await import('$lib/data/fullmenu')` so Rollup splits it. Re-verify by grepping the chunk the progress store imports for `Aia Vecchia` (must be absent), then report the real non-Reference first-paint byte delta. Fix the misleading `fullmenu.ts:2-3` comment in the same change.

### UX-1 — Visual-regression gate absent (high, gap)
- **Location:** `app/e2e/` (a11y.spec.ts, smoke.spec.ts, offline.spec.ts); `app/playwright.config.ts:23`.
- **Evidence:** Spec §16 lists "visual-regression (3 breakpoints vs mockup)"; §17 line 104 makes "All tests green incl. visual-regression" an acceptance criterion; §15 Phase 3 calls it a "hard CI gate." Grep for `toHaveScreenshot`/snapshot across `e2e` + config returns nothing; no snapshots folder; the 13 e2e tests are smoke(4)+a11y(8)+offline(1) only. `playwright.config.ts:23` runs a single `chromium` Desktop project — no 1100/1000/680 viewport matrix (config read in full; line 23 is the lone project).
- **Fix:** Add a Playwright visual-regression spec capturing each of the 5 surfaces at the 3 token breakpoints (sidebar/rail/tab-bar layouts) with `toHaveScreenshot`, define those viewports as projects, commit baselines diffed against the `app.css` token contract. Or, if deliberately deferred, record the waiver in `docs/v2-open-questions.md`.

### PERF-OFF-02 — Perf headline measures the wrong artifact (medium, accuracy)
- **Location:** commit `e0181fc` message; `.svelte-kit/output/server/chunks/data.js` (101858 B) vs `build/_app/immutable/chunks/Dyi5gPxt.js` (85371 B).
- **Evidence:** The only ~102 KB artifact is the SSR/server chunk `server/chunks/data.js` = 101858 bytes. `src/routes/+layout.ts` sets `ssr=false; prerender=true` (SPA via adapter-static), so the server chunk is build-time-only and never ships to the browser. On the client the data lives in the 85 KB `Dyi5gPxt.js`, which per PERF-OFF-01 still bundles the fullmenu and loads on non-Reference routes. The commit's "190→102 KB" corresponds to the server artifact, overstating the shipped win.
- **Fix:** Re-measure using deployed client chunks. State the actual bytes a non-Reference route downloads before vs after, and only claim the reduction once PERF-OFF-01 lands.

### A11Y-N1 — Simulator focus lost on every advance (medium, regression)
- **Location:** `app/src/routes/practice/simulator/+page.svelte:124` (only `.focus`), `126-131` (advance), `160-176` (block swap).
- **Evidence:** `choose()` (line 124, `tick().then(() => revealEl?.focus())`) is the ONLY `.focus()` in the file — it moves focus to the answer `<p tabindex="-1">` (line 170). `advance()` (126-131) only mutates `ti`/`beatIdx`/`answered`/`picked`. When `answered` flips false, the `{:else}` block holding the focused "Next →" button (175) is destroyed and the `{#if !answered}` prompt+choices block (160-168) mounts, so focus falls to `document.body`. `liveMsg` (107-109) is `''` while `!answered`, so the new beat is not announced. Rewritten this session (commit `e864cc6`) — genuine regression.
- **Severity rationale:** medium not high — `<svelte:window onkeydown={onKey}>` (line 145) is window-bound, so a keyboard user pressing 1-4/Enter can still operate blind; the loss is SR orientation + visible focus ring.
- **Fix:** After `advance()` mounts the new beat, give the guest line / beat prompt (line 157 or 161) tabindex=-1 and focus it in `tick().then()`, or focus the first choice button — mirror the reveal pattern at line 124.

### A11Y-N2 — Practice loop focus lost after MC/flip grading (medium, regression)
- **Location:** `app/src/routes/+page.svelte:63-67` (`$effect`), `144-148` (advance/reset), `338` (.reveal), `361-362` (grade buttons).
- **Evidence:** `commit()` → `advance()` → `reset()` sets `revealed=false` (line 74), destroying the `.reveal` div (tabindex=-1, line 338) and the "I got it/I didn't" buttons. The autofocus `$effect` (63-67) only refocuses for `cardMode` `'typed'|'scenario'` (verified: condition at line 64); for `'mc'` and `'flip'` there is NO focus restoration, so grading by click (or 1/2) drops the user to `<body>`. The persistent live region (282-290) is `''` when `!revealed`, so the next prompt is not announced. Inconsistent with the typed path.
- **Fix:** Broaden focus-on-entry to all modes: add tabindex=-1 to the `.q` prompt (line 304) and focus it after `reset()` for mc/flip.

### A11Y-N3 — Reveal live region omits teaching content (medium, gap)
- **Location:** `app/src/routes/+page.svelte:282-290` (live region) vs `350-354` (confusion/why); simulator `107-112`.
- **Evidence:** The persistent `aria-live="polite"` region (282-290) emits ONLY "Correct." / "Not quite. The answer is X." / "Answer: X." The CT-01 confusion line (350-352), the why box (353), and the box-5 reason (354) render inside `.reveal` but are NOT in the live region. Focus moves to the `.reveal` div (tabindex=-1, 338); focusing a non-interactive container does not reliably read all descendant paragraphs in NVDA/VoiceOver browse-vs-focus modes, so an SR user can miss the CT-01 teaching payload. Same shape in the simulator: `liveMsg` (107-109, verified) carries only "Correct./Not quite. \<answer\>", never the OK/NO coaching (111-112).
- **Fix:** Fold the why/confusion text into the polite live-region string, or make `.reveal` a labelled `role="status"` + `aria-atomic` region.

### UX-3 — Five DoD/coverage gaps (medium, gap)
- **Location:** simulator `57-89,121`; `progress/+page.svelte:106`; `today/+page.svelte:21-25` vs `training.js:473-476`; `reference/+page.svelte:132-144`; `e2e/a11y.spec.ts:5,26-43`.
- **Evidence (5 verified sub-claims):**
  1. Spec §7/§17 require Ask→Match→Explain→Confirm with "asked first?" scored; the rewritten beat machine has only match/explain/objection/upsell (`BeatKind`, beats array) — **no Ask beat**.
  2. `progress/+page.svelte:106` hard-codes `href="/?start=smart"` for EVERY weak-pill while the aria-label says "Drill {deck}: {prompt}"; `/?start=smart` → `startSession(null)` (generic Smart Review) even though `startDrill(cards)` machinery exists (`+page.svelte:90`, verified) — the pill over-promises.
  3. `today/+page.svelte:22-25` fallback estimate averages `masteryFor()` over ALL decks INCLUDING pronunciation, but `training.js:476` excludes pronunciation from `buildReadiness` — the two "shift-ready %" numbers can diverge (pre-Readiness fallback path only).
  4. `reference/+page.svelte`: Wine/Translator/Bottles have `<input type=search>` but the Food tab (132-144) renders all 42 foods with no search; same for Cocktails/Beer/Digestifs; spec §5 lists "food" as a search axis.
  5. `a11y.spec.ts` exercises only the MC in-session + MC revealed states; never reaches pronunciation-flip, typed, confusion alert, `role=alert` hypercorrection, or the summary-ring screen — axe does not cover those new states.
- **Dropped sub-claims (deliberate/intended, not bugs):** the summary ring not fill-animating is documented (`+page.svelte:425-426`; Progress + Today rings DO animate); the gen-nudge fires at `box>=4` not just box 4 (`+page.svelte:330`), as intended.
- **Fix:** Add a scored Ask beat; carry the card id on each weak-pill (`href=/?drill=<id>` or call `startDrill`); make Today's `shiftReady` fallback average over the same deck set `buildReadiness` uses; add search to Food/Cocktail tabs; extend axe to the pronunciation-flip/typed/confusion/hypercorrection/summary states and an answered simulator beat.

### A11Y-N4 — Swipe-grade ignores the control guard (low, bug)
- **Location:** `app/src/routes/+page.svelte:188-199` (onPointerUp).
- **Evidence:** `onControl = closest('button, a, input, textarea, summary')` is computed at line 192 but only consulted in the tap-to-flip branch (line 198). The swipe-grade branch (line 196: `if (revealed && wasDrag && Math.abs(dx) > 90) { commit(dx > 0); return; }`) ignores `onControl`, so a >90 px horizontal drag begun on a grading button or 🔊 still commits a grade by direction — possibly the opposite of the button grabbed. No `setPointerCapture`, so the gesture can mis-track if the pointer leaves the element.
- **Fix:** Gate the swipe-grade branch on `!onControl` too; `setPointerCapture` on pointerdown. (Button/keyboard path remains the WCAG 2.5.7 alternative — annoyance, not a blocker.)

### A11Y-N5 — Simulator end-state heading is a bare fraction (low, a11y)
- **Location:** `app/src/routes/practice/simulator/+page.svelte:179-180` (done h1) vs `150` (active h1).
- **Evidence:** In the done branch the page's only `<h1>` is `<h1 class="score">{score} / {maxScore}</h1>` (line 179, verified), replacing "Talk to the table" (line 150). Heading nav announces just a number-fraction with no context. Focus is not moved to it when `done` becomes true and there is no aria-live around the done block, so completion is silent. (The PRACTICE summary h1 at `+page.svelte:376` is already descriptive — this is simulator-specific.)
- **Fix:** Use a descriptive done heading (e.g. "Round complete — 12 of 18") and move focus to it (or announce via a polite live region) when `done` flips true.

### A11Y-N6 — Reference heading is also a live region; count re-announces per keystroke (low, polish)
- **Location:** `app/src/routes/reference/+page.svelte:76` (h2 live), `83/165/187` (count live).
- **Evidence:** Line 76 is `<h2 class="visually-hidden" aria-live="polite">{filter}</h2>` — a heading that is also a polite live region. On a filter-chip switch it announces AND the per-filter count `<p aria-live="polite">` announces (two queued polite regions). While typing in search, the count region (no `aria-atomic`) re-fires per keystroke as `wines`/`bottles`/`translatorRows` recompute. (The `{filter}` h2 only changes on chip switch, not on keystroke — collision is filter-switch-only; per-keystroke verbosity is the count region alone.)
- **Fix:** Drop `aria-live` off the heading; debounce the count or add `aria-atomic`.

### A11Y-N7 — Two assertive toasts; hypercorrection can pre-empt the reveal (low, a11y)
- **Location:** `app/src/lib/components/PwaToast.svelte:57,63`; `app/src/routes/+page.svelte:369`.
- **Evidence:** PwaToast renders `needRefresh` (57) and `showInstall` (63) as separate `role="alert"` divs in one stack; both can be true at once. On a sure-but-wrong answer the practice page renders a `role="alert"` hypercorrection block (369) at the same moment the polite reveal region (282) updates, so the assertive alert can pre-empt the answer. Escape dismisses only the install toast (acceptable — refresh is persistent); toasts correctly do not auto-focus; interval cleanup (line 37) landed correctly this session.
- **Fix:** Allow at most one assertive alert (make the secondary `role="status"`/polite); fold the hypercorrection into the reveal announcement or make it polite.

### ENG-05 — Cocktail-pairing alias not selectable in MC (low, ux-inconsistency)
- **Location:** `app/src/lib/engine/training.js:400,409,410` (genCocktailPairing); `+page.svelte:76,107` (MC build/grade).
- **Evidence:** Hummus Chips (`data.js:1742`, cocktail "Short Film or Spicy Sandia") is the ONLY food with " or " in its cocktail field (1 of 42 cocktail-pairing cards). `genCocktailPairing` builds `pool = ckNames.filter(n => valid.indexOf(n) === -1)` (line 400, verified) excluding BOTH valid options, and `choices = [answer].concat(3 distractors)` (line 409); the alias `Spicy Sandia` (`valid.slice(1)`, line 410) is stored in `card.aliases` but never added to choices. The practice loop shuffles `card.choices` as-is (`+page.svelte:76`) and `chooseMC` grades `choice === card.answer` exactly (107). In box 1-2 MC the equally-valid "Spicy Sandia" is unreachable; box 3-4 typed accepts it via aliases. No valid answer is ever mis-graded wrong; the alias is simply not offered. 1 card, cosmetic.
- **Fix (optional):** Include `card.aliases` in the MC choices for cocktail-pairing (and accept any aliased choice in `chooseMC`), or surface the alias in the reveal ("Spicy Sandia also works").

### DATA-05 — Vermentino translator stand-in unlogged (low, gap)
- **Location:** `src/data-fullmenu.json:2592-2609` vs `docs/v2-open-questions.md` (no Vermentino entry — confirmed by reading the full file; no match).
- **Evidence:** The sourcing summary (lines 257-260) explicitly lists "Vermentino translator" among medium items whose flag "should be in open-questions first"; open-questions has zero Vermentino matches. The row's `different` field (line 2608) correctly discloses it is a Portuguese Douro white (Doña Matilde Branco), a deliberate stand-in — so this is a documentation gap, not a false in-app assertion.
- **Fix:** Add a one-line open-questions entry (see §4). No in-app fix needed.

### DATA-04 — Dönnhoff respell self-consistency nit (low, accuracy)
- **Location:** `src/data-fullmenu.json:971` (`respell: "DUR-nhohf FINE-hairp"`) vs `docs/research/2026-06-07-v2-content-sourcing-summary.md:59` ("DUHN-hohf closer").
- **Evidence:** The data respell is `DUR-nhohf`; the summary calls `DUHN-hohf closer`. This is a self-consistency nit (data vs the team's own stated preference), NOT a wrong fact: German ö is a front rounded vowel commonly approximated for English speakers with the r-colored "bird/her/turn" sound, so `DUR-` is a recognized standard approximation, not an inserted phantom r. Both forms are defensible.
- **Fix:** Align data and summary on one form (either change respell to `DUHN-hohf FINE-hairp`, or update the summary). Unaccented display name "Donnhoff" is fine to keep. Not urgent.

### DATA-06 — `lmh()` silent coercion (low, bug, latent)
- **Location:** `tools/curate_sourced.mjs:20-26` — line 22 map, line 23 `|| 'medium'` fallthrough.
- **Evidence:** Line 22 map is asymmetric: `'low-medium':'low'` but `'medium-low':'medium'`. Line 23 `|| medium` fallthrough is real and only console-logged (line 24, `report.coerced`), never failing anything. Only ONE non-LMH value exists in the source today (`'body':'full'` at `content-sourced.json:1245`, mapped to `'high'`) — harmless now. No test/build step references `curate_sourced`/`lmh` (grep = 0), and this is a one-shot manual curation tool, NOT part of the gated pipeline — so the real risk is a silent mis-grade on a future content pass.
- **Fix:** Make `lmh()` throw (or push to `report.excluded` and skip) on a value not in LMH/the alias map; optionally resolve `'medium-low'`→`'low'` to match `'low-medium'`→`'low'`.

### PERF-OFF-03 — Progress-store chunk drags fullmenu into Today/Practice/Progress (low, gap)
- **Location:** `app/src/lib/state/progress.svelte.ts:5,6,12,15`; imported by `app/src/routes/+page.svelte:4`.
- **Evidence:** `progress.svelte.ts` imports `$lib/data/index` (core) at line 5 and runs `engine.loadProgress(data)` in the module-level `$state` initializer. The manifest shows the progress.svelte chunk statically imports the merged data chunk + training. Because the home route imports the store, the merged chunk (now also carrying the 89 KB fullmenu per PERF-OFF-01) is pulled onto Today/Practice/Progress. The NEW regression is the transitive fullmenu drag; the eager `loadProgress`+`allCards` cost is pre-existing Leitner-design, not new this session.
- **Fix:** Report-only on the eager-load part. The actionable fix is PERF-OFF-01 (split fullmenu out so the store chunk stops carrying bottle data). Separately consider deferring `allCards(data)` until a route needs a due count.

### PERF-OFF-04 — woff drop is precache-only (low, polish)
- **Location:** `app/vite.config.ts:29` (globPatterns woff2-only — verified, line 29); `build/_app/immutable/assets/*.woff`; `0.D0FTUVZP.css`.
- **Evidence:** `sw.js` precaches woff2 only (.woff = 0, .woff2 = 8) — PERF-01 true for the precache. But `@fontsource` latin/latin-ext still emits both: 8 `.woff` files totalling 125.4 KB, and the shipped CSS references 8 `.woff` URLs alongside 8 `.woff2`. Since woff2 wins in every SW-capable browser, the `.woff` are deployed dead weight — never precached, never fetched. No runtime regression.
- **Fix (optional):** Import only the woff2 `@fontsource` builds (or strip the woff `src` from `@font-face`).

### PERF-OFF-05 — Offline e2e coverage gaps (low, gap)
- **Location:** `app/e2e/offline.spec.ts:18-23`.
- **Evidence:** The spec goes to `/reference` and asserts `.winecard` (default Wine filter), then opens a deck and asserts `.flash`. It never mentions Bottles/Digestif/Beer filters, never grades a card, never touches audio. So it does not confirm the `bb_progress_v1` write survives offline, does not exercise the new fullmenu-backed Reference views, and does not cover the MP3→Web-Speech fallback. The code likely works (fullmenu is precached via the fused chunk; `playPronunciation.ts` has a sound MP3→Web-Speech→done() fallback) — but none is asserted.
- **Fix:** Extend the spec: (1) open a Bottles/Digestifs filter and assert a bottle card offline; (2) grade one flashcard and reload inside the setOffline block to confirm progress persists; (3) assert `playPronunciation` doesn't throw with no network.

### PERF-OFF-06 — Reference search rebuilds all haystacks per keystroke (low, polish)
- **Location:** `app/src/routes/reference/+page.svelte:25-32,36-43,52-59` (three `$derived` blocks keyed off `ql`).
- **Evidence:** `wines` (25), `bottles` (36), `translatorRows` (52) each `$derived` off `ql` and rebuild a `.join(' ').toLowerCase()` haystack per item; all three dirty on any `q` change even though one filter is visible. Dataset is tiny (~85 short strings), so per-keystroke INP cost is negligible — latent inefficiency, not a current problem.
- **Fix (optional):** Gate each derived list on the active filter, or precompute the lowercased haystack once per item. Not worth doing at 38 rows.

### ENG-06 — buildReadiness exclusion correct (positive confirmation)
- **Location:** `app/src/lib/engine/training.js:467-481`; `training.test.ts:360-372`.
- **Evidence:** 7 objective decks (translator 30, wine-identity 34, pairing 42, structure 63, mystery 34, cocktail-pairing 42, upsell 17 — pronunciation 17 excluded at line 476), each ≥3 cards, so `buildReadiness({perDeck:3})` returns exactly 21 cards with both new decks present at 3 each and pronunciation at 0. Deterministic. Full vitest suite green (8 files / 125 tests). Frozen-contract cross-check: `card-ids.json` snapshot len 279, sorted, matches `allCards(data).map(id).sort()` exactly, 0 dupes. No action — keep the exclusion test as the regression guard.

## 4. Accuracy items to add to `docs/v2-open-questions.md`

Add under "Phase B full-menu sourcing — open questions" (these are doc-completeness, not in-app false assertions):

1. **(DATA-05) Vermentino translator is a deliberate stand-in.** The "Vermentino?" translator ask (`src/data-fullmenu.json:2592-2609`) is answered by the **Doña Matilde Branco (Portuguese Douro white)** — a medium-confidence stand-in, NOT a true Vermentino. The row's `different` field already discloses this; logging here to satisfy the summary's own rule that medium items go to open-questions first. *Decide:* keep the stand-in, or source an actual Vermentino if the list grows.
2. **(DATA-04) Dönnhoff respelling — pick one.** Data uses `DUR-nhohf FINE-hairp` (`data-fullmenu.json:971`); the sourcing summary (line 59) calls `DUHN-hohf` "closer." Both are defensible English approximations of German ö. *Decide:* align on one so the data and the review note agree (no card id changes either way; unaccented display name "Donnhoff" stays).

## 5. Definition-of-Done gaps still open

- **Visual-regression gate (spec §15/§16/§17, hard CI gate + acceptance criterion) — NOT implemented** (UX-1). Either add the 3-breakpoint `toHaveScreenshot` matrix or record a waiver. This is the one acceptance criterion currently silently unmet.
- **Simulator "Ask" beat (spec §7/§17 Ask→Match→Explain→Confirm, "asked first?" scored) — missing** (UX-3 sub-claim 1). The beat machine ships match/explain/objection/upsell only.
- **Reference search axis "food" (spec §5) — missing** on the Food (42 items) and Cocktail tabs (UX-3 sub-claim 4).
- **axe/e2e coverage of the new in-session states** (pronunciation-flip, typed, confusion alert, hypercorrection `role=alert`, summary ring) and an answered simulator beat — not exercised (UX-3 sub-claim 5).
- **Offline e2e** does not assert graded-progress persistence offline, the new Bottles/Beer/Digestifs views, or the audio fallback (PERF-OFF-05).
- **PERF-03 client code-split** is, as shipped, not realized (PERF-OFF-01); the perf headline measured the server chunk (PERF-OFF-02). Treat the perf DoD as not-yet-met until the client chunk is actually split and re-measured.

*Note on what is NOT a gap:* the pronunciation drill ships the spec'd syllable chunks + 0.7× slow playback with live `rate` plumbing (rejected finding UX-2); the Leitner engine, frozen card-id contract (snapshot 279), confidence-weighted readiness, no-leaderboard/no-XP constraints, and all 125 vitest / 0-0 check / 13 e2e gates are intact (ENG-06).
