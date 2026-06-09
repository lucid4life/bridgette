# Bridgette Training — v2 Study-Redesign Status (2026-06-09)

**Branch:** `v2-app` (NOT merged, NOT deployed — Adrian deploys). **All gates green at every commit.**
**Final sweep:** 215 Vitest · svelte-check 0/0 · production build · 16 Playwright (e2e + axe-AA per route) · root `python tests/check_training.py` PASS · frozen card-id snapshot unchanged.

Design: [`superpowers/specs/2026-06-09-v2-study-redesign-design.md`](superpowers/specs/2026-06-09-v2-study-redesign-design.md) · Plan: [`superpowers/plans/2026-06-09-v2-study-redesign.md`](superpowers/plans/2026-06-09-v2-study-redesign.md)

---

## The pivot

The session began on the original "Floor-readiness" brief (at-the-table On-Shift mode + persistent chrome search + Floor-Basics cheat sheet). After seeing the On-Shift mockups, **Adrian rejected the premise** — *"I'm never going to pull out my phone at the table… it's not professional. Focus on the studying — building and cementing the menu into my brain, from home on my computer/phone/tablet."*

So the project was re-centered on **studying away from the table**, with two load-bearing requirements Adrian named:
1. **Progressive disclosure, app-wide** — every answer is brief by default with an **Expand** for the full depth.
2. **Rich miss-feedback** — a wrong answer shows *what you said*, *the correct answer*, and *why*.

Adrian then left for a shift and delegated the build: *"make the calls yourself; get it 100% complete tonight."* Everything below was done autonomously against that mandate; the decisions are logged for review.

## What shipped (6 phases, all green)

- **P0 — Engine foundation.** Additive `sourceKind`/`sourceId` on every generated card (NOT part of the frozen id slug), + pure helpers `sourceForCard`, `expandFor` (builds the Expand drawer from existing data), `missFeedback` (you-said/correct/why). New tests; card-id snapshot intact.
- **P1 — The study card.** A shared **`<Expandable>`** (native `<details>`). The Practice reveal now shows a **You said ✗ / Correct ✓** banner on a miss and an always-available **Expand** drawer surfacing the depth already in the data (10-second, structure meters, grape/region, say-it, mnemonic, pairings, objections, upgrade). "Explain this" now also shows on correct answers (retention). Browser-verified on real cards.
- **P2 — App-wide brief→Expand.** Reference wine/bottle cards and On-the-Floor substitution cards adopt the house style (brief surface, depth on tap). *(Learn read sections intentionally left expanded — the lesson is to read the structure.)*
- **P3 — Floor Basics study on-ramp.** A curated **36-card** allow-list (`basics.js`, human-readable, resolved through the generators, guarded by a test) + a soft `basicsOnly` gate in Smart Review + a "Just the basics ⇄ Study everything" toggle. **Default ON only for brand-new profiles; OFF for existing progress** (so your live review pool isn't shrunk).
- **P4 — Habit + backup.** The progress **Backup (Export/Import)** is now reachable on Today (was only reachable post-session — a real data-loss path). Added **Drill of the Day** (your weakest deck) + a persistent **Study now**.
- **P5 — Quick wins.** Functional emoji (🔊 speaker, 🐢 slow, 🔒 lock) replaced with an inline-SVG **`<Icon>`**; **Zero-proof** drinks are now first-class Reference lookups (7 records, inverted from `foods[].zero`); **`.github/workflows/ci.yml`** added (runs the gates once a GitHub remote exists).

## Frozen contracts — honored
- **Zero new card ids.** `sourceKind`/`sourceId` are card *fields*; the frozen snapshot is unchanged (no `regen-card-ids.mjs` needed).
- `bb_progress_v1` gained only `settings.basicsOnly` (migration-safe); `bb_course_v1` untouched.
- No menu-data authoring; the zero-proof section derives from existing `foods[].zero`.

## Deliberately deferred / trimmed (with reasons)
- **On-Shift mode + persistent chrome search** — cut by the pivot.
- **Learn read-section collapse** — kept expanded on purpose (reading the structure *is* the lesson).
- **Three minor retention levers** (MC retrieval nudge, hypercorrection widening, focus-deck interleave) — trimmed: marginal value and/or copy/test-order risk. The high-value lever (rich feedback + always-available depth + explain-on-correct) shipped.
- **Push/scheduled study reminders** — out of scope (notification-permission + service-worker work, risk).

## Needs Adrian — see [`v2-open-questions.md`](v2-open-questions.md) (new section dated 2026-06-09)
1. **Sign off the 36-card Floor Basics list** (easy to edit in `app/src/lib/engine/basics.js`).
2. Confirm the **Floor-Basics default** (OFF for your existing profile; new users start ON).
3. Then: real-device QA, the somm content confirmations (pre-existing list), and deploy.
