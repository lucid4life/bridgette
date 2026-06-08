# Bridgette Bar Training App — Fresh-Eyes Consultant Review

**Date:** 2026-06-07
**Prepared for:** Adrian Beeksma (owner)
**Scope:** v2 app — functionality of the three priority workflows, UX/IA, visual/brand, learning-science efficacy, tech-stack honesty, menu/brand fidelity.
**Method:** Five independent audit angles plus three external research streams, reconciled against the live code (`app/src/lib/engine/training.js`, the route files, `app/src/app.css`, `src/data.js`, `app/vite.config.ts`) and the live Bridgette Bar CSS.

---

## 1. Executive verdict

This is a genuinely well-built piece of software solving the wrong-shaped problem. The engineering is real — a proper Leitner engine, accessible routes, an honest readiness metric, seven authentically conceptual WSET lessons, and a content layer that, on the surface a server *reads*, now resolves every substitution and pairing the prior audit said was missing. If the job were "pass a flashcard exam about Bridgette's list," this app would be excellent. But the job is to make Adrian the most confident server on the floor, and that job is **verbal, improvisational, and produced out loud** — and the app never once makes him *produce* the pivot, the pairing reason, or the substitution and have it checked. Every retrieval surface, including the Guest Simulator that is supposed to be the differentiator, is multiple-choice recognition or wine-name token-matching. **The single biggest opportunity is to flip the graded target from the wine NAME to the spoken WHY** — finish the half-wired "generate the reason" beat, turn the simulator's Explain beat into say-it-then-self-rate, and stage the owner's #1 priority (a guest asks for a varietal we don't pour) as an actual rehearsed conversation. That one shift converts a polished quiz into the floor trainer this is meant to be, and it costs days, not a rewrite.

---

## 2. What's genuinely working

No padding — these are real and should be protected while everything else changes:

- **The SRS engine.** Real Leitner boxes, a gentle lapse rule, confidence weighting, adjacency-aware distractors on the wine decks, and a forgiving streak with a silent freeze that respects a shift worker's life. This is the most sophisticated part of the product and it is sound.
- **The conceptual content.** The seven WSET-based lessons ("acidity cuts fat," "tannin binds protein," "one reason sounds expert, three sounds nervous") genuinely teach the *why*. The translator's honest pivots ("Meiomi → we don't sweeten reds, here's the honest pivot") and the `different` deltas match how top restaurants actually train. This is rare and valuable.
- **The honest readiness metric.** Confidence-weighted, with pronunciation correctly excluded from the gauntlet. The instinct to measure real competence rather than vanity is exactly right.
- **The content layout.** Filtered, scannable, no walls of text. The dual-coded visuals (structure meters, style/region maps, family system) are a real strength.
- **The brand bones.** Cream `#ffeed7`, orange `#f15623`, and Oswald display are the *real* Bridgette assets, not invented — confirmed against the venue's own live CSS. The palette decision is correct.
- **The tech foundation.** SvelteKit + Svelte 5 + adapter-static + offline PWA + localStorage is correctly scoped for one offline user. It is neither over- nor under-engineered.

---

## 3. The 10 biggest weaknesses, ranked

### 1. The "why" is asked for but never elicited, generated, or graded — the entire differentiator is decorative
**What it is.** Across every reason-bearing deck the objective grade is the answer token only. At box 5 the "scenario" prompt literally says *"Recommend the glass and give the one structural reason it works,"* but `gradeTyped` matches only the wine name and discards the reason. Worse, the "say the reason out loud" nudge is gated to `box>=4 && mode==='typed'`, and `modeForBox` returns `'scenario'` (not `'typed'`) at box≥5 — so the nudge fires at box 4 and then *vanishes* at box 5, the exact moment the scenario demands the reason. `whyDisplay` even returns empty at box 5.
**Why it hurts.** The product's whole claim over a flashcard app is teaching the structural *why*. For the owner's three priorities the *why* **is** the skill, and it is the one thing never put under retrieval. A server who passes this can name the pour and still freeze when the guest asks "why that?"
**The fix.** At box≥4, keep name-grading as the objective gate, but after reveal show `card.why` and ask "Did you give the reason? Sure / Shaky" (self-rate, mirroring confidence). Move the nudge to fire whenever `box>=4` regardless of mode. Keep the why **visible** at box 5 — the expert confirms the reason, doesn't lose it.

### 2. Everything is recognition; the server never PRODUCES a recommendation out loud
**What it is.** Boxes 1–2 are MC, boxes 3–4 are typed-name matching, the simulator is four-button MC end to end including the "Explain the why" beat (pick `f.why` from four whys). Recognition memory is far weaker for transfer than free recall.
**Why it hurts.** Floor competence is a *speaking* skill — produce the wine and one structural reason on demand. MC is solvable by elimination and trains an easier, different skill. The category leaders (Duolingo Max Roleplay, Sommo's AI-graded free-text) crossed exactly this recognition→production line in 2024–25 because production is what transfers.
**The fix.** Add a produced-answer rung (typed free-text or voice via Web Speech API) to the translator, pairing, and simulator Explain beats. A local rubric/keyword grader is sufficient for v1; recognition stays only as the box-1 onboarding rung.

### 3. The Guest Simulator never stages the #1 priority (a guest asking for a varietal we don't pour)
**What it is.** `buildTurns` is built entirely from `data.foods` (dish→wine). Every guest line is "Table's having the {dish}… what's your pour?" No turn is ever built from `data.translator`; a guest never says "Do you have a Malbec?"
**Why it hurts.** The simulator is sold as the place a server rehearses a real table — yet the owner's top-stated priority, the substitution conversation, is the one thing it cannot rehearse.
**The fix.** Add a substitution turn type: guest names a varietal from `data.translator`, beats = Match (pick the glass) → Explain (produce the point-of-difference) → Bottle-option. The data already exists; this is a few hours.

### 4. App recommends a 5.0% beer as a "zero-proof" option to a non-drinking guest
**What it is.** `data.js:1720` — French Fries `zero: "Freixenet Sparkling Wine or Ol' Beautiful Okami Kasu Japanese Lager"`. The source menu lists Ol' Beautiful at 5.0% ABV. It renders live on the Reference Food card and in the cocktail-pairing why. (Verified present in the build.)
**Why it hurts.** This is the one genuinely *unsafe* recommendation in the dataset — a guest who asks for non-alcoholic is told a full-strength beer qualifies. It is exactly the category of error the app exists to prevent, and it trains the server to repeat it.
**The fix.** Remove "Ol' Beautiful…" from French Fries' `zero` field (Freixenet alone is correct). Add a build-time assertion that every `foods[].zero` resolves only to genuine 0.0/0.5% items, so a full-ABV leak can never recur.

### 5. No beginner on-ramp — the whole 279-card mountain at once, infeasible for "a few weeks"
**What it is.** `NEW_CAP = 9` new cards/session over 279 total = ~31 sessions just to *introduce* every card once, before spaced reviews compound. There is no curated "core shift kit," and the largest deck (structure, 63 cards) is the most abstract material, interleaved from day one.
**Why it hurts.** A near-beginner is dumped into a 31-session mountain led by the hardest deck, with no "learn these 7 substitutions and 6 pairings first" path — despite the lessons themselves naming exactly that shortlist.
**The fix.** Add a "Floor Basics" starter track (~30–40 hand-picked cards: the 7 named substitutions, the applied pairing levers, the top upsells, the 5 families) that draws new-card slots first and gates the long tail. Re-scope the "shift-ready" estimate to that subset so "floor-fluent in a few weeks" is arithmetically possible.

### 6. The app opens onto a 13-tile menu, not the dashboard the team built
**What it is.** The PWA manifest has **no `start_url`** (verified — `vite.config.ts` defines none), so it launches at `/`, which is the Practice deck-picker: 5 mode tiles + a ~8-button "Focus a deck" grid = ~13 competing choices with zero "do this now." The screen designed as the launchpad (`/today`) is a tab the user has to discover.
**Why it hurts.** Every launch is a paralysis screen. The one screen that answers "what do I do now" (due count, readiness ring, Start CTA, onboarding) is orphaned at launch.
**The fix.** Set `start_url` to `/today` (and/or redirect `/` → `/today`), move the deck-picker off the root. One-line manifest change plus a route rename — the highest-leverage UX fix available.

### 7. Recognition-only decks never escalate — the highest-revenue skill (upsell) is MC forever
**What it is.** `modeForBox` forces `kind:'discriminate'` cards to MC at every box. `genUpsell`, `genStructure`, and `buildMysteryPour` are all `discriminate`, so they stay 4-option MC forever. A server can pass "upsell" to box 5 having only ever *recognised* the right upgrade, never produced "the White Rock Cabernet" cold.
**Why it hurts.** Upsell is the highest-revenue floor act and it is never rehearsed as production; structure (a core area) is capped at recognition too.
**The fix.** Give upsell a typeable bottle-name answer so box 3+ becomes free recall. For mystery, box-5 types the wine from the fingerprint. At minimum, label all-MC decks as "recognition only" so mastery% isn't read as fluency.

### 8. The app borrows Bridgette's colours but not its soul
**What it is.** Zero imagery, texture, or art direction anywhere (confirmed — only PWA icons and a placeholder "BB" `icon.svg`). Consumer emoji (⚡🍷🔮🏁🩹🎯) are the primary iconography. Body type is plain **Arial** (the real venue loads a paid Adobe Typekit face). The shell is a cold dark-navy SaaS dashboard; the real Bridgette is a warm, sun-baked, mid-century, illustrated, paper-textured world (FRANK interior + Public Eye / Rob Bailey artwork).
**Why it hurts.** It reads as a flashcard utility, not an upscale-restaurant product. The flatness and emoji are the single biggest "cheap/unfinished" signals, and they sit on top of the owner's three priority surfaces, which render as the most generic monochrome text in the app.
**The fix.** Replace emoji with the clean stroked-line icon set already shipping in the nav; tighten the palette to the exact live bytes (`#ffeed6` / `#f15825`); swap Arial for a brand-true self-hosted body face; add a paper-grain texture, a real wordmark, and one Rob-Bailey-style illustration; re-frame the canvas warm (cream-default) rather than cold navy.

### 9. One flat elevation everywhere — no hero, no focal hierarchy
**What it is.** Nearly every container is the same `rgba(255,238,215,.05)` card with a 1px border and no shadow. The Today hero, the lesson tiles, and a footnote tip card all carry identical visual weight.
**Why it hurts.** Premium UI earns its feel from a calibrated elevation scale and one clear focal point per screen. Here the eye has nothing to land on; it reads as an undifferentiated grid — the classic "generic dashboard" tell — and the owner's priority cards look identical to rote drills.
**The fix.** Add a 2–3 step elevation scale (resting / raised / floating); promote the Today CTA and active flashcard to the top. Redesign the Translator card as a left-to-right "they ask → you pour → one reason" layout with the point-of-difference as the visual hero.

### 10. The data pipeline is brittle in three concrete ways and will be how this breaks
**What it is.** The source of truth is a v1 browser global — `src/data.js` literally does `window.BB.data = {…}` (verified) — `eval`'d in a Node sandbox to be read. The generated 112 KB `data.js` and 76 KB `fullmenu.json` are both committed to git, and **none** of the three pipeline scripts is wired into any npm/prebuild hook. They are run by hand, so the committed generated data can silently drift from source with no gate. Separately, card-ids are slugs of human-readable answer text, frozen forever, so fixing a typo trips a manual migration ritual.
**Why it hurts.** The day Adrian edits `src/data.js`, runs the app, and *doesn't* see his change (because nothing regenerated), or edits the generated 112 KB file directly, the two diverge permanently. This is the single most likely way the project breaks.
**The fix.** Promote the data to a typed ESM/TS module (`export const data … satisfies BridgetteData`), drop the sandbox-eval, wire generation + a drift `--check` into a `prebuild` hook (and gitignore-or-CI-gate the generated artifacts). Author stable short ids (`t01`, `w-deinhard`) instead of slugging display text; keep only the localStorage key and export/import path frozen.

---

## 4. The three priority skills (the heart of this report)

All three share one root failure: **the engine retrieves the wrong *rung* of each skill.** It drills the NAME when the floor skill is the produced, structural WHY. Below, each skill: how it works today, what's wrong, the redesign.

### 4a. The substitution translator (priority #1)

**How it works today.** A guest names a varietal we don't pour; the Reference Translator card resolves it ("Napa Cab → White Rock") with bottle upgrades, price ladders and objection accordions. The practice deck (`genTranslator`) sets `answer: t.bestGlass` (the wine name) with four wine-name choices — pure name-recall. As a *lookup* it is strong; the prior content gaps (Gamay, Viognier, Albariño, Cava, sweet-red) are closed.

**What's wrong.**
- The graded target is the NAME, not the pivot. The deck drills "Cabernet → Claret" as a fact and never trains the pivot *sentence*.
- The single best-authored asset for the pivot — the `familiar` field ("Same grape. Fuller white lane with pear…") — exists on all 30 rows but is **rendered nowhere and used in no deck** (verified: 30 occurrences in data, 0 in the engine). Dead data on the #1 skill.
- The card has **no pronunciation** — it hands the server "Weissburgunder," "Hiedler Löss," "Ca' del Baio" with no respell and no speak button, defeating the pronunciation pillar precisely where it matters most.
- The simulator never stages this conversation at all (see §3.3).

**The redesign — what makes Adrian nail it tableside.**
1. **Make the retrieval target the bridge, not the name.** At box≥3 prompt "A guest wants Cabernet — give the pour AND one line on why it fits," and grade/self-rate the *produced* pivot, reusing `familiar` + `different`.
2. **Anchor everything to ~6 reference grapes** (Cab, Pinot, Chardonnay, Riesling, Sauv Blanc, Syrah) and teach every row as "like [anchor] but ___." Make the `different` delta the *headline* of the card — that is the exact sentence Adrian says to the guest and the exact unit a beginner can hold.
3. **Frame the match by STRUCTURE, not name.** Show a body × acidity position on every translator card so Adrian *sees* Claret sits where Cab sits. This is what lets him field a grape that's on no list — the real test of priority #1.
4. **Surface `familiar` and add the respell + speak button** inline (look up `bestGlass` in `data.wines`). Trivial wiring; the join already exists.
5. **Add the substitution turn type to the simulator** so the pivot is rehearsed under pressure, produced not picked.

### 4b. Food → wine pairings (priority #2)

**How it works today.** `genPairing` builds dish→wine cards; the wine `pair[]` array renders as "Best with" chips on the Reference card. The wine-pairing deck has a real structural why (`f.why` = "acid cuts fat") — genuinely good and matching WSET's published rules.

**What's wrong.**
- The why is shown but never the graded target (see §3.1) — the lever is never retrieved, so a server who memorises 42 dish→wine pairs is useless on the 43rd dish.
- **No wine→dish recall.** The owner explicitly named both directions ("what wine with my food" AND "what should I drink with the pasta"), but there is no deck, simulator beat, or card that goes wine→dish. Half the stated pairing skill is lookup-only.
- The two beginner-fast rules that make a server look expert on unseen dishes aren't taught as their own units: **(a) match weight/intensity first, (b) pair to the SAUCE/preparation, not the protein.** The same protein flips the answer.
- The Reference pairing surfaces render as flat monochrome text rows, indistinguishable from rote drills.

**The redesign.**
1. **Make the LEVER the graded answer.** At box≥4: "Guest is eating the Five Cheese pizza — what's the move AND why?" and require the produced lever ("acidity cuts the fat"). A server who owns 6 levers pairs anything, including off-menu specials — future-proofing against menu rotation.
2. **Add a wine→dish recall deck** from the existing `pair[]` data ("You're pouring Ca' del Baio Nebbiolo — name a dish that sings with it"), distractors = dishes from structurally-distant wines. Closes the reverse-direction gap the owner named.
3. **Teach and drill the sauce rule.** Build distractors that punish protein-pattern-matching — for a tomato-sauce dish, the tempting-but-wrong foil is a rich oaky white (right protein, wrong sauce), so the rule is *exercised*, not stated.
4. **Bespoke two-up dish ↔ wine card** with the "why" pulled out as a quoted callout, treated as a flagship screen.

### 4c. Food → cocktail pairings (priority #3)

**How it works today.** `genCocktailPairing` builds the why from `ck.say`. The Reference Food card shows "Cocktail:" and "Zero-proof:" lines.

**What's wrong.**
- **The "why" is a description of the drink, not the pairing logic.** Spaghetti Western's `say` is "richer and nuttier, with bourbon, cognac… It does contain nuts" — paired with steak it teaches nothing about *why* (the richness/weight match). When a guest isn't drinking wine — a common, revenue-relevant moment — the server learns the cocktail's name but can't explain the match, which is the part that sounds expert.
- The **zero-proof safety bug** (§3.4) lives in this workflow: a 5.0% beer offered as non-alcoholic.
- No pronunciation on the cocktail/food cards; the Explain beat in the simulator is recognition.

**The redesign.**
1. **Author a one-line structural rationale per food→cocktail link** (weight/acid/bitterness/spice logic, parallel to `f.why`) and use *that* as the deck's why instead of `ck.say`. The `pair`/`category` fields give enough to write these quickly.
2. **Fix and guard the zero-proof field** (remove the beer; add the build-time ABV assertion).
3. **Tie the price/intake question into this flow** so "what's your budget" naturally bridges into the glass→bottle upsell — the way it does on a real floor.

---

## 5. Dashboard & information architecture

**The problem.** Five top-level destinations (Today / Practice / Reference / Wine School / Progress) for a single-user tool, with **two of them — Today and Practice — both claiming the home slot** (Practice *is* the root URL but is the 2nd nav item; Today is 1st but routes to `/today`). The home screen is a vanity menu of ~13 equal-weight tiles with no single next action. Reference's 8 flat filter chips bury the owner's three priorities as peers among Beer and Digestifs. The #1 floor skill lives in *three* unconnected places (a Reference tab, a School lesson, a Practice deck) with no cross-links. There is no global "guest asked for…" search.

**Proposed home screen (`/today`, set as `start_url`):**

```
┌─────────────────────────────────────────────┐
│  Good evening, Adrian        [⌕ guest asked…]│  ← global search, always present
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  ▶  START TONIGHT'S SESSION   12 due     │ │  ← ONE hero CTA, raised elevation,
│  │     ~8 min · auto-built mix              │ │     gold hairline. Auto-picks the mix.
│  └─────────────────────────────────────────┘ │
│                                              │
│  ●○○○○  Shift-ready: 68%  (last check)       │  ← one canonical number, est. badged
│                                              │
│  YOUR 3 FLOOR MOVES                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Sub       │ │ Pair my  │ │ Pair a   │      │  ← the priorities, first-class,
│  │ a wine    │ │ food→wine│ │ cocktail │      │     each → look-up + drill + why
│  └──────────┘ └──────────┘ └──────────┘      │
│                                              │
│  ▸ Run a guest scenario (simulator)          │  ← the differentiator, promoted
│  ▸ More ways to practise ▾                   │  ← 5 mode tiles + deck grid, collapsed
│                                              │
│  Where you stand →  (Progress, folded in)    │
└─────────────────────────────────────────────┘
```

**Nav: cut from five to four** — **Home** (Today), **Practice** (drills + simulator), **Reference** (look-it-up), **Learn** (Wine School). **Fold Progress into Home** as a "Where you stand" section; a solo user checks progress occasionally, it doesn't earn 1/5 of the bar. Ensure exactly one item maps to the launch URL.

**Three IA fixes that matter most:**
1. **One hero CTA** that auto-builds the session; demote the 5 mode tiles + 7-deck grid into a collapsed "More ways to practise."
2. **One global "guest asked for…" search** that resolves "Meiomi" or "lamb" or "Barolo" in one move regardless of which tab it lives in.
3. **Cross-link the three priority surfaces** (Reference Translator card → "Drill this" + "Why it works"; School lesson → "Look it up" + "Practise it") and state the contract once in microcopy: *"Reference = look up on shift · School = learn the why · Practice = build the reflex."*

---

## 6. Visual / brand direction

**The real Bridgette identity (verified against the live site, not invented):** cream `#ffeed6`, orange `#F15825`, Oswald display — these are the venue's actual CSS values, and the app's tokens (`#ffeed7` / `#f15623`) are one and two bytes off. The site loads a **paid Adobe Typekit** body face (kit `nn4eSmQ`); the app uses plain **Arial**. The brand's soul, per FRANK Architecture and Public Eye, is warm, sun-baked, mid-century-modern — 1922 brick, green marble, leather, teak, macramé, Rob Bailey "leisure" illustration, a "restrained sun-baked colour palette," "rec-room-meets-Breakfast-at-Tiffany's." The brand has a "b"-stamped ceramic identity, branded matchboxes, and primary-coloured menu-back artwork.

**The app today is brand-*coloured* but not brand-*feeling*:** a cold dark-navy SaaS shell with consumer emoji, a placeholder "BB" icon, Arial body copy, zero imagery, and one flat elevation. It uses Bridgette's paint on someone else's house.

**How to make it brand-true (a refinement, not a rebuild):**
1. **Tighten the palette to the live bytes:** `--cream:#ffeed6`, `--orange:#f15825`. Two-line, zero-risk.
2. **Replace Arial with a brand-true self-hosted body face** — the single highest-leverage change to make it *read* as Bridgette. Get the Typekit font name from Adrian; if unobtainable, a warm mid-century serif/humanist analog. Keep Oswald for display (already correct). Self-host + precache for offline.
3. **Re-frame the shell warm:** make cream/paper the default canvas (like the printed menus), navy an accent; add a paper-grain card texture and the venue's green (`#3f6b54`, already a token) echoing the marble bar.
4. **Replace every emoji** with the stroked-line icon set already in the nav — fastest, highest visual-quality-per-effort fix; removes the most "cheap/gamified" signal.
5. **Add real brand assets:** the actual Bridgette wordmark/logo SVG (kill the placeholder `icon.svg` — it's what sits on Adrian's home screen after install) and one Rob-Bailey-style illustration on Today/empty states. Ask Adrian for the brand kit.
6. **Add a 2–3 step elevation scale** so each screen has one hero (Today CTA, active flashcard).
7. **Verify before freezing baselines:** gold `#fcb539` and ink `#1e384b` are *probably*-on-brand but were **not** independently confirmed against the live site — eyedrop the real menu PNGs / brand guide first.

---

## 7. Tech-stack verdict

**KEEP the runtime. FIX the data pipeline. RELAX the frozen card-id rule. CHANGE one engine internal.**

**KEEP** SvelteKit + Svelte 5 + adapter-static (SPA, `ssr=false`) + Workbox PWA + localStorage. For a single-user, installed, offline, every-route-interactive app this is genuinely near-best-in-class. The generic "SvelteKit/SPA is bad for SEO/CWV" critiques are *noise* here — the app is JS-required by design, never crawled, served from precache. Migrating to **Next.js** would add a server runtime and ~3× the JS for a flagship feature (RSC) you'd throw away with `ssr=false`. **Astro** is content-first — wrong shape for a stateful app. **Anki** beats you on the scheduler but cannot do your translator, simulator, pronunciation, or pairing UX — which is the actual product. A rewrite throws away a working, fully-tested app (125 Vitest, 13 Playwright, axe-per-route) for, at best, parity. **Do not rewrite.** The polish "ceiling" is a design decision, not a framework limit — Svelte ships transitions/springs and the ecosystem has Framer-Motion-parity options in-place.

**The one engine change worth making — and it is NOT the framework:** swap the fixed-interval Leitner scheduler for **FSRS via `ts-fsrs`** (pure-TS, zero-dep, browser+Node). Benchmarked on 500M+ Anki reviews it needs ~20–30% fewer reviews for the same retention and adapts per-card; Leitner treats every card in a box identically. The swap is *bounded*: extend `CardState` (stability/difficulty/last-review), rewrite `recordResult`/`isDue` behind the existing engine boundary, map Sure/Shaky → FSRS grades, ship a one-time `bb_progress_v1 → v2` migration. Card-ids, routes, and UI stay untouched. This is the highest learning-ROI change available and does not require leaving the stack. *(Judgment call: I rank this **below** the production/why-beat fix — a better schedule of the wrong-rung retrieval still trains the wrong skill. Do the frame fix first, then FSRS.)*

**FIX the data layer** (the part a fresh pair of eyes would not have built this way): stop eval-ing the `window.BB.data` global — make the source a typed ESM/TS module; unify the two source formats (`data.js` global + `data-fullmenu.json`) into one validated schema; wire generation + a drift `--check` into a `prebuild` hook so the committed generated artifacts can't silently diverge. **Do NOT** adopt SQLite-in-browser, Turso, or a CMS for ~150 records — static JSON precaches for free. Fix authoring friction at the *source* (split per-category files + schema validation), not the storage engine.

**RELAX the frozen card-id contract** from a hard CI gate to a warning: author stable short ids per record instead of slugging human-readable text, so the owner's top-priority content work isn't hostage to an id-migration ritual. Keep only the localStorage key + export/import path frozen. **Invest in** a one-tap "back up your progress" prompt every N sessions (localStorage is the single largest evolution ceiling), and keep all persistence behind the `progressStore` facade so a future IndexedDB/Cloudflare-KV swap is a one-file change.

---

## 8. Recommended roadmap

Ordered quick-wins → bigger bets, so the first day of work ships visible value.

### Phase 0 — Quick wins & safety (hours to ~1 day)
- **Fix the zero-proof beer bug** + add the build-time ABV assertion. *(Safety — do this first.)*
- **Set `start_url` to `/today`** (or redirect `/` → `/today`). One line; fixes the single worst UX moment.
- **Surface `familiar` + respell/speak button** on the Reference Translator card. Dead data → live; pronunciation pillar restored on the #1 surface.
- **Tighten palette to live bytes** (`#ffeed6` / `#f15825`); **swap emoji for the nav icon set.** Two highest visual-quality-per-effort changes.
- Remove the pairing-matrix `slice(0,40)` truncation (dropping 2 real dishes); retag the placeholder row.

### Phase 1 — The frame fix (the heart; ~1–2 weeks)
- **Finish the generate-the-why beat:** elicit + self-rate the spoken reason at box≥4, keep `card.why` visible at box 5, fire the nudge in scenario mode.
- **Replace the simulator's Explain beat** with say-it-then-self-rate; make Ask/Explain distractors structurally adjacent, not keyword giveaways.
- **Add the substitution turn type to the simulator** (priority #1 finally rehearsed).
- **Make the lever the graded answer** in pairing + translator; **add the wine→dish recall deck**; give food→cocktail a real structural why.
- **Escalate upsell to a typeable bottle name** (production, not MC-forever).

### Phase 2 — On-ramp, brand body, IA (~1–2 weeks)
- **"Floor Basics" starter track** (~30–40 high-yield cards drawn first) + re-scope the shift-ready estimate to that subset.
- **Rebuild the home screen** around the one hero CTA + three floor-move cards; promote the simulator; cut nav to four and fold in Progress.
- **Add global "guest asked for…" search** and cross-link the three priority surfaces.
- **Swap Arial for a brand-true body font;** add elevation scale, paper texture, real wordmark, one illustration; re-frame the canvas warm.

### Phase 3 — Bigger bets (do after the frame is proven)
- **FSRS via `ts-fsrs`** behind the engine boundary (~20–30% fewer reviews) with a v1→v2 migration.
- **Promote the data source to a typed ESM module;** unify the two formats; wire the prebuild generation + drift check; relax the card-id contract.
- **Block-then-interleave** new decks; **add the voice/audio output channel** (Web Speech) for pronunciation self-check and the produced-answer beats.
- **One-tap progress backup** prompt; re-anchor the readiness % to production/explain performance and label it in capability terms ("confident on 6 of 9 common asks").

**Headline:** *Fix the safety bug and the launch target this week; spend the next month turning recognition into production on the three priority skills; then invest in FSRS, the data pipeline, and brand depth. Do not rewrite the stack.*

---

*Note on team disagreement, resolved: the learning-science and external-research angles both push for voice/AI-graded free-text; the tech angle flags localStorage and currency risk. My call — production grading can ship as a local self-rate/keyword grader first (no LLM dependency, stays offline), and FSRS is the only stack change worth making but ranks behind the frame fix. The brand angle and visual angle agree the palette is right and the problem is everything around it; I've treated the palette as locked and the shell/imagery/type as the work.*
