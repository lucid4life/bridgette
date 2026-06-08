# Bridgette Training v2 — Course + "On the Floor" Redesign (Design Spec)

**Date:** 2026-06-08
**Branch:** `v2-app` (never merged/deployed by Claude — Adrian deploys)
**Owner:** Adrian Beeksma (server/bartender, Bridgette Bar Calgary; beginner → wants to be the best server on the floor; studies at home on a laptop)
**Status:** Design approved section-by-section via the visual companion + clarifying questions. Awaiting Adrian's review of this written spec before the implementation plan.

**Companion research this spec rests on:**
- Fresh-eyes consultant review → [`docs/research/2026-06-07-v2-fresh-eyes-consultant-review.md`](../../research/2026-06-07-v2-fresh-eyes-consultant-review.md)
- Content correctness sweep (fix-list) → [`docs/research/2026-06-08-v2-content-correctness-sweep.md`](../../research/2026-06-08-v2-content-correctness-sweep.md)
- IA convergence study (3-layer) → [`docs/research/2026-06-08-v2-ia-convergence.md`](../../research/2026-06-08-v2-ia-convergence.md)

---

## 1. The problem & the core idea

The v2 app is well-engineered (real Leitner engine, 125 tests, accessible) but it **trains the wrong rung of the skill**: every surface — including the Guest Simulator — is multiple-choice *recognition* (pick the wine **name**). The actual floor skill is *production*: say the pour **and the one-line reason** out loud, on demand. And the highest-value content (substitutions, pairings) is buried (the Translator is 1 of 8 Reference filter chips) and **authored three times** in three places that can drift.

**Two moves fix this:**
1. **Flip the graded target from the NAME to the spoken WHY** (production via self-rate).
2. **Restructure around how a server actually works** — a *course* that teaches the why, a first-class *"On the Floor"* hub for the in-the-moment moves, drills that build the reflex, and a single canonical data layer behind all of it.

The app becomes a genuine **educational tool**: **Learn it → Drill it → Apply it → Look it up.**

## 2. Locked decisions (from the design session)

| Decision | Choice |
|---|---|
| Production mechanic | **Self-rate the spoken why** — "Nailed it · Close · Missed" after reveal (offline, no NLP) |
| Engagement scope | **Course (full 10 modules) + "On the Floor" hub + the frame fix + Phase-0 safety/quick-wins** |
| Brand assets | **Free brand-true look-alike** (self-hosted body font; no official assets blocking) |
| Content QA | **Full sweep done** → fixes integrated in Phase 0 |
| Navigation | **5 tabs: Today · On the Floor · Practice · Learn · Reference** (Progress folds into Today) |
| Substitutions / Pairings | **First-class, but as the two sections of ONE "On the Floor" hub** — NOT two separate tabs; a *view* over a single data layer |
| Course order | **Strict foundations-first** (M1→M10) |
| Course progression | **Mastery-gated with a "jump ahead" escape hatch** |
| Course depth | **Full 10-module curriculum across the whole menu** |
| Today hero | **Smart / auto-picking** (new module if ahead on reviews, else "do your review first") |
| Tech stack | **Keep SvelteKit + Svelte 5 + adapter-static PWA + localStorage** (FSRS + data-pipeline rewrite deferred) |

## 3. Information architecture (the skeleton)

Five top-level destinations, identical on desktop sidebar and mobile tab bar. Each has ONE job; the microcopy contract is stated in-app so the labels don't blur:

> **Today** = your next step · **On the Floor** = do it now · **Practice** = build the reflex · **Learn** = why it works · **Reference** = the full menu.

| # | Tab | Job | Single home for |
|---|---|---|---|
| 1 | **Today** | "What do I do right now?" | dashboard, smart hero CTA, shift-ready, streak, **Progress (folded in)**, the global "Guest asked for…" search entry |
| 2 | **On the Floor** | "A guest just spoke — what's my move?" | the **substitution** surface + the **pairing** surface, as *views* over the canonical data layer |
| 3 | **Practice** | "Build the reflex." | Smart Review (SRS), Guest Simulator, Readiness, My Mistakes |
| 4 | **Learn** | "Why does it work?" | the 10-module mastery-gated course |
| 5 | **Reference** | "Look up the full menu." | exhaustive catalog: every wine, bottle, beer, digestif, food, cocktail |

**Single-source-of-truth rule (the load-bearing guardrail):** the canonical data is `data.js` (`translator[]` joined to `wines[]`; `foods[]` + inverted `wines[].pair`/`cocktails[].pair`). Every surface is a **VIEW**. "On the Floor" must NOT re-author substitution/pairing content — it renders the same source the Learn lesson and the Practice deck cross-link *to*. (Fixing the existing 3-copy fragmentation is a primary goal, not a side effect.)

**Global "Guest asked for…" search (hard dependency):** a persistent search that fuzzy-matches grape names, aliases, misspellings, dishes, and wine names, and lands on the right "On the Floor" entry or Reference record. The convergence study flags this as the #1 build risk — if it's weak, the "promote the job, single-source the data" bet fails. It must be built well.

## 4. "On the Floor" hub

A segmented surface: **[Substitutions] [Pairings]**, plus the global search.

### 4a. Substitutions — grouped by structure-family
Reuse the 5 families already in `wines[].family` (verified): **Bubbles & Rosé · Bright & Crisp Whites · Round Whites · Light Reds · Structured Reds**, ordered lightest→boldest. Within each lane, list the guest-asks that resolve to a pour in that family, so the cross-grape logic is **visible** (Cab, Merlot, Malbec, Chianti, "sweet red" all land in Structured Reds because they share a body×tannin box). By-structure for *learning*; the search box on top for *speed*.

**Canonical entry shape (rendered identically everywhere it appears):**
1. Guest ask + aliases.
2. **The pour** (by-the-glass wine) as the headline.
3. **The bridge line as the hero** — the one sentence Adrian *says* ("Claret is Cabernet softened with Merlot — same dark-fruit lane, easier tannin"). This is the produced, graded skill.
4. A body × acidity (+ tannin for reds) **StructureMeter** (reuse the existing component) — match shown by structure, not asserted by name.
5. **Pronunciation respell + 🔊 speak button on the pour** (currently rendered nowhere; wire the verified 30/30 `bestGlass`→`wines` join).
6. The **bottle upsell ladder** (`bottleOptions`) for "I want the real grape."
7. An **honest-pivot flag** for no-true-match asks (Moscato, Meiomi, Zinfandel, Viognier).

**Core "top 10" roster** (curated from the existing 30 translator rows; from ordering data, *to be confirmed against Bridgette POS if ever available*): Cabernet Sauvignon, Chardonnay (plain vs oaky), Pinot Grigio/Gris, Pinot Noir, Sauvignon Blanc, Merlot, Malbec, Riesling, Moscato/sweet white (honest pivot), Prosecco/Champagne/Cava. Next tier surfaced below: Rosé, Chianti/Sangiovese, Shiraz/Syrah, sweet "plush" red, Bordeaux blend.

### 4b. Pairings — one lever system, both directions, all three drinks
Wine, cocktail, and zero-proof pairing all run on the **same 6 levers** (weight/intensity · acid-cuts-fat · tannin-binds-protein · sweet-tames-heat · salt-lifts-fruit · bitterness-as-structure). One lever-driven surface, not three.

Per dish: the dominant structural cue (`flavor`) → the **three picks side by side** (wine | cocktail | zero-proof) → **one shared lever-line that justifies all three**. Add:
- **Both directions:** dish→drink (from `foods[]`) AND drink→dish (invert `wines[].pair`/`cocktails[].pair`) — the "I'm pouring Nebbiolo, what do I feed it?" case Adrian named.
- **A "by-lever" view** ("show every acid-cuts-fat dish") so the *rule* is drilled, not 42 memorized pairs.

### 4c. Cross-links (no dead ends)
Every substitution lane and every lever links to **Learn** ("why Claret answers a Cab ask") and to **Practice** ("drill this"). The upsell ladder links to **Reference** (full bottle list). The graded target in Practice is always the **bridge line / the lever**, never the name.

## 5. Learn — the 10-module course

**Structure:** 10 modules in 4 tracks, strict foundations-first, mastery-gated with a "↪ Jump ahead" escape hatch. A spiral: structure (M1) is reused in pairing (M6) and substitution (M8) at rising complexity.

| Track | Modules |
|---|---|
| **A · Foundations** | M1 How wine works (acidity/tannin/body/sweetness + how to taste) · M2 The 5 families |
| **B · Know the list** | M3 Whites & bubbles by the glass · M4 Reds & rosé by the glass · M5 Going deeper: bottles & digestifs |
| **C · Your 3 floor moves** *(priority)* | M6 Food → wine (the 6 levers, both directions) · M7 Food → cocktails & zero-proof · M8 The substitution translator (by structure, anchored to ~6 reference grapes) |
| **D · On the floor** | M9 Making the recommendation & glass→bottle upselling · M10 Pronunciation mastery |

**Module anatomy (the proven read→retrieve loop):**
> Intro (why it matters at a table) → **Read chunk → Quick check** (interleaved, 3–5×, ~3–7 min each) → "What you'd say to a guest" worked example → **Module mastery check** (short mixed quiz; reason cards use the self-rate production mechanic) → ✅ **passes the gate → unlocks the next module AND seeds this module's cards into the Practice SRS decks** → "drill it now" handoff.

**Module → deck seeding map** (modules introduce, the SRS maintains): M1→structure · M2→families/wine-identity · M3/M4→wine-identity + pronunciation · M5→reference depth · M6→pairing + new wine→dish deck · M7→cocktail-pairing · M8→translator · M9→upsell · M10→pronunciation.

Pronunciation is **woven through every module** (every wine introduced with its respell + speak button) and consolidated in M10. The 7 existing Wine School lessons are absorbed and upgraded into this curriculum (not discarded).

## 6. The production / self-rate mechanic (the "frame fix")

**Where it applies:** reason-bearing cards (translator, pairing, cocktail-pairing, upsell), the module mastery checks, and the Simulator's Explain beat. Recognition (MC) stays only as the box-1/in-lesson on-ramp.

**The loop:** at box ≥ 3, the prompt asks you to **say the pour + the one structural reason out loud** → reveal shows the canonical answer + the `why`/`familiar`/`different` → you self-rate **Nailed it · Close · Missed**. The self-rate drives the Leitner box (Nailed = promote, Close = hold, Missed = demote) and feeds the existing confidence weighting.

**Engine fixes (in `app/src/lib/engine/training.js`):**
- The "say the reason" nudge currently fires only at `box>=4 && mode==='typed'`, so it **vanishes at box 5** (scenario mode). Fix: fire it whenever `box>=3` regardless of mode.
- `whyDisplay` returns empty at box 5 (correct on the *prompt* side — worked-example fade). Add the canonical `why` on the **reveal/confirmation** side at box ≥ 4 so the expert always gets their produced reason *confirmed*.
- Drop the redundant "I got it / I didn't" self-grade that currently follows an MC card already shown "✓ Correct" — MC auto-grades; self-rate is reserved for produced answers.
- Surface the **dead `familiar` field** (30 rows authored, 0 rendered) as the substitution reveal text.

**Card-id contract:** additive-only. Mode/grading/UI changes do not alter card identities. New decks (wine→dish) only *add* ids (like prior sprints). `bb_progress_v1` localStorage key stays frozen. A new **`bb_course_v1`** key stores course progress (module completion, gate state, jump-ahead) — separate store, behind a `courseStore` facade.

## 7. Practice changes
- **Guest Simulator:** add a **substitution turn type** (guest names a varietal from `translator[]` → Match → Explain[produce the bridge, self-rate] → bottle-option) — finally rehearses priority #1. The Explain beat becomes say-it-then-self-rate. Match beat keeps writing back to Leitner. Distractors structurally adjacent, not keyword giveaways.
- **Pairing:** grade the **lever**, not the wine; **add a wine→dish recall deck**; distractors punish protein-pattern-matching (so "pair the sauce" is exercised).
- **Upsell:** escalate from MC-forever to a self-rated produced bottle name + the ~5× economics line.
- **My Mistakes** + Readiness unchanged (already confidence-weighted, pronunciation excluded).

## 8. Today dashboard
- **Smart hero CTA** that auto-picks: resume the current module if you're ahead on reviews, else "do your review first (N due)."
- Shift-ready ring + streak; **Progress stats fold in here**.
- **The 3 floor-move quick-cards** (Substitute / Pair food→wine / Pair a cocktail) → deep-link into On the Floor.
- The persistent global **"Guest asked for…" search**.
- A kinder first-run/empty state (no demotivating "3% shift-ready" on a fresh account).

## 9. Reference
Stays the exhaustive menu catalog. The **Translator** and **Pairing matrix** chips move OUT (their logic now lives in On the Floor); Reference keeps Wine/Bottles/Food/Cocktails/Beer/Digestifs lookup. Restore the `slice(0,40)` pairing-matrix truncation (drops 2 dishes today).

## 10. Visual / brand (refinement, not rebuild)
The palette **is** genuinely Bridgette's. Phase-0 quick-wins:
- Tighten tokens to the **live bytes**: `--cream:#ffeed6`, `--orange:#f15825`.
- **Replace emoji icons** (⚡🍷🔮🏁🩹🎯) with the stroked-line icon set already in the nav.
- **Swap Arial for a free, self-hosted brand-true body font** (warm humanist; precached for offline). Keep Oswald for display.
- **Dial back the relentless all-caps** on greetings/labels; add a small **elevation scale** (resting / raised / floating) so each screen has one focal point.
- *(Deferred to a later brand pass: real wordmark/logo SVG, paper-grain texture, illustration, the paid Typekit face — these need Adrian's brand kit.)*

## 11. Content correctness fixes (Phase 0, from the sweep)
Apply the fix-list in [`2026-06-08-v2-content-correctness-sweep.md`](../../research/2026-06-08-v2-content-correctness-sweep.md):
- **Critical:** remove the 5.0% beer from French Fries' `zero` field; **add a build-time assertion** that every `foods[].zero` resolves only to the verified non-alcoholic list.
- **High:** Tawny Port → Quevedo Tawny 10yr; Fattoria Moretto dry → off-dry; Senat Amalgame & Raventós de Nit blends; cider/sour ABVs; add Fallentimber Honey Buck (mead); fix the Wagyu pairing (swap Nebbiolo→Deinhard Pinot, *team-confirm*).
- **Medium/low:** St. John Claret Cab-led; Gulfi region; Michelob ABV; low-alc disclosure (de-alc ≠ 0.0%); spellings/aliases.
- **Confirm-with-team list** routed to Adrian's sommelier (Bindi Classico vs DOCG; which Moretto cuvée; Stella ABV; Wagyu swap).

## 12. Tech approach
- **Stays** SvelteKit + Svelte 5 + adapter-static PWA + localStorage. New routes: `/on-the-floor` (+ the segmented sub-views), a restructured `/learn` (module system), a rebuilt `/today`, a slimmed `/reference`. New `courseStore` (runes) on `bb_course_v1`. A shared `GuestSearch` component over the canonical data layer.
- `start_url` → `/today`; redirect `/` → `/today`; the old root Practice picker moves under `/practice`.
- **Deferred (Phase 3, documented, not now):** FSRS via `ts-fsrs`; the typed/ESM data-pipeline rewrite + drift-check + relaxing the frozen card-id rule; the brand depth pass; a voice channel; visual-regression baselines.

## 13. Verification (gates stay green throughout)
Every change ships behind the existing discipline: **Vitest unit tests** (new: self-rate grading, substitution-turn builder, wine→dish generator, the `foods[].zero` non-alc build assertion, course gating/seeding, search fuzzy-match) · **svelte-check 0/0** · **Playwright e2e + axe-per-route** (add On-the-Floor, Learn-module, search routes) · **production build** · **v1 `check_training.py` PASS** · **card-id snapshot** (additive only) · browser-verified each step.

## 14. Phasing (the implementation plan will sequence this)
- **Phase 0 — safety & quick wins (hours→~1 day):** zero-proof fix + ABV assertion; the sweep's critical/high data fixes; `start_url`→Today; surface `familiar` + pronunciation on the substitution view; palette bytes + emoji→icons; matrix truncation; kinder empty state.
- **Phase 1a — IA + data layer:** 5-tab nav; canonical data layer + the translator↔wines join; the global search; Reference slim-down; Today rebuild.
- **Phase 1b — On the Floor:** substitution (by-family) + pairing (one-lever, both-directions) surfaces.
- **Phase 1c — Learn course:** module system, mastery gating + jump-ahead, read→check→mastery loop, `courseStore`, module→deck seeding, absorb the 7 lessons, build all 10 modules.
- **Phase 1d — production mechanic + simulator:** self-rate loop across reason decks + mastery checks; engine why-beat fixes; substitution turn; lever-graded pairing + wine→dish deck; upsell production.
- **Phase 1e — visual polish:** body font, elevation, caps, cross-links.

## 15. Open items / confirm-with-team
- The sommelier confirm-list (sweep §"Confirm with the team").
- The top-10 substitution roster vs Bridgette's real by-the-glass pour counts (if ever available).
- The "On the Floor" label (tentatively kept; can be renamed — Adrian's call).

## 16. Explicitly NOT in scope now
FSRS; typed data-pipeline rewrite + card-id relaxation; real logo/Typekit/imagery/texture brand depth; voice/Web-Speech production grading; native app. All documented for a future phase.
