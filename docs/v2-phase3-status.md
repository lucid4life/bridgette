# Bridgette Training v2 — Phase 3 (UI build) status

**Date:** 2026-06-07 · **Branch:** `v2-app` (not merged; `main` untouched)

Phase 3 (the screens + v2 features) is substantially built on top of the locked foundation, browser-verified and gated. Below: what's done, the evidence, and what's intentionally deferred.

## Done (committed on `v2-app`)
- **App shell** — responsive sidebar → rail → tab-bar at the 3 breakpoints; skip link, distinct nav landmarks, in-app Back for sub-routes, self-hosted **Oswald** display font (offline-precached).
- **Practice (core loop)** — Smart Review / Focus-a-deck / Readiness / Mystery Pour / Guest Simulator. Box-adaptive cards (MC → typed → scenario, flip for pronunciation), instant calm feedback + the *why*, **Sure/Shaky confidence tap** + **Sure-wrong hypercorrection**, same-session re-show, progress bar, summary with a "Drill the misses" one-tap. Keyboard throughout; focus moves to the answer on reveal; persistent `aria-live` announcements.
- **Guest Simulator** — Ask→Match→Explain→Confirm using `objections[]`, full keyboard, live announcements.
- **Reasoning layer (spec §8)** — 5 **wine families** with steers; **body×acidity style map**; stylized **origin/region map** (climate-coloured); **Mystery Pour** generator (structure fingerprint ↔ wine, structurally-adjacent distractors) as a `mystery` deck; **dual-coding structure meters** in Reference. All charts dual-coded (never colour alone) with screen-reader text alternatives.
- **Today** — first-run action-first onboarding (gated before the numbers), live cockpit (due/streak/total + animated shift-ready ring), distinct CTAs, dynamic greeting.
- **Reference** — chip filters, multi-entry search + empty state, structure meters, truthful speak playing-state, matrix that **stacks into dish cards on mobile**.
- **Wine School** — 7 lessons with retry-able quick-checks + the deductive grid (own section) + the families/geography section.
- **Progress** — **animated** deck + tag mastery rings (`@property`), drillable weak-spot links, forgiving-streak view + **Daily/Weekly goal toggle**, export/import.
- **Forgiving streak (spec §10)** — `studyDays` log; daily grace with a **silent ❄️ freeze**; weekly-goal mode for weekend shifts; migration backfills the streak for upgrading v1 users.
- **PWA (spec §13)** — branded maskable icon set + favicon; `registerType:'prompt'` update toast + hourly SW check; quiet install prompt **after the first completed session**, dismissal remembered.
- **CI gates (spec §16)** — Playwright **smoke**, **axe WCAG A/AA per route + session states**, **offline-from-precache** — all green. Plus the parallel **adversarial self-review** pass (interface-design/accessibility/web-quality heuristics) → findings fixed (see `docs/research/2026-06-07-v2-phase3-adversarial-review.json`).
- **Contrast** — full computed audit + axe both clean (WCAG AA) after the light-surface fixes.

## Evidence (fresh, this session)
- `npm run test` (Vitest): **116 passed** (engine, wineschool, data, card-ids, migration, streak, tokens, audio).
- `npm run check` (svelte-check): **0 errors, 0 warnings**.
- `npx playwright test`: **13 passed** (4 smoke, 1 offline, 8 axe).
- `npm run build`: prerenders all routes; PWA precache 98 entries (~1.17 MB incl. fonts + 17 MP3s).
- v1 suite still green: 66 Node + `check_training.py` PASS (data changes didn't regress v1).

## Deferred (documented, not blocking the morning review)
1. **Visual-regression ×3 breakpoints** — Playwright is wired; screenshot baselines were NOT committed (OS-dependent rendering would false-fail on another machine/CI). Add baselines once a fixed CI image is chosen. Phase 4's real-device human check covers visual fidelity meanwhile.
2. **Readiness "% shift-ready" confidence-weighting** (spec §9) — the Readiness gauntlet doesn't yet capture/weight confidence; the *practice* loop does. Small follow-up.
3. **Simulator box-scaled difficulty** (spec §7) — the Simulator is not yet difficulty-scaled by Leitner box.
4. **Polish nits** from the review (low severity): goal toggle radiogroup semantics; map hover-label px sizing on phones; weekly-mode snowflake parity; guided-card "View →" cue; the harmless `/practice/sw.js` scope-probe 404.

## Phase 4 (still gated on you — I did NOT deploy)
Review on a **real phone + laptop**: visual fidelity vs the workbook identity, screen-reader focus order, real-device offline, "does a session feel good." Then deploy to Cloudflare Pages. Confirm the open sommelier questions in `docs/v2-open-questions.md`.
