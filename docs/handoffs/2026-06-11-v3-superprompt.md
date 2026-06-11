# SUPER PROMPT — Build "Bridgette Trainer v3: The Two-Week Path"

Paste everything below into a FRESH Claude Code session opened in
`C:\Users\abeek\OneDrive\Documents\Bridgette Barr`, with **ultracode ON**
(standard mode, not plan mode — the plan is locked in this prompt).

---

## The situation

I'm Adrian, a new hire at Bridgette Bar Calgary (food-runner shifts now,
bartending next, wine depth ongoing — Wednesday tastings + an assigned bottle
to present at preshift; there is NO wine exam). The repo contains v2 of my
training PWA (branch `v2-app`, dir `app/`, LIVE at bridgette-six.vercel.app —
auto-deploys on push). v2's data layer is gold (all four official management
training docs integrated, menu-sync verified current 2026-06-11, 428 frozen
card ids, 319+ vitest / 45 playwright green), but its information architecture
is a wine-exam app with food bolted on. A commissioned five-agent research pass
(UX audit, learning science, app teardowns, tech stack, menu coverage) is
distilled in **`docs/research/2026-06-11-v3-research-digest.md` — READ IT FIRST
and treat it as settled evidence; do not re-research.**

## Mission

Build **v3 from the ground up**: a journey-based learning app that walks me
through my first two weeks — taught first, then tested, with spaced-repetition
flashcards as the testing engine — food → allergens → cocktail builds → wine →
pairings. v2 stays untouched and live while v3 is built. The bar: best-in-class
learning UX (Duolingo path × WaniKani gating × Anki review discipline), high-end
brand-true UI, every screen earning its place for THIS job.

## Source-of-truth hierarchy (locked)

1. The four official management docs (already parsed into the data layer:
   food syllabus June 2026, beverage syllabus Jan 2025, service guide,
   onboarding package; conflicts logged in `docs/v2-open-questions.md`).
2. The live printed-menu PDFs via `tools/menu_sync/` (prices + what's-listed;
   verified current 2026-06-11 — zero gaps; the rotating "Bartender's Monthly
   Feature" is un-syncable by design).
3. Never invent menu facts. Allergen answers ALWAYS carry the
   confirm-with-the-kitchen (food) / confirm-with-the-bar (cocktails) framing.

## Locked architecture decisions (do not re-ask, do not re-litigate)

**Stack:** SvelteKit 2 + Svelte 5 runes, adapter-static, vite-plugin-pwa
(offline precache), TypeScript checks via svelte-check, vitest + playwright
(+axe) test harness. Scheduler: **ts-fsrs v5** (desired retention 0.92),
named ranks on top (New → Learning → Solid → Locked-in; demotion on lapse);
keep a compressed early ladder (no 4-hour gates — first review same session,
then 1d/2d/4d/7d-equivalent via FSRS). Storage: **IndexedDB via `idb`** +
`navigator.storage.persist()` + a compact localStorage snapshot mirror
(key `bb3_progress_v1`; fresh start, no v2 import). 

**Deployment:** new directory **`app-v3/`** in this repo, same branch
`v2-app`. Create a SECOND free Vercel project rooted at `app-v3/` (the Vercel
CLI is authed; token at `%APPDATA%\com.vercel.cli\Data\auth.json`, team
`team_DmJIWlOHxywyWRW3LiWqp8YE`; the existing `bridgette` project — root
`app/` — must NOT be modified). v2 keeps deploying from `app/`.

**Reuse verbatim (do not rewrite):** root `src/data.js` + `src/data-fullmenu.json`
+ `tools/build_app_data.mjs` (extend it to also emit into `app-v3/src/lib/data/`),
the pure-JS engine generators in `app/src/lib/engine/` (copy into app-v3 as a
library with their vitest suites INCLUDING the 428-id frozen snapshot — existing
card ids stay byte-frozen; new question types mint NEW namespaces), the v3 brand
token system (`app/src/app.css` primitives/semantic layers + `tokens.test.ts` —
port both), pronunciation MP3s in `app/static/audio/`.

**Design system (locked — verified brand, see `docs/menu-sync/brand-tokens.md`):**
cream #ffeed7 canvas + slate #1e384b ink; orange #f15623 / ember #b8420f action
accents; marigold #fcb539 highlights/hairlines; steel teal #437c93 info + wine
identity; coral #f25c4d print rule on flashcard faces (black-ink-on-cream paper
cards in both themes); deep-slate dark theme; sidebar/nav = slate band; Oswald
300/700 display with **lowercase h1/h2**; Hanken Grotesk body. Track identities:
food=orange, bar=marigold, wine=teal. Use the `frontend-design:frontend-design`
skill for each major screen; axe (both themes) + the ported token contrast suite
gate every push. High-end means: confident type scale, one strong accent per
screen, generous whitespace, View Transitions between path→session, zero
generic-AI gradients.

## The v3 information architecture (locked)

Four tabs, identical on mobile tabbar and desktop sidebar — every tab reachable
on the phone:

1. **Path** (home) — the single linear journey, Duolingo-style:
   - **Stage 1 · Food Runner**: Unit 0 "Day one" (seat numbers, table map,
     no-auction, romance formula — NEW drillable cards, new `service:*`
     namespace) → Units 1–8: the 41 dishes in menu-category chunks of 4–6
     (Snacks, Snacks II, Small Plates, Vegetables, Pizza, Pasta, Mains,
     Dessert) → Stage checkpoint ("Shift check: Food").
   - **Stage 2 · Allergen Guardian**: allergen-focused units (by-allergen
     sweeps: "everything carrying shellfish", look-alike confusions
     interleaved) → checkpoint.
   - **Stage 3 · Behind the Bar**: cocktail builds as worked examples →
     completion problems → full recall; Matinee facts; arc-of-service unit →
     checkpoint.
   - **Stage 4 · Wine**: the 10 v2 wine modules restructured into units;
     "Prep my bottle" flow for the weekly assigned-bottle presentation
     (pick a bottle → its deep-dive → a 5-question self-check → a 60-second
     presentation script builder).
   - **Stage 5 · Pairings**: the pairing levers + dish↔drink decks, fully
     interleaved.
   - Units gate at ~85% items ≥ Learning rank; every unit offers **test-out**
     (pass the checkpoint cold → unit marked complete). Stages unlock
     sequentially but test-out works at stage level too.
2. **Today** — the daily loop, WaniKani-style two-button separation:
   - **Reviews first** (FSRS queue, never capped, finishable, misses recycle
     same-session until cleared) → **then Lessons** (new items, default 8/day,
     auto-throttled) → optional **60-second burst** (timed mixed quiz).
   - **Pre-shift mode**: a "2:45pm special" — 2 minutes of my shakiest
     shift-critical items (lapse-ranked), one tap from the tab.
   - Streak with one free freeze/week; 8-minute session target with "one more
     chunk?" prompt.
3. **Playbook** — lookup-first reference (merges v2's Reference + On the Floor
   + cram): dish/drink/wine cards with official components/allergens/builds,
   the printable Menu Cram, "guest asked for…" translator, table map, day-one
   crib, allergen icon legend. Print CSS preserved.
4. **Progress** — per-stage mastery bars (items at criterion / total), rank
   distribution, shaky-items list (lapse-ranked), streak, shift-readiness %
   per stage (criterion-met, not cards-seen).

## The learning flow (locked — from the evidence digest)

Per unit, first exposure: **pretest** (60–90s guess-first, instant reveal,
errors framed as useful) → **teach** (one item per screen: name, photo slot,
components in ≤4 sub-chunks, allergen icon row, the one-line description;
swipeable) → **test-to-criterion** (prompt ladder MC → cued recall → free
recall/produce; an item graduates the session at 3 correct recalls; misses
recycle same-session). Review days: retrieval ONLY — the teach screen reappears
only after an error. Block by category for first exposure; interleave across
categories (deliberately pairing look-alikes) once unit accuracy ≥75% and for
all reviews. Free recall is **self-graded reveal** (Anki-style, fast on phone)
EXCEPT allergen cards which use tap-to-select + confidence. Reward only
retrieval successes. No scheduler internals in the UI — ranks only.

## Build phases (ship after each; each phase ends with the full gate ritual)

1. **Scaffold + Stage 1**: app-v3 scaffold, tokens port + contrast suite, PWA
   config, FSRS engine + idb store (TDD), Path/Today shells, Stage 1 Food
   complete (Unit 0 service cards + 8 dish units + checkpoint), Playbook v1
   (dish lookup + cram link). DEPLOY to the new Vercel project.
2. **Stage 2 Allergens + Playbook complete** (translator, table map, legend).
3. **Stage 3 Bar** (builds worked-example flow, Matinee, arc-of-service).
4. **Stage 4 Wine + Prep-my-bottle; Stage 5 Pairings.**
5. **Polish**: View Transitions, Web Speech fallback for pronunciation,
   60-second burst game.

**Photo scraping (runs alongside Phase 1, its own subagent):** pull dish and
cocktail imagery that already exists publicly — bridgettebar.com (Squarespace
galleries/section images) and Bridgette Bar Calgary's public Instagram — and
map what you can confidently identify to `foodId`/`cocktailId` in an ingestion
manifest (`app-v3/static/img/manifest.json`); optimize to webp ≤120KB, store in
`app-v3/static/img/`. Coverage WILL be partial — every teach/lookup card ships
with a graceful no-photo state, and never guess a match (a wrong dish photo is
worse than none; unmatched images are dropped). Personal training use only; I'll
replace/extend with my own photos taken at work later.

## Process requirements

- Use the superpowers suite: `superpowers:subagent-driven-development` with
  TDD + spec-compliance reviewers per task; `superpowers:verification-before-completion`;
  run the `/code-review` skill at medium effort on the diff before EVERY push
  and fix real findings.
- Verification ritual from `app-v3/`: `npm test && npm run check && npm run
  build && npx playwright test` — all green before any push. Port the axe
  both-themes e2e pattern from `app/e2e/a11y.spec.ts` early.
- Commit style `feat(v3): …`, end with
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- NEVER touch `app/` (v2), the menu-sync pipeline, or v2's Vercel project.
  Log any official-doc conflicts to `docs/v2-open-questions.md` instead of
  stopping. I'm at work — make the call the truth policy implies and log it.
- Use subagent teams liberally to protect context; sequence anything that runs
  npm in the same directory.

## Decisions confirmed by me (2026-06-11 — do not re-ask)

- Dish/cocktail photos: SCRAPE what exists now (site + public Instagram, see
  the photo-scraping step above); photo slots with graceful no-photo states
  for everything unmatched; I'll supply my own photos later.
- Fresh progress (no v2 import).
- Free recall self-graded reveal; allergen cards tap-to-select + confidence.
- Phased shipping (Stage 1 ships first, same session).
