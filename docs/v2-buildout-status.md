# Bridgette Training v2 — build-out status (2026-06-07)

**Branch:** `v2-app` (NOT merged, NOT deployed — Adrian deploys). **Gates green throughout:**
125 Vitest · svelte-check 0 errors / 0 warnings · 13 Playwright (axe-per-route / smoke / offline) ·
production build · v1 `python tests/check_training.py` PASS. **Frozen contract intact:** the
card-id slug scheme + `bb_progress_v1` key are byte-for-byte unchanged (snapshot 210→279, only
net-new ids added; golden migration test green).

This session ran the kickoff's four phases end to end.

## Phase A — Hypercritical audit ✅
6-angle adversarial audit (UX/IA, a11y WCAG 2.2, content accuracy+completeness, learning-science,
perf/offline, competitive) → prioritized 70-finding backlog in
[`docs/research/2026-06-07-v2-audit.md`](research/2026-06-07-v2-audit.md). The adversarial verifier
caught a proposed change that would have *introduced* a sommelier error.

## Phase B — Full-menu content sourcing ✅
19-agent web-verification of the whole menu → **94 records (80 high-confidence)** in
[`docs/research/2026-06-07-v2-content-sourced.json`](research/2026-06-07-v2-content-sourced.json)
(+ summary). Curated by `tools/curate_sourced.mjs` → `src/data-fullmenu.json`. Every flagged /
medium / low item logged to [`docs/v2-open-questions.md`](v2-open-questions.md); nothing unverified
asserted. v1 `src/data.js` untouched (the full-menu data is app-only).

## Phase C — Build ✅ (the six core areas, world-class across the whole menu)
- **Recommendations / translator:** Reference translator card renders bottle-options + the
  point-of-difference + cue search; a searchable 38-bottle reference resolves the niche asks
  ("napa cab" → White Rock, "barolo" → the Nebbiolos, "sancerre" → Denizot); 10 new guest-asks
  incl. the honest "no sweetened reds" expectation-setter.
- **Upselling:** a new `upsell` retrieval deck (the ~5× economics), the decoded price ladder +
  upgrade line on every wine card.
- **Food↔cocktail:** a new `cocktail-pairing` deck (+ zero-proof beat); cocktail/zero surfaced on
  the Food + Cocktail cards.
- **Pronunciation:** respellings for all bottles/digestifs; the Pronunciation deck is a focused
  drill with **stress-marked syllable chunks + 0.7× slow playback**.
- **Wine knowledge & food↔wine:** full verified depth on 17 glass wines + 38 bottles + 25 digestifs
  + 17 beers; families / style-map / region-map / Mystery Pour; "Best with" chips.
- **Learning science:** generate-the-why beat, same-family confusion alerts, confidence-weighted
  honest readiness (excludes self-graded pronunciation), "My Mistakes" + scoped weak-pill drills,
  adjacency-aware distractors.
- **The Guest Simulator** (v2 differentiator) rewritten as a box-scaled beat-machine —
  **Ask → Match → Explain → Objection → Bottle-upsell**, every beat scored, and the Match beat
  **writes back to Leitner** so it counts toward mastery + the streak.
- **Premium UX:** mobile tap-to-flip + swipe-to-grade, animated summary ring, −302 KiB fonts, and
  the full-menu data moved to a fetched static asset so non-Reference routes stay lean.

## Phase D — Adversarial self-review ✅ + fixes
Re-reviewed the 26-commit build-out (5 angles, adversarially verified) →
[`docs/research/2026-06-07-v2-phase-d-review.md`](research/2026-06-07-v2-phase-d-review.md).
Verdict: **solid and shippable.** 16 findings; the actionable ones are fixed:
- **PERF-OFF-01 (high):** the PERF-03 client split had silently failed (SvelteKit co-locates the
  generated data modules and ignores manualChunks + dynamic-import boundaries). Fixed for real —
  the ~74 KB of bottle/beer/fortified data is now a **static JSON asset** (`app/static/fullmenu.json`)
  the Reference route fetches on demand; verified absent from every JS chunk, SW-precached for offline.
- **A11Y-N1/N2/N3/N4/N5/N6/N7:** focus restoration on every card/beat advance, teaching content
  folded into the live regions, swipe-grade control-guard, descriptive simulator done-heading,
  polite hypercorrection, de-duplicated live regions.
- **UX-3:** Food/Cocktail search, Today fallback aligned with the readiness deck-set, weak-pills
  drill the specific card, the scored **Ask** beat added.
- **DATA-06:** the curation tool now fails loud on an unmapped structure value (no silent mis-grade).

## What remains (Adrian's side — no more code)
1. **Test on real devices** (phone + the installable/offline PWA via `cd app && npm run build && npm run preview`).
2. **Confirm the open-questions with the somm** (`docs/v2-open-questions.md`): the medium-confidence
   climate/structure calls, a few ABVs, the Tawny Port placeholder, the Vermentino stand-in, and the
   Dönnhoff respell form.
3. **Visual-regression baselines** — capture once the look is signed off on a fixed CI image (the one
   acceptance criterion deferred by waiver; real-device QA covers visual fidelity meanwhile).
4. **Then deploy** to Cloudflare Pages.

Deliberately not done (risk-not-worth-it; the build is clean and fully green): A11Y-04
(goal-toggle radiogroup / Reference-chips tablist refactor — current aria-pressed pattern passes
axe), A11Y-08 (chip 44 px — already meets WCAG 2.5.8's 24 px), and ElevenLabs MP3s for the new
bottle/digestif names (not in the audio-drilled deck; respell + browser-voice fallback covers them).
