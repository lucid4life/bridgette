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

## Accepted by design (do NOT re-flag)

- **Clean-run rank jump learning → locked-in** — ts-fsrs default weights let a
  clean first session graduate an item past 'solid'. Documented in
  `src/lib/srs/scheduler.ts`; intentional, leave the weights alone.
