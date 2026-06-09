# Bridgette Training — Next-Session Options (fresh-eyes review of the built app)

**Date:** 2026-06-09
**Method:** 6-angle fan-out review of the *already-built* v2 app (UX/UI craft, learning pedagogy, content/data, IA/flow/onboarding, new features, tech/perf) → synthesis. Goal: the highest-value NEXT improvements now that the redesign is shipped — not a redo.

---

## The state of play
The app is genuinely built and trustworthy: a sound 5-tab IA, a tested Leitner engine, the self-rate production loop, a Guest Simulator, a 10-module course, and the full real menu (17 by-the-glass wines, 42 dishes with allergen flags, 15 cocktails, 38 bottles, 25 digestifs) — all structured and cross-paired. **The honest biggest opportunity:** it's still a *studying tool that goes back in the pocket the moment a guest is at the table*. The load-bearing global search and the at-a-glance answers exist but aren't reachable "from anywhere," and the screens read like a well-built template rather than a crafted, on-shift weapon.

## Options (themes), ranked by value-per-effort

### 1. Floor-readiness: make the app usable mid-shift · S–M · **highest payoff** ⭐ recommended
- **Persistent global search** — promote `GuestSearch` from the Today page body into the layout chrome (search icon/overlay on every route). Already deep-links correctly; just needs a home. (M)
- **On-Shift mode** — a one-thumb, glanceable cheat-sheet view over the *same* translator+pairing joins: huge tap targets, the bridge line as the answer, big speaker button, high contrast. New view, no new content. (M)
- **Floor Basics starter track** — a curated ~30–40 card draw order gating the 295-card long tail, so day-1 sessions feel high-yield and "shift-ready in weeks" is arithmetically true. (M) — *needs Adrian's sign-off on the list.*

### 2. Content completeness & safety · S–M · high payoff
- **Zero-proof drinks as first-class lookup records** — the engine already prints Noughty Rouge (15 dishes), Peroni 0.0, Freixenet across ~23 dishes, but none can be looked up. ~6–8 records into the existing schema. (S)
- **Dietary scenario handler** — turn `foods[].flags` + `wines[].vegan` from passive labels into a "vegan/GF/allergy guest → safe play + exact words" tool + a Simulator turn. (M) — *needs kitchen confirmation.*
- **Spirits reference lane** — ~85 spirits poured, zero coverage; the single largest uncovered category. (M)

### 3. Card-system & visual craft · M–L · high payoff · no Adrian dependency
- **Differentiate card archetypes** — say-this / look-it-up / do-this cards look identical; give each a focal element + density. (L)
- **In-card type scale + vertical rhythm** — one lead level above the wall of 13–14px meta; spacing on tokens. (M)
- **Today as a cockpit** — hero = "what do I do in 2 minutes," demote the near-identical tiles. (L)

### 4. Engagement & insight · M · medium payoff
- **Drill of the Day + opt-in pre-shift reminder.** (M)
- **Weak-spot coaching** — surface the confusion pairs the engine *already computes then discards* ("you keep mixing Grüner and Sauv Blanc") + a simple trend. (M)
- **Fix the orphaned Progress/Export page** — the only backup/export UI is now a dead-end (Progress was removed from the nav) → real data-loss risk for a localStorage PWA. (S) ← *also a quick win.*

### 5. Technical durability · S · medium payoff, high insurance
- **CI workflow** — no `.github`/remote; all gates run only on Adrian's laptop. One `ci.yml` makes the data-safety guard + axe gate real deploy blockers. (S) — *needs the GitHub remote.*
- **Cross-store integrity test + menu-update runbook** — the two un-joined menu stores will drift seasonally; a guard + a short "how to update the menu" doc make updates fearless. (S–M)

### 6. Interaction polish · S–M · medium payoff
Micro-interactions (correct-answer feedback, hover-lift, swipe-peek), empty/loading skeletons, replace the remaining functional emoji (speaker/lock/slow) with the SVG set, unify the data-viz language. Secondary to the card system it hangs off.

## Single recommendation
**Theme 1 — Floor-readiness.** Three of five reviewers independently landed here. It closes the gap the product exists to close, reuses joins/data/components already built, needs no somm sign-off (except the Basics list), and serves the most-feared, most-frequent table moment. The difference between an app Adrian studies at home and one he pulls out at the table.

## Quick wins (cheap, low-risk, do regardless of theme)
- Add the **zero-proof lookup records** (S) — removes ~23 dangling references the app already prints.
- **Fix the orphaned Progress/Export link** (S) — closes a genuine data-loss path.
- **CI workflow** (S) — makes every existing test real.
- **Replace functional emoji** (speaker/lock/slow) with the SVG set (S).
- **In-card type-scale pass** (M-low) — biggest calm-per-line-of-CSS.
- **fullmenu.json cross-store integrity test** (S).

## Needs Adrian (blocked on input/assets)
- **Floor Basics card list** (~30–40 "the basics"; a default exists).
- **Somm/accuracy confirmations** — `docs/v2-open-questions.md` (Fattoria cuvée, Wagyu swap, vegan confirmations, ABV/spelling deltas).
- **Kitchen confirmations** — vegan/GF-able dishes; which spirit bottlings are stocked.
- **Brand assets** — logo SVG, paid display face, illustration/texture (a CSS version ships free now).
- **Deploy/infra** — create the GitHub remote; Cloudflare token if CI deploys; confirm phone for reminders.
