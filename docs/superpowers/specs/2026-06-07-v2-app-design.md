# Bridgette Training v2 — App Design Spec

**Date:** 2026-06-07
**For:** Adrian Beeksma
**Basis:** the finished v1 dashboard + the [agent-team findings](../../research/2026-06-07-v2-agent-team-findings.md) + the approved [app-shell mockup](../../v2-mockup/bridgette-app-prototype.html).

---

## 1. Goal
Turn the finished v1 study dashboard into a **responsive, installable PWA** — a genuinely interactive, multi-screen learning *app* (not a long scroll) that makes a beginner server **fluent and confident** on the Bridgette Bar Calgary list: the wines, the substitution translator, food/wine pairings (+the why), pronunciation, and — the v2 leap — **practising the real guest interaction**, not just isolated facts. Works on phone/tablet/laptop, installable, offline.

## 2. Relationship to v1
v1 stays as-is. v2 **reuses the brain, rebuilds the shell**: the pure, already-unit-tested logic (Leitner engine, deck generators, grading, mastery, migration in `training.js`; `deduce` in `wineschool.js`) ports to ES modules nearly verbatim; the Calgary content (`data.js`), the 17 pronunciation clips, and the v1 contrast/a11y fixes carry forward. The imperative DOM layer is thrown away and rebuilt as Svelte components.

## 3. Scope
**In v2 (approved):**
- The **SvelteKit + PWA** rebuild with a responsive app shell + real per-screen routing.
- **The core loop** (answer → instant feedback + why → session progress → animated end-of-session summary).
- **Guest-Interaction Simulator** (Ask→Match→Explain→Confirm + objections) as a first-class Practice mode.
- **Reasoning/mental-model layer**: wine "families" buckets, climate axis, a body×acidity **style map**, an SVG **region map**, and the deductive grid promoted to a daily **"Mystery Pour"** card.
- **Confidence tap** ("Sure/Shaky") → hypercorrection handling + honest "shift-ready %".
- **Forgiving streak**: weekly-goal option + silent streak-freeze.
- **Dual-coding visuals**: graphic structure meters, the two maps.
- **Action-first onboarding** + **Practice as the default surface**.
- **All accuracy fixes** to the data (see §12).

**Deferred to fast-follow (not v2 core):** the deep sommelier content build — **service ritual** (temperature/glass/decant/pour), **glass→bottle upsell economics module**, a dedicated **Safety/allergy drilling deck**, producer/exclusive notes, tasting-vocabulary builder. *Recommendation flagged: the Safety deck is high-stakes — strong candidate for fast-follow #1.* Safety **flags remain visible in Reference** in v2, plus a hard **"always confirm allergens with the kitchen, never guess"** rule (cheap, safety-critical, included in v2).

**Out of scope:** cross-device sync/accounts (architect storage sync-ready; ship per-device), native desktop/mobile packaging (PWA install covers it; Tauri/Capacitor later if ever).

## 4. Architecture
- **Stack:** SvelteKit (`adapter-static`, SPA via `fallback: index.html` + `export const ssr=false`), Svelte 5 runes, Vite, **`@vite-pwa/sveltekit`** with `registerType: 'prompt'` (never auto-reload mid-session). Deploy: **Cloudflare Pages** (existing `wrangler`).
- **Reuse the pure engine as ESM:** move `training.js`/`wineschool.js` pure halves into `src/lib/engine/*` (strip IIFE/`window.BB`, add `export`); **rewrite the DOM half** as components. **Preserve the card-`id` slug scheme and the `bb_progress_v1` / `bb_calgary_*` localStorage keys byte-for-byte** (changing them silently wipes progress). Reuse `migrateProgress` as the load path.
- **State:** runes-in-`.svelte.ts` modules (`progress.svelte.ts`, `session.svelte.ts`): `$state` holds progress, `$derived` for mastery/streak/weak-list, one `save()` (swappable later for sync). Engine stays pure; the store is a thin reactive wrapper.
- **Data:** `data.js` → typed ESM export + TS interfaces (`Wine`/`Food`/`Translator`/`Lesson`/`Card`) from v1 spec §6 + the v2 additions (§12). Add `schemaVersion`.
- **Audio:** **do NOT port the 664KB base64 `audio.js`.** Ship the 17 real MP3s as `static/audio/<wineId>.mp3`, SW-cached (CacheFirst), lazy-loaded, with the MP3 → Web Speech (`utterance.lang`) → always-visible respelling fallback chain preserved (keep the `audio_manifest.json` fallback list + respelling fixes).

## 5. Information architecture (5 surfaces; shell = sidebar→rail→tab-bar)
- **Practice (default landing for returning users)** — Smart Review, Focus a deck, the **Guest Simulator**, Readiness Check; the core loop lives here.
- **Today (cockpit)** — only live/actionable content: one primary CTA, weakest-thing-to-fix, the lesson that unblocks the most cards, a forgiving streak view. First-run users get the **action-first onboarding** here (one win in ~30s) before any numbers.
- **Wine School** — the 7 lessons (each: short body + worked example + quick check) + the deductive-grid tool + the new families/geography lessons.
- **Reference** — the lookup library, filtered by chips (Wine/Food/Cocktails/Translator/Matrix), now with **multi-entry search** (by grape/style/food/region), graphic structure meters, the readable matrix (mobile = stacked dish cards), speak buttons (≥44px, playing state).
- **Progress** — deck + per-tag mastery rings (animated), weak list, forgiving streak, Export/Import.

## 6. The core loop (the centerpiece — build this first)
Card shown → answer (MC / typed / scenario by box) → **instant feedback**: correct = green confirm + the *why* revealed; wrong = calm amber + the correct answer + the why (never a red "WRONG") → session **progress bar** advances → at the end, a **summary** screen: what improved, what's weak, mastery rings **animate up**, streak ticks, one-tap "drill weak ones." Microinteractions ≤250ms, `transform`/`opacity` only, full `prefers-reduced-motion` branch (state conveyed by text+icon, never motion/color alone). Mobile: tap-to-flip + swipe-to-grade; laptop: Space/1–4/Enter retained.

## 7. Guest-Interaction Simulator (the v2 differentiator)
A role-play mode (first-class tile in Practice, available from day one). A turn: a generated guest line (context: party size, dish ordered, vibe) → Adrian picks a lane/wine, gives **one structural reason**, then handles an injected **objection/curveball** (is it sweet? / we loved a Napa Cab / something like Meiomi / a white with steak / budget cue / non-drinker). Scores each beat (asked first? one reason not three? confirmed the bottle upgrade?). Box-driven difficulty (box 1 = guest names the grape; box 5 = vague + objection + sweetness/allergy confirm). **Data need:** add `objections[]` to wines/translator rows; reuse `say`/`pair`/`avoid`/`upgrade`/`phrase`/`why`.

## 8. Reasoning / mental-model layer
- **Wine families** — group the 17 wines into ~5 steerable buckets by existing `structure{}` (e.g. Bright&Crisp whites / Round whites / Light reds / Structured reds / Bubbles&Rosé). Backs the translator.
- **Climate axis + region map** — a one-word `climate` (cool/moderate/warm) per wine that *explains* its structure; a simple SVG Europe/BC map highlighting origins.
- **Style map** — a body×acidity 2-axis plot with all wines as dots (spatial memory).
- **"Mystery Pour"** — the deductive grid as a generated retrieval card (structure fingerprint → name grape + our wine; both directions; distractors from structurally-adjacent wines).

## 9. Confidence + honest readiness
One tap before reveal: **Sure / Shaky**. Sure+Wrong → loud full-screen hypercorrection + forced re-show. Sure+Right → promote two boxes; Shaky+Right → promote ≤1. Confidence weights the Readiness "shift-ready %" so lucky guesses don't inflate it. One `confidence` field per attempt.

## 10. Forgiving streak
Lenient by design (already 1 grace day in the engine). v2 UI: a **weekly goal** option (Adrian works weekends — daily-only streaks are a known shift-worker dealbreaker) + **silent streak-freeze** (a snowflake shown *after* you were protected, no fear popup). Never punitive copy.

## 11. Design system (the visual contract)
Extract the mockup's exact tokens into `src/app.css` `:root` (palette incl. the contrast-safe `--accent-dark`/`--label-light`, Oswald display + Arial body stack, radii, the 3 breakpoints, shadow/spacing scale). **This file is the single source of truth and the visual-regression baseline.** Carry forward v1's contrast + focus-visible fixes. No generic-AI gradients; extend the Bridgette workbook identity.

## 12. Data-model additions + accuracy fixes
**Additions:** `objections[]` (simulator), `climate`, `family`, `serviceTemp`/`glass` (stubbed for fast-follow), surface the menu's `exclusive` flag, `schemaVersion`. **Accuracy fixes (a beginner memorizes these as fact):**
- `vegan`: `true` only for `v`-marked wines; else `null`/"unconfirmed" + confirm rule (stop asserting `vegan:false`).
- Label folklore mnemonics as memory hooks (Monastrell "dog-strangler", Sangiovese "blood of Jove" — soften).
- Ribeye lead = St. John Claret / Cerrón Tinto; Ca' del Baio Nebbiolo → strip/lamb (medium-bodied, don't oversell).
- Lambrusco stays "dry-ish, taste to confirm."
- Audit every region/producer spelling against a gazetteer (Jancis Robinson/GuildSomm), not the menu.

## 13. PWA
Manifest: name "Bridgette Bar Training", `display: standalone`, theme/background = deep ink, maskable icon, portrait. Precache app shell + data + audio (add `mp3` to globs or static+CacheFirst). `registerType:'prompt'` + a "new version — refresh" toast; periodic SW update check. Quiet, contextual **install prompt after the first completed session** (not on load); remember dismissal. In-app back/close affordances (installed PWA has no browser chrome).

## 14. Accessibility
Carry v1's a11y wholesale (the `inert` face management, `aria-live` feedback, focus front→answer, keyboard grading, ring `aria-label`s, contrast). New components reproduce the choreography. Targets ≥44px (fix the 34px speak button). a11y is an **executable acceptance test** (axe per route+state) — but axe catches ~30–40% of WCAG, so screen-reader focus order + contrast remain a **human checkpoint**.

## 15. The de-risked build process (how v2 gets built)
A *purely* autonomous overnight build is the riskiest path (design drift to generic AI defaults; silent offline/a11y/progress breakage). So:

**Phase 1 — Content + accuracy** (checkpointed; accuracy-sensitive). Enrich `data.js` for the in-scope features (`objections[]`, `climate`, `family`, `exclusive`) + apply all §12 accuracy fixes, each sourced/flagged; Adrian confirms any uncertain sommelier fact.

**Phase 2 — Foundation** (human-verified Step 0, NON-autonomous). Scaffold SvelteKit+PWA with **pinned `package.json` + lockfile** (`npm ci` + `npx playwright install` proven to work); extract design tokens → `app.css`; **port the pure engine to ESM and convert its ~50 tests to Vitest — all green**; author TS interfaces; freeze a **card-ID snapshot + golden `bb_progress_v1` fixture**. Adrian signs off on tokens + green engine tests.

**Phase 3 — Autonomous overnight UI build** (the Workflow). Builds only the UI/screens + the v2 features to the **frozen** design, with **hard CI gates**: Playwright **visual-regression** at 3 breakpoints vs the mockup baseline; **offline e2e** (setOffline → app + flashcard + audio work/fallback); **axe** on every route+state; **progress-migration golden fixture**; all engine/component/e2e tests green. Plus an **adversarial self-review pass** (screenshot each screen → diff vs mockup → list every generic-default / missing interaction / unlabeled control → fix), wiring `interface-design:critique` + `web-quality-audit` + `accessibility`. Per-screen **Definition of Done** checklist; parallel agents own disjoint files.

**Phase 4 — Morning verify + deploy** (mandatory human checkpoint). Adrian reviews all 5 screens on a **real phone + laptop**: visual fidelity, screen-reader focus order, real-device offline, "does a session feel good." Fix, then deploy to Cloudflare Pages.

## 16. Testing
Unit (ported engine, Vitest `import`); component (`vitest-browser-svelte`, real Chromium); e2e (Playwright golden journeys + offline); a11y (`@axe-core/playwright`); visual-regression (3 breakpoints vs mockup); progress-migration golden fixture. All are hard gates in Phase 3.

## 17. Acceptance criteria
- Installable, offline-capable PWA; responsive shell (sidebar/rail/tab-bar) verified at 3 breakpoints.
- Core loop: instant feedback + why, session progress, animated summary; reduced-motion honored.
- Guest Simulator works (Ask→Match→Explain→Confirm + objections, scored, box-scaled).
- Reasoning layer: families view, climate/region map, style map, "Mystery Pour" card.
- Confidence tap + hypercorrection; Readiness "% ready" confidence-weighted.
- Forgiving streak (weekly goal + silent freeze).
- Engine reused; **card IDs + localStorage keys unchanged**; golden progress fixture migrates cleanly.
- MP3s served static + offline; fallback chain intact; respelling always shown.
- All §12 accuracy fixes applied; `vegan` no longer overclaimed.
- All tests green incl. visual-regression, offline, axe, migration; adversarial self-review pass clean.
- Morning human checkpoint signed off on real devices before deploy.
- Bridgette tokens are the single CSS source of truth; no generic-AI styling.
