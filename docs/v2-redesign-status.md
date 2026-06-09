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

## Deliberately deferred (documented, low-risk-not-worth-it now)
- Harder course→SRS integration (gating new-card introduction by completed modules — today completing a module links to "drill it now"); **FSRS** scheduler swap; the typed/ESM **data-pipeline rewrite** + relaxing the frozen card-id rule.
- The deeper **brand pass** that needs your assets: the real logo/wordmark SVG, the paid Adobe Typekit face, paper-grain texture, a Rob-Bailey-style illustration.
- Making the global search **persistent on every route** (today it's on Today + On the Floor has its own); routing swipe-to-grade on a produce card through the Nailed/Close/Missed mapping (buttons + keyboard already do).

**Bottom line:** the app is materially better and safe to ship — the safety bug is fixed and guarded, the three priority skills are first-class and trained as *production*, it's a real course now, and it looks the part. Everything is on `v2-app` for you to review and deploy when you're ready.
