# SUPER PROMPT — Build Bridgette Trainer v3: Stages 3–5 (Bar · Wine · Pairings) + Polish

Paste the short launch paragraph (bottom of this file, or the chat message that
accompanied it) into a FRESH Claude Code session opened in
`C:\Users\abeek\OneDrive\Documents\Bridgette Barr`, **ultracode ON**, standard
mode. This document is the locked plan — read it fully first, then execute.

---

## The situation (where the last session left it)

I'm Adrian, a new hire at Bridgette Bar Calgary (food-runner shifts now,
bartending next, wine depth ongoing — Wednesday tastings + an assigned bottle to
present at preshift; there is **no wine exam**). The training PWA is **v3**, in
`app-v3/` on branch `v2-app`, **LIVE at https://bridgette-v3.vercel.app** (its
own free Vercel project, auto-deploys on every push to `v2-app`). v2 lives on in
`app/` at bridgette-six.vercel.app and must **never** be touched except through
the shared data pipeline (below).

**What already ships in v3 (all live, all green):**
- **Stage 1 · Food Runner** — Path home (Duolingo-style spine), `day-one`
  service module + 8 dish modules (41 dishes) + `checkpoint-food`. Items:
  `dish:<foodId>` (components) and `service:<slug>`.
- **Stage 2 · Allergen Guardian** — 4 by-allergen-family modules
  (`allergens-seafood / -nuts / -diet / -common`) + `checkpoint-allergens`.
  Items: `allergen:<foodId>` (the dish's flags), graded by the frozen
  `allergens:<foodId>:flag` engine deck.
- **Stand-alone drills** (not in the Path stages, reached from Today/Path):
  `/romance` (say-it-aloud, dish items), `/allergens` (the sweep — grades the
  Stage-2 allergen items — + a score-only "judgment round": safe-calls, mods
  calls, glossary), `/test` (scored Mock Food Test — a 7-type question wheel),
  `/review` (FSRS queue), `/preshift` (2-min shaky warm-up).
- **Playbook** complete: dish lookup, printable Menu Cram (+ a fold-to-hide
  self-test variant), guest-ask translator, table map, allergen key, "say it
  right" pronunciation chips (73 ElevenLabs clips), house notes, quiz-me flip.
- **Progress** tab: per-stage mastery, rank distribution, shaky list, streak.
- **THE SELF-PACED MODULE MODEL (changed mid-build — important):** there is **no
  daily lesson cap and no finish-the-previous-unit lock**. Every lesson MODULE
  of an unlocked stage is open in any order; only the **checkpoint** is gated
  (opens when all lesson modules of its stage are complete). Stages still unlock
  **sequentially** (a stage opens when the previous stage is complete). Units are
  called "modules" in the UI; the Path shows "Module N" labels. Keep this model.
- **The multi-stage foundation is DONE** (this is the big unlock for your work):
  `journey/items.ts → itemsForUnit` dispatches by unit **kind + roster** (not by
  hard-coded Stage-1 ids); `allItems()` resolves every stage's items;
  `gating.ts` has `stageUnlocked` / `stageComplete` and is fully stage-generic;
  the Path home renders **every** unlocked stage's spine with a cross-stage
  continue; `/checkpoint/[stageId]` is **parameterised** (works for any stage
  with a checkpoint); `/unit/[unitId]` renders any item kind; `util.ts` resolves
  any item id for `/review`·`/preshift`·`/progress`. **You do not need to
  re-architect anything — you add new item kinds, rosters, accessors, and stage
  units, following the recipe in §4.**

Gates at handoff (HEAD `ab37d8e`): **678 vitest · svelte-check 0/0 · build ·
41 Playwright (axe both themes)**. 428 frozen v2 engine card ids intact.

## Mission

Complete the v3 journey: build **Stage 3 Behind the Bar**, **Stage 4 Wine +
Prep-my-bottle**, and **Stage 5 Pairings** as gated Path stages (each ≈ the size
of the original Stage-1 build), then the **Phase-5 polish** (View Transitions,
60-second burst game). Same bar as the rest of v3: best-in-class learning UX,
brand-true UI, every screen earning its place. Ship after each stage.

## Source-of-truth hierarchy (locked, unchanged)

1. The four official management docs (already parsed into the data layer: Food
   Syllabus June 2026, Beverage Syllabus Jan 2025, Service Guide, Onboarding
   Package). Conflicts → log to `docs/v2-open-questions.md`, don't stop.
2. Live printed-menu PDFs via `tools/menu_sync/` (prices + what's-listed;
   verified current). The rotating "Bartender's Monthly Feature" is un-syncable
   by design — don't invent it.
3. **Never invent menu facts.** Allergen answers ALWAYS carry the
   confirm-with-the-kitchen (food) / confirm-with-the-bar (cocktails) framing
   (`data.confirm.allergens`).

## Locked architecture (unchanged from the v3 superprompt — do not re-litigate)

SvelteKit 2 + Svelte 5 runes + adapter-static + vite-plugin-pwa, TS via
svelte-check, vitest + Playwright(+axe). Scheduler ts-fsrs v5 (`src/lib/srs/`),
named ranks New→Learning→Solid→Locked-in. Storage idb + `bb3_progress_v1`
localStorage mirror + `navigator.storage.persist()`. Design tokens in
`app-v3/src/app.css` only (semantic layer; never raw `--bb-*`): cream canvas,
slate ink, orange/ember action, marigold highlights, steel teal info + **wine
identity**. Track identities: food=orange, allergens=teal,
**bar=marigold, wine=teal, pairings=…(pick one strong accent per the design
skill)**. Oswald lowercase h1/h2, Hanken Grotesk body. Use the
`frontend-design:frontend-design` skill for each new screen; axe both themes +
the ported token-contrast suite gate every push. No generic-AI gradients.
View Transitions between path→session are Phase-5 polish.

## §1 — Stage 3 · Behind the Bar (cocktails)

**Item kind: `build:<cocktailId>`** (a NEW kind — the cocktail's build
knowledge, tracked apart from anything else). Reuse the frozen
`generateDeck('builds', data)` deck (13 cards: `builds:<cocktailId>:pick`,
`sourceKind:'cocktail'`) as the MC material — exactly how `dish:*` reuses the
components deck. Cocktail allergens reuse the frozen `allergens:<cocktailId>:flag`
cards (the allergens deck mints cocktail rows too — `sourceKind:'cocktail'`).

- **Data:** `data.cocktails` = 15 cocktails in 6 categories (Bright/spicy/smoky ·
  Floral/tea/citrus · Bitter/aperitivo/amaro · Fruity/tropical/sparkling ·
  Rich/spirit-forward · Zero-proof). Fields: `build[]` (official, 13 of 15 — see
  caveat), `description`, `flavorTags[]`, `allergens[]`, `allergenNote?`,
  `profile`, `pair`, `say`, `caveat?`. **Caveat:** `spicy-sandia` and
  `lovers-mountain` have NO official `build[]` (newer than the Jan-2025
  syllabus). Exclude them from build-recall (use `hasBuildDeck`-style guards like
  Stage 2's `hasAllergenMc`); they can still appear in flavor/pairing material.
  Log the missing-build gap to open-questions (already noted as item ~18).
- **Modules (your call, ~4–5 non-overlapping, by cocktail category or
  flavor-family):** e.g. `bar-bright` (bright/spicy/smoky + fruity/tropical),
  `bar-aperitivo` (bitter/aperitivo/amaro + floral/tea/citrus), `bar-spirit`
  (rich/spirit-forward), `bar-zero` (the 3 zero-proof). Group sensibly; keep
  rosters non-overlapping so gating stays clean (mirror `UNIT_ALLERGEN_IDS`).
- **The learning shape the superprompt names:** cocktail builds as **worked
  example → completion problem → full recall**. The session-engine ladder
  (mc → cued → free) already gives you recognition → cued → produce; map it:
  MC = "which spirit is IN the X" (builds deck) ; cued = "name the build of the
  X" with the spirit count + first letters ; free = "build the X from memory"
  (answer = `build.join(', ')`, detail = `description`). Add the allergen flag +
  confirm-with-the-bar line to every reveal.
- **`arc-of-service` module** (service-style items, like `day-one`): author from
  `docs/handoffs/2026-06-10-service-extract.md` §6/§delivery + the existing
  `arc-of-service` lesson — FIFO, branded coaster under beers/crushed-ice
  cocktails, romance the drink name at the seat, >1-min-sitting rule, guest's
  right/garnish-facing-right, stem/bottom-only. New `service:*` items (extend the
  authored set in `journey/service-items.ts`, or a sibling `bar-items.ts`).
- **Matinee facts** (a short authored module or fold into arc-of-service):
  Matinee = 2–5pm snack menu (the `matinee-snack-menu` food record holds the
  window); plus any late-night facts in the onboarding extract.
- **Checkpoint `checkpoint-bar`** — the whole stage cold (builds + flags + arc),
  free-recall, pass ≥ 85%, like the others.
- **Stand-alone bar drill (optional, high-value):** a "build the bar" say-it
  drill mirroring `/romance` (`/build`?) over `build:*` items, and/or fold the
  cocktail allergen flags into the existing `/allergens` sweep. Judgment-round
  parity is a nice-to-have.

## §2 — Stage 4 · Wine (+ Prep-my-bottle)

**Item kind: `wine:<wineId>`** (the by-the-glass pour's identity + 10-second
story). 17 glass wines in 5 families.

- **Data:** `data.wines` (17, fields incl. `grape, region, country, family,
  structure{acidity,body,tannin,sweetness}, climate, pronunciation{say,respell},
  tenSecond, profile, pair[], say, mnemonic, objections[], producerStory,
  whyWePourIt, compare[]`). Families: Bubbles & Rosé · Bright & Crisp Whites ·
  Round Whites · Light Reds · Structured Reds — **these are your 5 modules**
  (one per family; non-overlapping by definition). Reuse engine decks as MC
  material: `wine-identity` (34 — grape/region↔name both ways), `structure` (63
  — acidity/body/tannin recall), `pronunciation` (17 — has the MP3s in
  `static/audio/<wineId>.mp3`; render the speak button like the Playbook's
  TermSay), `mystery` (34 — structure-signature deduction). Ladder mapping:
  MC = wine-identity ; cued = "grape + region + the one-line story" with hints ;
  free = "give me the 10-second pitch" (answer = `tenSecond` / `say`).
- **The 11 v2 wine `data.lessons`** (`structure-words, how-to-taste,
  pairing-levers, deductive-grid, pronunciation-primer, talking-to-a-guest,
  common-substitutions, …`) are read-text + quick-check lessons — the superprompt
  says "restructure the 10 v2 wine modules into units." Decide: surface the most
  useful 2–3 as teach content inside the wine modules (the family teach screen),
  not necessarily 1 module each. Don't bloat.
- **Prep-my-bottle flow** (the headline wine feature — NOT a path module, its own
  route `/prep`): pick a bottle (from the 38 `static/fullmenu.json` bottles +
  the 17 glass pours) → its deep-dive (grape, region, producerStory,
  whyWePourIt, structure meters, pronunciation, pairings, objections) → a
  **5-question self-check** (drawn from that bottle's facts) → a **60-second
  presentation script builder** (assemble: name + pronunciation → grape/place →
  the one-line why-we-pour-it → a pairing → a closer; render a clean teleprompter
  card he can read at preshift). This is the Wednesday-tasting prep tool. The v2
  app has reference deep-dive pages at `app/src/routes/reference/wine/[id]` —
  read them for the data wiring + content depth (DO NOT copy v2 code; rebuild in
  v3 idiom).
- **Checkpoint `checkpoint-wine`** — identity + structure + the pitch, cold.

## §3 — Stage 5 · Pairings

**Item kind: `pairing:<foodId>`** (the dish → best pour + the WHY-lever). Fully
interleaved by design (this stage is about discrimination across the menu).

- **Data + engine:** `generateDeck('pairing', data)` (42 — "best by-the-glass for
  dish X + why"), `pairing-principle` (41 — "which lever explains this pairing":
  the 6 WSET levers in `engine/pairing.js LEVERS` + each food's `lever` field),
  `cocktail-pairing` (42 — best cocktail for a dish), `wine-dish` (16 — reverse:
  pour X, which dish?). The superprompt: "pairing levers + dish↔drink decks,
  fully interleaved." Build ~3–4 modules by lever-family or by direction
  (dish→wine, dish→cocktail, the reverse wine→dish, the levers themselves), or a
  single richly-interleaved stage. Ladder: MC = pairing deck ; cued = "what pours
  with X and what's the lever?" ; free = "make the call out loud + say why."
- **Checkpoint `checkpoint-pairings`** — pour-the-room, cold.

## §4 — THE RECIPE: how to add a stage (follow Stage 2 exactly)

This session already did this for Stage 2 — copy the pattern:
1. **`journey/types.ts`** — add the new kind(s) to `ItemKind`.
2. **`journey/stages.ts`** — add `UNIT_<X>_IDS` rosters (computed from data, like
   `UNIT_ALLERGEN_IDS`), the stage's `lesson(...)` modules + a `checkpoint`
   unit, and **remove `locked: true`** from that stage (sequential gating opens
   it when the previous stage completes). Add a `CHECKPOINT_<X>_UNIT_ID` const.
3. **`journey/items.ts`** — add the item factory; extend `itemsForUnit`'s
   roster dispatch; extend the accessors **`mcFor` / `cuedFor` / `freeFor` /
   `teachFor`** with a branch per new kind (return the right engine-card MC for
   `mcFor`, the right recall prompt/answer for cued/free, the right teach card
   for `teachFor`). **`mcFor` is the grading source of truth** — the learn
   session reads it for correctness, so the dispatch MUST be in `mcFor`, not just
   the route. Add a `has<X>Deck(item)` guard for items lacking official material
   (like `hasAllergenMc`), and have rosters/sessions exclude them.
4. **Session sub-engines** (`src/lib/session/`) — if you add a kind-specific
   guard like the romance/allergen sessions did, **accept the new kind** (the
   Stage-2 bug this session fixed: `createAllergenSession` rejected allergen
   items — `app-v3/src/lib/session/allergen.ts:34`. Don't repeat it). Most flows
   route through the generic `createLearnSession` / `createCheckpointSession`,
   which are already kind-agnostic.
5. **Routes** — `/unit/[unitId]` and `/checkpoint/[stageId]` are already generic;
   add a kind branch to the MC rung in `/unit` if the new kind needs why/confirm
   framing (see the allergen branch already there). The Path home + Today pick up
   the new stage automatically (they iterate `STAGES` / unlocked stages).
6. **Stand-alone drill** (optional per stage) — model on `/romance` or
   `/allergens` for a say-it / sweep drill over the new items; reachable from
   Today + the stage's preview.
7. **Tests** — vitest for the new accessors/rosters (validity over real data,
   determinism, exclusions), gating tests for the new stage's unlock, e2e axe +
   a smoke per new route. Mirror `journey/test-bar.test.ts` and
   `gating.test.ts`'s self-paced block.

## §5 — Phase-5 polish (after the three stages ship)

- **View Transitions** between path → session (Safari 18+; progressive — guard
  on `document.startViewTransition`; reduced-motion respected).
- **60-second burst game** — a timed mixed-quiz over all introduced items
  (any kind), reward only retrieval successes, no leaderboards/streak-pressure
  (the project's avoid-list). One tap from Today.
- **Web Speech pronunciation fallback** is already done (TermSay).

## Data inventory (verified at handoff)

- Cocktails: 15 (13 with official `build[]`); engine `builds` deck = 13 cards.
- Wines (glass): 17 in 5 families; engine `wine-identity` 34, `structure` 63,
  `pronunciation` 17 (+ MP3s), `mystery` 34. Bottles: 38 + 20 beers + 25
  fortifieds in `static/fullmenu.json` (Reference/Prep-my-bottle only).
- Pairing engine: `pairing` 42, `pairing-principle` 41, `cocktail-pairing` 42,
  `wine-dish` 16; 6 levers in `engine/pairing.js`.
- Wine `data.lessons` (11) for teach text; cocktail/service extracts in
  `docs/handoffs/2026-06-10-*.md` (LOCAL-only, untracked — read, don't commit).

## Process requirements (same discipline as the whole v3 build)

- Use `superpowers:subagent-driven-development` with TDD + a spec-compliance
  reviewer per task **when subagent dispatch is reliable** — but note the
  hard-won lesson below; building inline with tight gating is an acceptable
  fallback and was used for much of Stage 2.
- `superpowers:verification-before-completion`; run `/code-review` at medium
  effort on the diff before EVERY push and fix real findings.
- **Verification ritual from `app-v3/` before any push:**
  `npm test && npm run check && npm run build && npx playwright test` — ALL green.
- Browser-verify each new screen with the preview MCP (server name `app-v3`,
  port 4321), both themes + mobile, console clean; reset the store after seeding.
  To test a later stage you must seed Stage-1/2 complete — seed the
  `bb3_progress_v1` localStorage mirror with `unitDone` gates for the prior
  stages' units (the pattern this session used), then `indexedDB.deleteDatabase('bb3')`
  + reload.
- Commit style `feat(v3): …`, end with
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Push to `v2-app`
  (auto-deploys to bridgette-v3). Ship after each stage; verify the Vercel deploy
  READY at your SHA + CI green (`gh run list`).
- NEVER touch `app/` (v2) except via `tools/build_app_data.mjs` (the shared data
  pipeline — and it must keep v2's outputs byte-identical; v2 `npm run check`
  must stay green too — a missed `src/data.js` change broke v2's svelte-check
  once this session). Never touch the menu-sync pipeline or v2's Vercel project.

## Known gotchas (learned this build — heed them)

- **OneDrive + parallel sessions:** the repo is in OneDrive and a second Claude
  session may edit the SAME files mid-work. Before editing, re-read the file;
  before commit/push, `git fetch` + check `git status` and reconcile. See the
  `bridgette-onedrive-parallel-session-hazard` memory.
- **Account session caps:** background agents sometimes die mid-task with a
  "session limit" result (no work product). Audit partial state (`git log`,
  `git status` — agents sometimes COMMIT before dying) and finish inline; a
  liveness check (does the transcript file grow?) tells you a dispatch is dead.
- **Kind guards in sub-sessions** must accept every kind they serve (the
  allergen-session bug). When you add `build:*`/`wine:*`/`pairing:*`, grep the
  session sub-engines for `kind !== '…'` throws and widen them.
- **`mcFor` dispatch** is the grading truth — a new kind that renders one MC in
  the route but returns a different one from `mcFor` will mis-grade silently.
- **Self-paced model** — don't reintroduce per-day throttles or sequential unit
  locks; only checkpoints gate, and stages gate sequentially.

## Definition of done

Stages 3, 4, 5 each: gated on the Path, modules + checkpoint, new item kind(s)
with accessors + tests, browser-verified both themes, `/code-review` clean,
pushed, deploy READY, CI green. Prep-my-bottle live at `/prep`. Phase-5 polish
shipped. `docs/handoffs/2026-06-12-v3-phase2-notes.md` deferred items closed or
re-logged. v2 untouched and still green.
