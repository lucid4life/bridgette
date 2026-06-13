# v3 code review — deferred findings (for the Phase-2 session)

2026-06-12. The correctness batch + cheap cleanups landed on `v2-app`
(commits: `fix(v3): code-review findings — checkpoint gate, throttle, allergen
reveals, clock` and `refactor(v3): code-review cleanups — shared gating
selectors, memoized items, single rng`). Everything below was judged real but
Phase-2-shaped — defer until the multi-stage work starts.

## Deferred

- **itemsForUnit kind-branch generalization** — `journey/items.ts` still
  special-cases `day-one` / `checkpoint-food` / dish-roster by id. Phase 2 adds
  stages whose units need a kind-driven derivation (service vs dish vs
  cocktail/wine), not id equality checks.
- **Checkpoint route parameterization** — `/checkpoint/[stageId]` hardcodes
  `STAGE_ID = 'food-runner'` + `CHECKPOINT_UNIT_ID`. Needs stageById/kind
  lookup so stage 2-5 checkpoints reuse the surface.
- **Multi-stage Path rendering + cross-stage nextUnit** — the Path home and
  `nextUnit()` only walk `STAGES[0]`; locked stages are previews. Phase 2 needs
  the spine to continue across unlocked stages and the continue-target to hop
  stage boundaries.
- **Session-runner runes scaffold extraction** — unit/review/preshift/
  checkpoint routes each re-implement the same `session/nonce/step/prog/bump`
  scaffold (4 copies). Extract a shared runner (component or rune factory).
- **Review/preshift route merge** — same engine, same template, different
  entry list + copy. One parameterized surface.
- **localStorage mirror write coalescing** — `writeMirror` serializes the FULL
  state on every persist. Fine at 57 items; at Stage-5 scale (~300+ items,
  every review a write) coalesce/debounce the mirror write.
- **Skeleton CSS dedup** — the `.sk` + `sk-pulse` skeleton block is copy-pasted
  in 7 files (path, today, progress, unit, review, preshift, checkpoint).
  Hoist to app.css.
- **catLabel/price format helper** — category/price display formatting is
  re-derived in playbook + teach surfaces; one shared formatter.
- **e2e teach+reveal drive merge** — the a11y and journey specs each drive a
  session through teach/reveal steps with near-identical helpers; merge into a
  shared e2e fixture.

## 2026-06-13 — Stages 3-5 closeout (which of the above shipped vs still deferred)

The whole v3 journey is now built (Food → Allergens → Bar → Wine → Pairings +
prep-my-bottle + the 60-second burst + View Transitions). Status of the deferred
list above:

**CLOSED (done by the Stages 3-5 multi-stage work):**
- **itemsForUnit kind-branch generalization** — done. `itemsForUnit` now dispatches
  by roster map (`UNIT_FOOD/ALLERGEN/BUILD/WINE/PAIRING_IDS`) + authored-array
  units (`day-one`, `bar-arc`), and `mcFor/cuedFor/freeFor/teachFor` branch by
  kind for build/wine/pairing.
- **Checkpoint route parameterization** — done (foundation): `/checkpoint/[stageId]`
  is stage-generic and serves all five checkpoints.
- **Multi-stage Path rendering + cross-stage nextUnit** — done (foundation): the
  Path spine renders every unlocked stage and the continue hops stage boundaries.

**STILL DEFERRED (optional refactors — none blocking; scope grew with the new
routes, re-logged):**
- **Session-runner runes scaffold extraction** — the `session/nonce/step/prog/bump`
  scaffold is now in ~8 routes (unit/review/preshift/checkpoint + the romance/
  build/burst drills + prep). A shared rune factory would pay off now.
- **Review/preshift route merge** — unchanged; still one parameterized surface.
- **localStorage mirror write coalescing** — NOW THE TOP PERF ITEM. `allItems()`
  spans ~180 path items (57 food + ~41 allergen + 25 bar + 17 wine + 41 pairing)
  and `writeMirror` still serializes the FULL state on every `recordReview`. At
  this scale (and with the burst/drills driving rapid reviews) debounce/coalesce
  the mirror write (idb is already async; the mirror is the sync hot path).
- **Skeleton CSS dedup** — the `.sk` + `sk-pulse` block is now copy-pasted in ~11
  files (+ romance/build/prep/burst). Hoist to app.css.
- **catLabel/price format helper** — `winePrice` (TeachCard) and `glassPrice`
  (prep.ts) now duplicate the 5oz|8oz|bottle decode; one shared formatter.
- **e2e teach+reveal drive merge** — the a11y spec now has three near-identical
  drive-to-teach loops (day-one / wine-bubbles / pair-snacks). Merge into one
  parameterized fixture.

**New, accepted-for-now (do NOT re-flag without cause):**
- **Per-kind if-chains** in `mcFor/cuedFor/freeFor/teachFor`, the `/unit` MC
  branch, the Path meta-label, and `TeachCard` now span 6 kinds. A kind→{noun,
  accessor} table would flatten them, but the chains are readable and the kind
  set is now closed (no Stage 6 planned) — leave unless a 6th kind lands.
- **foodId reuse across dish/allergen/pairing** — a path dish now mints up to 3
  items (`dish:`/`allergen:`/`pairing:`), so it can appear thrice in the burst/
  review/shaky lists. Intended (three distinct skills); disambiguated by the unit
  title in the Progress shaky list and by the distinct prompt in review cards.

## 2026-06-13 — §4 code-health closeout (memory-and-enhancements session)

**CLOSED (done this session):**
- **localStorage mirror-write coalescing** — DONE (the TOP perf item). `persist`
  now coalesces the mirror write with a leading+trailing debounce
  (`scheduleMirrorWrite`/`flushMirror`, store.ts): an isolated write still hits
  localStorage synchronously on the leading edge (the iOS net + the "mirror on
  every write" guarantee are unchanged), but a rapid burst collapses to one
  trailing write. `flushMirror()` forces it current on idb-failure + on tab
  pagehide/visibilitychange-hidden (wired in +layout). writeSeq still bumps per
  persist; idb stays per-persist (the durable store) and wins the next load on
  its higher seq. 3 store tests (leading-edge immediate, burst-coalesce + flush,
  idb-fail flush).
- **catLabel/price format helper** — DONE. `formatGlassPrice` extracted to
  `$lib/journey/price.ts`; TeachCard + prep.ts both consume it (price.test.ts).

**STILL DEFERRED (optional refactors — none blocking; deliberately not done in
this marathon session to avoid regression risk in large cross-cutting refactors):**
- **Session-runner runes scaffold extraction** — the `session/nonce/step/prog/bump`
  scaffold is now in ~9 routes (unit/review/preshift/checkpoint + romance/build/
  pour/burst drills + prep + the romance exam). A shared rune factory / component
  would pay off — but it touches every session surface, so it deserves its own
  focused pass + full e2e sweep, not a session tail. TOP remaining item.
- **Review/preshift route merge** — unchanged; one parameterized surface (now both
  also carry the §0c sure/shaky confidence wiring, so merge after the scaffold).
- **Skeleton CSS dedup** — the `.sk` + `sk-pulse` block is copy-pasted in ~13 files
  now (+ romance exam / pour). Hoist to app.css (mechanical, low-risk; defer with
  the scaffold so the session-card chrome is touched once).
- **e2e teach+reveal drive merge** — the a11y spec has several near-identical
  drive-to-teach/reveal loops; one parameterized fixture.
- **Per-track eyebrow text + continue card (§2 follow-up)** — §2 coloured the
  decorative spine/markers/meter per track but left the eyebrow text + hero
  continue card neutral (teal/coral as TEXT need a both-themes -deep/-bright token
  pair — teal has no dark-theme text token yet). Add `--track-text` theme-aware
  tokens if the eyebrow should also carry the track hue.
- **Stage-5 optional faces (§3 follow-up)** — the unused frozen decks
  pairing-principle (which-lever MC) / cocktail-pairing (dish→cocktail) /
  wine-dish (reverse pour→dish) are built but not drilled; fold into /burst or a
  pairings mock wheel.

## Accepted by design (do NOT re-flag)

- **Clean-run rank jump learning → locked-in** — ts-fsrs default weights let a
  clean first session graduate an item past 'solid'. Documented in
  `src/lib/srs/scheduler.ts`; intentional, leave the weights alone.
