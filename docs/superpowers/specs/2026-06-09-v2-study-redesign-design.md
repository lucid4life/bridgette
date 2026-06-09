# Bridgette Training v2 — Study-Redesign (Design Spec)

**Date:** 2026-06-09
**Branch:** `v2-app` (never merged/deployed by Claude — Adrian deploys)
**Owner:** Adrian Beeksma (server/bartender, Bridgette Bar Calgary; beginner → wants to be the best server on the floor; studies at home on laptop / phone / tablet)
**Status:** Brainstormed with Adrian (search placement + On-Shift mockups in the visual companion → **pivot**). Adrian then delegated the rest: *"keep working until 100% complete; make the calls yourself."* So this spec is **approved-by-delegation**; every autonomous decision is logged in §13 for his review tonight.

**Companion research this spec rests on:**
- The prior redesign spec (now the baseline) → [`2026-06-08-v2-course-floor-redesign-design.md`](2026-06-08-v2-course-floor-redesign-design.md)
- Fresh-eyes next-frontier review → [`../../research/2026-06-09-next-frontier-options.md`](../../research/2026-06-09-next-frontier-options.md)
- A 5-agent read-only codebase map run to ground this spec (engine/card-model, emoji sweep, expand surfaces, Floor-Basics, retention) — findings folded inline below.

---

## 1. The pivot & the core idea

The original session brief was **"Floor-readiness"** — make the app usable *at the table* (persistent chrome search, an On-Shift glanceable mode, a Floor-Basics cheat sheet). Mid-brainstorm, after seeing the On-Shift mockups, Adrian rejected the premise:

> *"I'm never going to pull out my phone at the table with a guest… It's not professional. We need to focus on the studying — behind-the-scenes, from home on my computer/phone/tablet, building the knowledge base and cementing that knowledge into my brain."*

So the mission is re-centered. **The app is a study tool that builds and cements the menu in your head, used away from the table. Never a prop tableside.**

When asked where studying falls short, Adrian chose **make it stick (retention)**, **make it a daily habit**, and **better to study from (craft)** — and added the load-bearing requirement:

> *"Brief answer, but I can always click an Expand button for more detail — everywhere in the app. If I get one wrong, I want to see the answer I picked, the correct answer, and the details."*

**Two moves define the redesign:**
1. **Progressive disclosure, app-wide** — every answer is brief by default with an **Expand** to the full depth that's *already in the data* (no new content authoring).
2. **Rich miss-feedback** — a wrong answer shows **what you said**, **the correct answer**, and **why**, with the same expandable depth — so you learn *from the mistake, in place*.

These directly serve all three priorities: the depth-on-demand and learn-from-the-miss loop is the retention/craft lever; a curated on-ramp + a clearer daily drill is the habit lever.

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Direction | **Studying away from the table.** On-Shift mode + persistent chrome search are **cut.** |
| Progressive disclosure | **App-wide brief → Expand.** Inline accordion (native `<details>`), a shared `<Expandable>`. |
| Miss-feedback | **You said X · Correct Y · why**, + the same Expand depth. Generalised from the existing wine-only "confusion" block. |
| Content source | **Surface EXISTING data depth.** No new authoring; depth over breadth (no spirits lane, no new categories). |
| Floor Basics | **Soft study on-ramp:** a curated ~37-card set drawn first + an always-available **"Study everything"** toggle. **No hard lock** (honours the frozen "never forced / jump-ahead" decision). Default ON only for brand-new users; OFF for anyone with existing progress. |
| SRS engine | **Leitner stays.** No FSRS. |
| Retention | Strengthen what exists (4 small levers, §7); no new scheduling system. |
| Search | The existing `GuestSearch` stays on Today as a study lookup. Not promoted to chrome. |
| Frozen contracts | card-id slugs additive-only; `bb_progress_v1` + `bb_course_v1` keys frozen; data is generated (edit source + rebuild). |

## 3. The progressive-disclosure pattern (the house style)

**`app/src/lib/components/Expandable.svelte`** — a slot-based wrapper around the native `<details>/<summary>` element (built-in keyboard + screen-reader support, works without JS, reduced-motion friendly). Props: `label` (default `"Expand"`), `openLabel` (default `"Less"`), optional `tone`. It standardises the `▸→▾` affordance and summary styling. Reference already hand-rolls `<details class="objections">` (`reference/+page.svelte:135`); that becomes the first consumer.

**The contract:** every surface shows a **brief** block (the answer + the one line that matters) always visible, and an **Expand** that reveals the deep block. A *correct* answer gets the same Expand, just without the miss banner.

## 4. The redesigned study card (`app/src/routes/+page.svelte`)

### 4a. Source linkage (the unlock) — `app/src/lib/engine/training.js`
Cards can't currently reach their rich source record (only `pronunciation` + `mystery` carry `wineId`). **Additive fix:** during generation each card gains `sourceKind` + `sourceId` (and, for the two bridge decks, `sourceWineId` + `sourceFoodId`):

| Deck | sourceKind / sourceId |
|---|---|
| translator | `translator` / `slug(t.ask)` (resolve row by matching `slug(ask)`) |
| wine-identity, structure, pronunciation, mystery, upsell | `wine` / `w.id` |
| pairing | `food` / `f.id` |
| cocktail-pairing | `food` / `f.id` (+ `cocktail` name via answer) |
| wine-dish | `wine` / `w.id` (+ `sourceFoodId` = the answer dish) |

This is **additive to the Card object, never to the frozen `id` slug** — `card-ids.test.ts` snapshots only `.id`, `data.test.ts` snapshots data, so both stay green. The `Card` type (`types.ts:183`) gains `sourceKind?`, `sourceId?`, `sourceFoodId?`, `sourceWineId?`.

### 4b. Two pure engine helpers (mirror `whyDisplay`/`modeForBox`)
- **`missFeedback(card, chosen, data) → { said, correct, why, confusion? }`** — always returns `said`=chosen, `correct`=`card.answer`, `why`=one-line `card.why`; `confusion` resolves *both* sides via `sourceKind/sourceId` (generalising the current same-family wine check at `+page.svelte:63-68` so translator/food/cocktail misses also get a "you confused X with Y" beat).
- **`expandFor(card, data) → { sections: [{ label, text | items }] }`** — resolves the card's source record and selects the locked depth fields: **wine** → `tenSecond · structure(meters) · grape/region/climate · say · mnemonic(Remember) · pair(Pairs) · objections(nested) · upgrade`; **translator** → `familiar · different · phrase · bottleOptions`; **food** → `why · the three picks`. Only sections with data render (data-driven).

### 4c. The reveal UI
- **Brief (always shown):** the answer; on a miss, a **`You said: {chosen} ✗ / Correct: {answer} ✓`** banner + one-line `why` + the generalised mix-up note. (`chosen` for MC, `typedValue` for typed/scenario; `produce`/`flip` self-rate so they show the canonical answer without a "said" line.)
- **Expand (`<details>`):** the `expandFor` sections — the full card depth. **Always available at every box**, even when `whyDisplay` fades the prompt-side hint (box 5) — the brief honours the fade, the Expand always offers depth (Adrian's "always able to get more").
- A **speaker** (SVG) on cards with `audioText`.

## 5. App-wide application of brief → Expand

Priority order (highest study value first):
1. **Practice card** (§4) — the centerpiece.
2. **Reference wine card** (`reference/+page.svelte:108-145`) — brief = head + pron + `tenSecond` + price ladder + meters; Expand = `profile` + pairs + upgrade + the existing objections (folded into the one disclosure). Then **Bottles** (`:209-234`).
3. **On-the-Floor substitution card** (`on-the-floor/+page.svelte:182-211`) — brief = ask + pour + the bridge line; Expand = meters + pronunciation + point-of-difference + bottleOptions + phrase. (On the Floor remains a *study* reference surface, not an at-table tool.)
4. **Learn read sections** (`learn/+page.svelte:255-302`) — brief = name + grape/category + pron; Expand = the structure meters + `tenSecond`.

Food / cocktail / beer / digestif Reference cards are already near-brief; lowest priority.

## 6. Floor Basics — the study on-ramp

- **Filter seam:** in `buildSession` (`training.js:627`), after the candidate set is built, `const pool = ctx.basicsOnly ? cards.filter(c => BASICS_IDS.has(c.id)) : cards;` then partition `pool`. Leitner partition/sort/caps/interleave unchanged → all existing tests pass (they don't pass `basicsOnly`). Applies to **Smart Review** (`deckId == null`); Focus decks are an explicit choice and are not filtered. `progressStore.dueCount()` takes the same optional filter so Today can show "basics due."
- **The flag:** `Progress.settings.basicsOnly`. Additive + migration-safe: add to `defaultProgressShape()` (default `true`) and one line in `migrateProgress` — respect an explicit saved value, else default **ON only when `base.cards` is empty** (brand-new user), **OFF** when the user already has progress. No schema bump; `bb_progress_v1` stays byte-compatible.
- **The list (`app/src/lib/engine/basics.js`):** a human-readable allow-list of stable source keys (translator asks, wine ids, food ids), resolved to card ids **through the generators** (never hardcoded slugs). ~37 cards: Translator ×10 (Cabernet, Merlot, Malbec, Sauvignon Blanc, Pinot Grigio, Chardonnay, Pinot Noir, Riesling, Prosecco/Champagne, Rosé) · Wine-identity ×5 (one per family) · Structure ×8 (the levers on two anchor wines + 2 discriminators) · Pairing ×9 (marquee dishes across families) · Pronunciation ×5 (the hard names). `basicsIdSet(data)` drops any key that doesn't resolve; a **test guard** asserts every resolved id ∈ `validIdSet(data)` and the count is in `[30,40]` so data edits can't silently break it.
- **Toggle UI:** a "Study everything ⇄ Just the basics" control on Practice (home) and/or Today, bound to `progressStore.setBasicsOnly()`. Copy makes the soft gate obvious ("Starting with the ~37 essentials — switch to the full deck anytime").

## 7. Retention levers (small, low-risk, no contract change)
1. **Elaboration on every reveal** — the Expand drawer + drop the miss-only guard on the `Explain this →` link (`+page.svelte:393`) so a *correct-but-lucky* answer also offers depth.
2. **Retrieval-before-reveal nudge on MC** — a one-line "commit before you read the options" on the `mc` branch (`+page.svelte:351`), matching the existing produce/typed nudges.
3. **Strengthen hypercorrection** — fire the "worth re-learning" banner on any committed recall miss, not only `confidence==='sure'` (`+page.svelte:142`), so spoken `produce`/typed misses get it too. (Keep it from being noisy — only when the learner committed an answer, not on self-rate "Close.")
4. **Interleave Focus-deck sessions** — extend the `shuffle` at `training.js:650` to interleave the review portion within a focus deck (keep first-exposure intro order). Pure, deterministic via injected `rng`.

These are presentation/composition only — no card ids, no localStorage shape change.

## 8. Daily habit (`app/src/routes/today/+page.svelte`)
- **Drill of the Day** — a card in the hero grid: "Today's drill: {weakest deck}" → `/?deck={lowestDeckId}` (the `?deck=` deep-link already works). Reuses existing `weakest`/`deckMastery` derived state; no new engine.
- **Clearer "study now"** — a persistent secondary "Study now" affordance so the study action exists even on `course`/`caught-up` days when the hero points elsewhere.
- *(Push/scheduled reminders are explicitly NOT built — they need notification permission + SW work and are out of scope/risk; noted in §14.)*

## 9. Quick wins
- **Reachable backup (data-loss fix):** the Export/Import UI (`progress/+page.svelte:115-124`) is only reachable post-session. Add a **"Backup / your data" card on Today** (extract a small `<BackupCard>` reusing `progressStore.exportJson()/importJson()`); keep the `/progress` link from the session summary.
- **Zero-proof lookup records:** the verified non-alcoholic drinks (Noughty Rouge, Peroni 0.0, Freixenet, Gallina de Piel Neverwine, Redbull, Pop, Lovers Mountain, Short Film, Sunrise Spritz — the `zero-proof.test.ts` allow-list) are printed in pairings but not lookup-able. Add a small **"Zero-proof / Non-alcoholic"** Reference section listing each with the dishes it's suggested for (inverted from `foods[].zero`) — surfacing existing relationships, no new authoring. Searchable via `GuestSearch`.
- **Emoji → inline SVG:** replace functional emoji (🔊 speaker, 🐢 slow, 🔥 streak, ❄️ forgiven, 📅 calendar, ⚠ warning, 🔒 lock, ✓/✗/• status) with a small **`app/src/lib/components/Icon.svelte`** (path-array set matching the NAV convention: `viewBox 0 0 24 24`, `fill=none stroke=currentColor stroke-width=2`, `aria-hidden`). Decorative prose `→`/`←` stay text.
- **CI `ci.yml`:** add `.github/workflows/ci.yml` running the gates (`npm ci`, `npm test`, `svelte-check`, `npm run build`, Playwright) + the root `python tests/check_training.py`. It won't run until Adrian creates the GitHub remote; adding the file is safe and was requested.

## 10. Frozen contracts & data rules (reaffirmed)
- card-id slugs **additive-only**; the redesign adds **zero** new card ids (sourceKind/sourceId are card *fields*, not ids) → the frozen snapshot is unchanged, no `regen-card-ids.mjs` run needed.
- `bb_progress_v1` (adds the `settings.basicsOnly` key only, migration-safe) and `bb_course_v1` untouched in shape/semantics.
- Menu data is generated: any data change edits `src/data.js` / `src/data-fullmenu.json` → `node tools/build_app_data.mjs`; `python tests/check_training.py` stays green. (Zero-proof records, if they need a data field, follow this; otherwise they're derived in the Reference view from existing `foods[].zero` + `beerZero`.)

## 11. Verification (gates stay green at every commit)
`cd app && npm test` (add: `sourceForCard`/`expandFor`/`missFeedback`, `basicsIdSet` validity+count, the `basicsOnly` buildSession filter, migration default) · `npx svelte-check --tsconfig ./tsconfig.json` 0/0 · `npm run build` · `npx playwright test` (e2e + axe per route — new `<details>`/`<Expandable>` must stay AA + keyboard) · root `python tests/check_training.py` · card-id snapshot unchanged. Browser-verified each increment via the preview tools (snapshot + eval, screenshots flaky).

## 12. Phasing (small green increments)
- **P0 — engine foundation:** `sourceKind/sourceId` on generators + `Card` type; `expandFor` + `missFeedback` + tests. (No UI yet.)
- **P1 — the study card:** `<Expandable>`; rich miss-feedback + Expand drawer in `+page.svelte`; retention levers §7. Browser-verify.
- **P2 — app-wide expand:** Reference (wine, bottles), On-the-Floor, Learn read sections.
- **P3 — Floor Basics:** `basics.js` + guard test; `basicsOnly` setting + migration + buildSession + dueCount; toggle UI.
- **P4 — habit + backup:** Drill of the Day + study-now; `<BackupCard>` on Today.
- **P5 — quick wins:** `Icon.svelte` + emoji sweep; zero-proof Reference section; `ci.yml`.
- **P6 — docs:** update status doc, open-questions, memory.

Each phase = one or more green commits; gates run before each commit; nothing claimed done without verification output.

## 13. Decisions made autonomously (for Adrian's review)
1. **Scope reconciled to the pivot.** The original prompt's at-the-table features (On-Shift, persistent chrome search) are **cut**; "Floor Basics" is reframed as a **study** on-ramp. The 4 quick wins are kept (they stand on their own).
2. **Floor Basics default OFF for you** (you have existing progress) so your live review pool isn't shrunk; ON only for brand-new users. You opt in via the toggle. *Change if you'd rather default ON for yourself.*
3. **The ~37-card basics list** (§6) — my curation of the highest-yield core. **Please sanity-check the list.** Easy to edit (`basics.js`, human-readable keys).
4. **Expand = inline accordion** (your explicit pick) via native `<details>` for accessibility.
5. **Backup lives on Today** (not a re-added Progress tab) — keeps the 5-tab IA the redesign closed.
6. **Zero-proof records are lightweight** (name + inverted dish pairings), honouring "surface existing depth, no new authoring."
7. **No push notifications** for the habit nudge (permission/SW scope + risk).

## 14. Explicitly NOT in scope
On-Shift mode; persistent chrome/at-table search; FSRS; push/scheduled reminders; new content authoring (tasting notes/stories); the spirits lane / new categories; a brand-asset pass (logo/Typekit/illustration); visual-regression baselines. All deliberate, per the pivot and the locked decisions.
