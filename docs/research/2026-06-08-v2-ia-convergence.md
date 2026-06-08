# V2 Information Architecture — Convergence Check

**Date:** 2026-06-08
**Author:** Lead architect (convergence study)
**Question on the table (owner's fork):** Should SUBSTITUTIONS and PAIRINGS each get a dedicated top-level tab? How many tabs total? Where does each piece of content live so nothing is duplicated?

**Method:** Three independent research layers — (1) primary IA / learning-science literature, (2) a 12-app competitor/industry survey, (3) real server/sommelier behavior — plus a fourth content-architecture layer that read the actual `data.js`. This document checks whether the layers converge, explains divergences, and issues a decisive call grounded in verified server behavior.

**Ground truth verified in-repo (not inferred):**
- `app/src/routes/reference/+page.svelte` ships exactly **8 flat filter chips**: `Wine, Bottles, Food, Cocktails, Beer, Digestifs, Translator, Pairing matrix`. The Translator (priority #1 skill) is one peer chip sitting beside Beer and Digestifs — an information-scent failure, confirmed.
- `app/src/lib/data/data.js` `wines[].family` defines exactly **5 structure-families**: Bubbles & Rosé (4), Bright & Crisp Whites (4), Round Whites (3), Light Reds (2), Structured Reds (4) = 17 by-the-glass pours.
- Translator rows carry `ask`, `aliases[]`, `bestGlass`, `bottleOptions[]`; the join to `wines[]` (carrying `structure{}`, `pronunciation{respell,say}`, `family`) is present in data but **not rendered** on the translator surface. The content exists; the surface omits the join.

---

## 1. Convergence analysis — do the layers agree?

### 1a. On "should Substitutions + Pairings be FIRST-CLASS?"

**FULL CONVERGENCE — yes, the JOB is first-class.** All three layers agree the owner's instinct is correct in spirit: these are high-frequency, high-value, owner-declared #1 tasks and deserve premier information scent, not burial as one of eight equal filter chips.

- Layer 1 (science): NN/G says prioritize the most-used tasks as premier destinations; 86% of modern IAs are task-organized. A #1 floor skill given the same weight as a beer list is a scent failure.
- Layer 2 (industry): right in spirit — promote them, but inside existing slots (Home cards + the top result of a global search).
- Layer 3 (behavior): the "guest asked for X we don't pour" pivot is a distinct, frequent, reactive, single-trigger act; servers are literally trained to script it "in order of popularity."

### 1b. On "should they each be a DEDICATED TOP-LEVEL TAB?"

**CONVERGENCE on the answer (NO new tab per skill), DIVERGENCE on the mechanism for Substitutions.**

| | Substitutions tab? | Pairings tab? | Tab count |
|---|---|---|---|
| **Layer 1 — Science** | First-class, but as the lead section of ONE "Floor Moves" hub, not a standalone tab | First-class, same hub, NOT its own tab | **5** (Today / Floor Moves / Practice / Learn / Reference) |
| **Layer 2 — Industry** | NO — top result of global search in Reference + Home card; zero of 12 apps ship one | NO (strongest evidence) — Sommo & SommOne both embed pairing per-item | **4** (Today / Learn / Practice / Reference) |
| **Layer 3 — Behavior** | YES first-class destination, but reached via global "Guest asked for…" search, not a 5th nav slot | NO — servers reach pairings through the dish/wine in hand | **4** (Home / Practice / Reference / Learn) |

**Where they agree (high-confidence convergence):**
1. **No dedicated Pairings tab.** All three layers say no, and Layer 2's evidence is the strongest single finding in the study: the two closest functional twins — Sommo (wine+WSET+AI, the consumer twin) and SommOne Server (a restaurant *staff* bidirectional pairing tool, the on-the-nose twin) — both *deliberately* embed pairing per-item rather than siloing it. Pairing is entered from an item already in hand. **Verdict: no Pairings tab. Unanimous.**
2. **No content duplication; single source of truth.** All layers name the existing 3-copy fragmentation (Reference Translator chip + School lesson + Practice deck) as the real disease. Layer 1 grounds it in single-source-of-truth research (duplicated copies drift, erode trust — fatal for a guest-safety tool). Layer 4 proves the fix is a *join the engine omits*, not new authoring. **Verdict: author once, surface many. Unanimous.**
3. **A global "guest asked for…" search is load-bearing** — named by all three as the recognition-over-recall entry point that reaches the single source from anywhere. It is a hard dependency of the fold-don't-fork bet in every layer.
4. **Collapse the ~13-tile root** behind one hero CTA (Hick's Law / paralysis screen). Unanimous.
5. **Keep Learn and Practice as DISTINCT destinations.** Layers 1 and 2 both flag the Duolingo Practice-Hub-vs-Learn-path split as the structurally important fork — far more so than any Substitutions tab.

**Where they diverge, and WHY:**
- **Tab count: 5 (science) vs 4 (industry + behavior).** The split is over whether the substitution/pairing job earns its own *named destination* ("Floor Moves") or folds into Reference's search.
  - *Science says 5* because NN/G information-scent argues a guest-facing labeled destination ("Floor Moves / a guest just spoke — what's my move?") beats hunting an unlabeled chip; one strong task category beats several weak ones.
  - *Industry says 4* because **zero of 12 apps** invent a destination for this — the universal pattern for "what do I recommend?" is a search/lookup affordance (Anki Browse, Vivino Scan, SevenFifty search), and >5 tabs shrinks touch targets on a PWA. But this is explicitly *convention*, not proof-for-n=1; the survey itself flags that an unconventional surface could still win for a single power user.
  - *Behavior splits the difference*: substitution **deserves** a first-class, named, instantly-reachable surface (unique trigger, unique motion, #1 fear) **but the real access pattern is "type the grape,"** so the highest-fidelity home is the global search bar landing on a dedicated Substitution view — not a whole bottom-nav slot.

- **Substitutions: "first-class destination" (science + behavior) vs "search result" (industry).** This is a *vocabulary* divergence more than a real one. All three want substitutions to be (a) named, (b) the single canonical surface, (c) reached primarily by typing the grape. They disagree only on whether that surface is labeled as its own nav peer.

### 1c. The reasoned call — convergence of science + real-behavior beats industry consensus alone

The brief's tie-breaker rule decides it: **where industry consensus (4 tabs, fold substitutions invisibly into search) diverges from the convergence of science + real-behavior (substitutions deserves a *named, first-class* surface), the latter wins.**

Industry's "no destination, just a search result" is the weakest-grounded position: it rests on *absence of precedent* (substitutions is a genuine product invention — n=0 apps), and the survey openly concedes precedent answers "what is conventional," not "what is optimal for THIS user." Adrian is a single power-user whose **#1 priority and most-feared freeze** is exactly this moment. Science (information scent: name the guest's words) and behavior (a distinct, scripted, high-frequency single-trigger act) *both* say give it a real, named home.

**But** science *also* warns (correctly, and industry agrees) that a *separate tab each* for Substitutions AND Pairings would push to 6–7 tabs, trigger a mobile "More" overflow that buries a priority skill, and re-fragment one guest-facing mental model into parallel silos. So we do **not** give each its own tab.

**The synthesis — promote the JOB to a single first-class destination, keep the DATA single-sourced:** one task-first destination, **"On the Floor"**, that is the named home for the guest-facing moment (substitution + both pairing directions + all three drink types), backed by one canonical data layer, reached primarily by the persistent global "Guest asked for…" search, and cross-linked to Learn (the why) and Practice (the reps). This is Layer 1's "Floor Moves" hub, satisfying Layer 3's "substitution deserves a named surface," while honoring Layer 2's "don't invent two tabs / don't duplicate / search is load-bearing." **5 tabs, not 4 and not 6–7.** The 5th slot is spent on the owner's actual priorities, not on Progress (which folds into Today).

---

## 2. Decisive recommended navigation

**Five top-level destinations**, identical on desktop sidebar and mobile tab bar (a PWA must not exceed ~5 on the bar; 5 is the ceiling here, not a target we pad to):

| # | Destination | One-line JOB | Single home for… |
|---|---|---|---|
| 1 | **Today** | "What do I do right now?" — one hero next-action + shift-ready ring + the 3 floor-move quick-cards + the persistent global "Guest asked for…" search. **Progress folds in here.** | Home/dashboard, streak/readiness, progress stats, the global search entry point |
| 2 | **On the Floor** | "A guest just spoke — what's my move?" — the first-class TASK hub: Substitution (lead section) + Pairing (both directions, wine/cocktail/zero-proof). A VIEW over the single canonical data layer. | The substitution surface, the pairing surface (as *views*, see §3) |
| 3 | **Practice** | "Build the reflex." — Smart Review (SRS), Guest Simulator (with a substitution turn + a pairing-lever beat), Readiness, My Mistakes. | All drilling / retrieval / simulation |
| 4 | **Learn** | "Why does it work?" — the 10-module mastery-gated Wine School (the structured spine): substitution-by-style method + the 6 pairing levers as their own units. | All structured teaching / the "why" |
| 5 | **Reference** | "Look up the full menu." — every wine, bottle, beer, digestif, food, cocktail. Pure lookup. | The exhaustive menu catalog |

**Microcopy contract (state once, per NN/G information-scent — without it the labels blur):**
> **On the Floor** = do it now · **Learn** = why it works · **Practice** = build the reflex · **Reference** = the full menu · **Today** = your next step.

### No-duplication map (single home + cross-links)

The **canonical data layer** is `data.js` (`translator[]` joined to `wines[]`, and `foods[]`/`cocktails[].pair`/`wines[].pair`). Every surface is a **VIEW** over it — no surface re-authors content.

| Content | SINGLE HOME (authored once) | Surfaced as a cross-link in… |
|---|---|---|
| Substitution rows (ask→pour→bridge→structure→pronunciation→upsell) | `data.js` translator↔wines join | **On the Floor** renders it; Today's search lands on it; Learn lesson links "drill this / look it up"; Practice deck links "see the why" |
| Pairing rows (dish↔wine↔cocktail↔zero + the lever) | `data.js` `foods[]` + inverted `wines[].pair`/`cocktails[].pair` | **On the Floor** renders it; Learn "6 levers" lesson cross-links; Practice pairing beat cross-links |
| Structured "why" lessons | **Learn** (lessons of record) | On the Floor "learn the why" buttons link in |
| Full menu catalog | **Reference** | On the Floor "see full bottle list" links in for the upsell ladder |
| Progress / streak / readiness | **Today** | Practice surfaces readiness inline but Today owns the stat |

**Critical guardrail (Layer 1's top risk):** "On the Floor" must be a *view* over the one data layer — NOT a 4th copy. If it re-authors the translator/pairing content, the IA fix makes the duplication worse. Author once; the lesson and the deck cross-link *to* it.

---

## 3. How the Substitution and Pairing surfaces are structured (Layer 4 + real varietals)

### 3a. Substitution surface — grouped by STRUCTURE-FAMILY, not alphabetically

Reuse the 5 families already in `wines[].family` (verified: Bubbles & Rosé, Bright & Crisp Whites, Round Whites, Light Reds, Structured Reds), colour-ordered lightest→boldest. Within each lane, list the guest-asks that resolve to that pour — so the cross-grape logic is **visible** (Cab, Merlot, Bordeaux, Meiomi and "sweet red" all land on St. John Claret *because* they share a body×tannin box). This is what lets Adrian field a 43rd grape that is on no list — the real test of priority #1. By-structure for **learning**; a name/alias search box on top for **speed** (so "Meiomi", "Napa Cab", "Barolo" all resolve). Same surface, two reading orders.

**Canonical entry shape (rendered identically everywhere):**
1. Guest ask + aliases.
2. **The pour** (the by-the-glass wine) as the headline.
3. **The bridge line as the hero** — the one sentence Adrian *says* ("Same grape, lighter and brighter" / "Claret is Cab softened with Merlot"). The produced WHY is the graded skill, not the name.
4. A body×acidity(+tannin for reds) **StructureMeter** (reuse the existing component) — match shown by structure, not asserted by name.
5. **Pronunciation respell + speak button on the pour** — currently rendered nowhere; the #1 place it is needed ("Weissburgunder", "Hiedler Löss"). Available via the verified 30/30 `bestGlass`→`wines` join.
6. The **bottle upsell ladder** (`bottleOptions`) for "I want the real grape."
7. An **honest-pivot flag** for no-true-match rows (Moscato, Meiomi, Zinfandel, Viognier): "we don't pour that — here's the honest bridge."

### 3b. Pairing surface — ONE lever system, both directions, all three drinks

The research is unanimous (WSET, deBary, Food Republic): wine, cocktail AND zero-proof pairing run on the **same 6 levers** (weight/intensity · acid-cuts-fat · tannin-binds-protein · sweet-tames-heat · salt-lifts-fruit · bitterness-as-structure). The three priority pairing skills are **one skill with three outputs** → one lever-driven surface, not three.

Per dish: show its dominant structural cue (the existing `flavor` field) → the THREE picks side-by-side (wine | cocktail | zero-proof, all already in `foods[]`) → **one shared lever-line that justifies all three** ("fried fat wants acid+bubbles" explains the Brut, the citrus cocktail, AND the Peroni 0.0). Today the food "why" is wine-only and the cocktail/zero pick is unjustified — author one lever-line per row covering all three. **Both directions:** dish→drink from `foods[]`; drink→dish by inverting `wines[].pair`/`cocktails[].pair` (the owner's explicitly-named "what do I eat with this Nebbiolo"). Add a "by-lever" view ("show me every acid-cuts-fat dish") so the beginner drills the RULE. Distractors must punish pairing-to-the-protein instead of the sauce.

**Safety:** fix the 5.0% beer in French Fries' zero field and add a build-time ABV assertion so the zero-proof column can never recommend alcohol to a non-drinking guest.

### 3c. How the surfaces connect to Course / Practice / lookup

- **On the Floor → Learn (learn it):** each substitution lane and each lever links to its Learn lesson ("why Claret answers a Cab ask"; "why acid cuts fat").
- **On the Floor → Practice (drill it):** each surface offers "drill this" → the matching Practice deck (substitution turn; pairing-lever beat). The graded target is the **bridge line / the lever**, never the name.
- **On the Floor / Today search → Reference (look it up):** the upsell ladder links to the full bottle list; Reference stays the exhaustive catalog and never owns the substitution/pairing *logic*.

### 3d. Top ~10 varietals for the substitution surface ("core shift kit")

From real ordering data (US sales rank + Canadian BTG backbone, Layer 3), curated from the 30 translator rows already in data — curation, not authoring:

1. **Cabernet Sauvignon** — #1 ask; pour: St. John Claret (softer Merlot-Cab blend).
2. **Chardonnay** — #2; split plain vs oaky/buttery; pour: Bodega Cerrón Remordimiento Blanco.
3. **Pinot Grigio / Pinot Gris** — easy-white default; pour: Wagner-Stempel Weissburgunder.
4. **Pinot Noir** — soft-red default; pour: Deinhard Deidesheim (German Pinot).
5. **Sauvignon Blanc** — crisp-white benchmark; pour: Hiedler Löss Grüner.
6. **Merlot** — softer steak red; folds onto the Claret.
7. **Malbec** — value steak red; pour: Bodega Cerrón Remordimiento Tinto.
8. **Riesling** — off-dry problem-solver; pour: Darting Dürkheimer Fronhof (doubles as the Moscato/Gewürz answer).
9. **Moscato / sweet white** — highest-frequency ask with NO true match; honest pivot to off-dry Riesling (load-bearing honest-pivot row).
10. **Prosecco / Champagne / Cava** — the bubbles lane; pour: Blue Mountain Brut.

*Next-tier (surface below the core 10, still gated-in):* Rosé (Ameztoi Rubentis / Leitz), Chianti/Sangiovese (Bindi Sergardi La Boncia), Shiraz/Syrah (shares Cerrón Tinto), sweet "plush" red (Meiomi/Apothic → honest pivot to Claret), Bordeaux/red blend (→ Claret).

---

## 4. Confidence and tentative items

**Overall confidence: HIGH** on the structural calls, because the two highest-confidence layers (science, industry) and the medium-confidence behavior layer converge on the load-bearing decisions:
- **No dedicated Pairings tab** — unanimous, highest confidence in the study.
- **No content duplication; single canonical data layer with cross-links** — unanimous; Layer 4 proves it is a join, not authoring. Highest practical confidence.
- **Global "guest asked for…" search is a hard dependency** — unanimous. If descoped, the fold-don't-fork bet fails and the verdict regresses; this is the #1 build risk, not an IA risk.
- **Substitution-by-structure-family grouping** — high; reuses verified in-data taxonomy (zero new data).
- **One-lever pairing surface, both directions, three drinks** — high; research unanimous, data present.

**Tentative — pending the owner's preference (do not freeze):**
1. **The 5th-tab label and whether substitutions earns a *named* destination at all.** This is the one genuine science-vs-industry divergence. The call is **5 tabs with "On the Floor"** (science + behavior beat industry-convention). But if Adrian, after seeing it, prefers a tighter 4-tab bar (Today/Learn/Practice/Reference) with substitutions living as the #1 result of the global search inside Reference + a Today hero card, **that is the supported fallback** — it costs only the named scent, not the single-source fix. **Card-sort / tree-test "On the Floor" vs "Practice" with Adrian before locking** (NN/G: few universally true rules; test with the target user). Validate it does not read as a synonym for Practice.
2. **Exact top-10 substitution ordering** — triangulated from consumer-preference + BTG-backbone consensus, NOT Bridgette's own pour counts (not public). Confirm against Bridgette's POS/by-the-glass data before freezing the roster.
3. **Folding Progress into Today** — supported by science (a solo user checks progress occasionally; it does not earn 1/5 of the bar) but only weakly by industry. If Adrian wants an at-a-glance Progress destination, keeping it as the 5th tab and folding On-the-Floor's *substitution* into the global search (Layer-3 style) is the alternate 5-tab shape. Owner's call.

**Lower-confidence inputs (flagged for honesty):** Layer 3 is medium-confidence (Reddit was un-crawlable; behavior leans on industry/somm blogs, not raw server chatter). Layer 2's exact live tab labels for a couple of apps (Vivino, Wine Companion) were inferred from feature pages, not a hands-on teardown — directionally reliable (all point the same way) but not pixel-verified.
