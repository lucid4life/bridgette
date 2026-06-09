# Bridgette Training — v2 Redesign Build-out Status (2026-06-08)

**Branch:** `v2-app` (NOT merged, NOT deployed — Adrian deploys). **All gates green throughout:**
191→195 Vitest (incl. the frozen card-id snapshot) · svelte-check 0/0 · 14 Playwright (axe-WCAG-AA per route / smoke / offline) · production build · v1 `python tests/check_training.py` PASS.
**Frozen contract intact:** card-id slugs are additive-only (snapshot 279 → 295, only net-new ids); `bb_progress_v1` untouched; a new `bb_course_v1` key holds course state.

This was the redesign you asked for: a hypercritical consultant review + deep research → an approved spec → an autonomous build. Design docs: the [spec](superpowers/specs/2026-06-08-v2-course-floor-redesign-design.md), the [consultant review](research/2026-06-07-v2-fresh-eyes-consultant-review.md), the [content sweep](research/2026-06-08-v2-content-correctness-sweep.md), and the [IA convergence study](research/2026-06-08-v2-ia-convergence.md).

---

## What shipped

### Phase 0 — safety & data correctness
- 🔴 **The guest-safety fix:** removed a 5.0% beer from French Fries' "zero-proof" field, **+ a build-time guard** (`app/src/lib/data/zero-proof.test.ts`) so an alcoholic drink can never re-enter a non-alcoholic field.
- Every server-facing data error from the sweep corrected (Tawny Port dangling ref, Fattoria Moretto is **off-dry**, St. John Claret is **Cab-led**, the false Wagyu "light-tannin" pairing, Senat/Raventós blends, cider/sour ABVs…).
- PWA now **opens on the Today dashboard** (`start_url`); palette aligned to Bridgette's **exact brand bytes** (`#ffeed6` / `#f15825`).
- Reference Translator card now shows the once-dead **`familiar` pivot copy** + pronunciation; pairing matrix restored to **42 dishes**; kinder early-state copy on Today.

### The redesign (Increments 1–4)
- **5-tab information architecture:** **Today · On the Floor · Practice · Learn · Reference** (Progress folded into Today; `/school` renamed `/learn`). A clear mental model: *do it now · build the reflex · why it works · the full menu · your next step.*
- **"On the Floor" hub** — your #1 ask, first-class: **substitutions grouped by structure-family** (ask → pour + 🔊 → the bridge line you say → structure meters → point-of-difference → "want the real grape?" upsell → honest-pivot flag), and **pairings on one lever system, both directions** (dish→drink 3-up with the shared lever; drink→dish). All a **single view over one data source** — no more authoring the same thing three times.
- **Global "Guest asked for…" search** — type a grape, alias, dish, or wine on Today and land on the exact answer (verified: "malbec" → the Malbec substitution).
- **The 10-module course** (`/learn`) — foundations-first, **mastery-gated with a "jump ahead" escape hatch**, the **read → quick-check → complete** loop, grouped into 4 tracks, seeding into Practice. Built on the verified lessons + the families/style-map/region-map + the deductive grid.
- **The production self-rate mechanic** — for all four reason decks (translator, food→wine, **food→cocktail**, upselling), past the beginner boxes you **say the pour + the one reason out loud, reveal, then self-rate "Nailed it / Close / Missed."** The why-beat that used to vanish at box 5 is fixed; the redundant MC self-grade is gone.
- **Reverse pairing:** a new **Wine → Dish** drill deck ("you're pouring this — what do you feed it?").
- **Guest Simulator** now rehearses the **substitution conversation** (a guest names a grape we don't pour), and its match beat writes the translator card toward your mastery.
- **Visual polish:** a warm self-hosted body font (**Hanken Grotesk**), an **elevation scale** for depth, and **clean line icons** replacing the consumer emoji on Practice.

### Completeness pass (same session — finishing every in-scope spec item)
After the four increments, a final pass closed the remaining in-scope spec items: the **Today smart hero** (auto-picks "do your review first" vs "continue your course"); the **Guest Simulator's Explain beat** is now say-it-then-self-rate (not multiple choice); a **"By lever" view** on the On the Floor pairings (drill the rule, not 42 pairs); the **food→cocktail drill "why"** is now the structural lever, not the cocktail's flavor blurb; and the **all-caps was softened** to natural-case headings (labels/nav/eyebrows keep their caps) with the ▶ glyph swapped for an icon. All green (195 Vitest / 14 Playwright / svelte-check 0 / build / v1 PASS).

---

## What remains — your side (no more code from me)
1. **Test on your phone** (`cd app && npm run build && npm run preview`) — the installable/offline PWA opens on Today; walk On the Floor, the course, and a produce-mode card.
2. **Confirm the open-questions with your team/somm** ([`docs/v2-open-questions.md`](v2-open-questions.md)): which Fattoria Moretto cuvée is poured, the Wagyu Nebbiolo→Pinot swap, Michelob ABV, Fallentimber placement, Bindi Classico-vs-DOCG.
3. **Run Playwright on a fixed CI image** for the visual-regression baselines before deploy (the e2e + axe ran green here every step; baselines were deferred by waiver).
4. **Then deploy** to Cloudflare Pages.

### Pronunciation overhaul (2026-06-08, per Adrian's request)
All 17 spoken pronunciations were **regenerated in one consistent English voice** (Sarah) via ElevenLabs, switching from the multilingual model (which applied native German/Italian/Spanish accents inconsistently) to the **English-only `eleven_turbo_v2`** fed the on-screen respellings — so every name is now read in the same English voice. v1 embedded audio + manifest updated, v1 + v2 both green. The swipe-to-grade path on produce cards now routes through the Nailed/Missed self-rate. **Then extended to the whole menu:** generated clips for all **38 bottles + 25 digestifs** in the same Sarah / English-only voice and added 🔊 buttons to those Reference cards — so **every one of the 80 names** a server might say is now audible and consistent (verified: bottle/digestif clips serve as `audio/mpeg` and are SW-precached, 142 precache entries).

## NOT built — and why (deliberate, not overlooked)
These were on the consultant's wish-list but are **intentionally not built**, because forcing them would *reduce* quality or contradict a decision:
- **FSRS scheduler swap.** This contradicts an *original locked decision*: "Leitner validated over SM-2/FSRS for a small deck — consistency matters more than the algorithm." For ~295 cards studied over weeks, Leitner is the right call; FSRS's ~20–30% efficiency edge matters for decks of thousands. Doing it would rewrite the working scheduler + tests for marginal benefit. **Recommend leaving Leitner.**
- **Data-pipeline rewrite** (typed ESM source, dropping the eval). Maintainability/developer-ergonomics only — *zero* user-facing value — and the pipeline has generated correctly all session. A future dev-hygiene task, not product completion; rewriting risks breaking what works.
- **Hard course→SRS card-gating.** Conflicts with the "jump ahead / not forced" course you chose, and would risk empty study sessions for a new user. The soft "drill it now" seeding is the better UX.

## Genuinely needs YOU (can't be done without your input/assets)
- The deeper **brand pass**: the real logo/wordmark SVG, the paid Adobe Typekit face, a Rob-Bailey-style illustration. (I used a free brand-true font, the *exact* live palette, and clean icons; the rest is your files.)
- **Visual-regression baselines** (false-fail off a fixed CI image), **real-device QA**, the **somm confirmations** (`docs/v2-open-questions.md`), and the **deploy**.

**Bottom line:** everything from the original prompt, the plan's in-scope work, the pronunciation request, and every in-scope refinement is complete and green on `v2-app`. What's left is either deliberately-not (with the reasons above) or genuinely yours. The app is materially better and safe to ship.
