# Bridgette Training v2 — Foundation Handoff (Phases 1 + 2)

**Date:** 2026-06-07 (overnight unattended build)
**Branch:** `v2-app` (off `main`; **`main` is untouched**, still at `b9576f5`)
**Status:** Phase 1 (content + accuracy) and Phase 2 (non-UI foundation) complete and green. **Phase 3 (the UI build) has NOT started — it waits for your sign-off.**

This is the morning checkpoint from spec §15: sign off on the **design tokens** + the **green engine tests**, skim the open questions, then green-light the Phase 3 UI workflow.

---

## 1. Evidence (all run fresh at completion)

| Gate | Result |
|---|---|
| `cd app && npm ci` | exit 0 (reproducible from committed lockfile) |
| `cd app && npx playwright install --with-deps` | chromium-1223 + firefox-1522 + webkit-2287 downloaded, exit 0 |
| `cd app && npm run test` (Vitest) | **98 passed**, 7 files (engine 54, wineschool 8, data 7, card-ids 2, migration 5, tokens 18, audio 4) |
| `cd app && npm run check` (svelte-check) | **0 errors, 0 warnings** |
| `cd app && npm run build` (adapter-static + PWA) | builds; `build/index.html` (SPA fallback) + `sw.js` + `manifest.webmanifest` + 17 MP3s; SW precache 32 entries / 557 KiB |
| `node --test tests/*.test.js` (v1 engine) | **66 passed, 0 failed** |
| `python tests/check_training.py` + `check_dashboard.py` + `check_dashboard_contrast.py` | all PASS |

Dependencies are **pinned exact** (no `^`/`~`) with the lockfile committed: Svelte 5.56.2, @sveltejs/kit 2.63.0, @sveltejs/adapter-static 3.0.10, @vite-pwa/sveltekit 1.1.0, Vite 8.0.16, Vitest 4.1.8, svelte-check 4.6.0, TypeScript 6.0.3, @playwright/test 1.60.0, jsdom 29.1.1, @types/node.

---

## 2. Phase 1 — content + accuracy (`src/data.js`)

All §12 fixes applied, web-verified where possible. The canonical content lives in `src/data.js` (v1's file); the v2 app reads a generated copy (see §3).

**New v2 fields on every wine:** `exclusive` (5 menu-marked: Ca' del Baio, Vini be Good Chenin, Wagner-Stempel, Darting, Dona Matilde), `climate` (cool/moderate/warm, sourced), `family` (the 5 buckets), `objections[]` (2–3 guest curveballs each for the Simulator), and top-level `schemaVersion: 2` + a `confirm` rules block (vegan + allergens).

**Accuracy fixes (spec §12):**
- `vegan`: now `true` only for the 5 menu-`v` wines; `null` (unconfirmed) for the other 12 (stopped asserting `vegan:false`). Two wines have a sourced `veganNote` flagging likely-NOT-vegan (Blue Mountain — casein fining; Bindi Sergardi — egg-white fining).
- Folklore softened to memory hooks: Monastrell "dog-strangler" and Sangiovese "blood of Jove" now labelled as folklore/story, not fact.
- Ribeye lead = St. John Claret / Cerrón Tinto; the medium-bodied Nebbiolo repointed to strip steak / lamb / mushroom (dropped the 26oz ribeye from its pairings + copy).
- Lambrusco kept "dry-ish, taste to confirm" (already in `structureNote`).
- Spelling vs gazetteer: **Wagner-Stempel** (hyphen, synced across the wine name + 2 translator rows + 4 food pairings, integrity-checked); **Bindi La Boncia → "Chianti DOCG"** (not Chianti Classico).

**Verification provenance:** [per-wine source table](research/2026-06-07-v2-content-verification.md) (17-agent parallel web check).
**Things to confirm:** [docs/v2-open-questions.md](v2-open-questions.md) — St. John Claret grape precision, the two not-vegan flags, a few medium-confidence climates, Neverwine origin. None were asserted as fact in the app.

The v1 dashboard suite stays green (the `vegan` contract in `tests/check_training.py` was relaxed to `true|null`; `dist/` rebuilt locally — it's gitignored).

---

## 3. Phase 2 — foundation (`app/`, non-UI)

SvelteKit project at `app/`. **No screens were built** — only an empty layout that imports the tokens and a placeholder page.

**What Phase 3 will build on (the frozen contract):**

- **Design tokens / visual contract:** `app/src/app.css` `:root` — the full Bridgette palette (incl. `--accent-dark`/`--label-light`/`--muted-paper` contrast-safe values), Oswald+Arial stack, radii, `--shadow-flash`, spacing scale, the 3 breakpoints (`--bp-tablet:1000px`, `--bp-mobile:680px`), and v1's focus-visible choreography. **This file is the single source of truth + the visual-regression baseline.** Guarded by `tokens.test.ts`.
- **Engine API (pure ESM):** `app/src/lib/engine/training.js` and `wineschool.js`. Every consumer passes `data` explicitly (no `window.BB` global). Key exports: `buildSession`, `generateDeck`, `allCards`, `grade`, `gradeTyped`, `buildReadiness`/`scoreReadiness`/`recordReadiness`, `recordResult`, `masteryFor`, `migrateProgress`, `loadProgress`/`saveProgress`, `exportProgress`/`importProgress`, `whyDisplay`, `modeForBox`, `deduce`, `checkQuickCheck`, `STORAGE_KEY`. JSDoc `@returns` annotations give typed results. **`STORAGE_KEY === "bb_progress_v1"` and the card-`id` slug scheme are byte-for-byte identical to v1.**
- **Typed data:** `import { data } from '$lib/data/index'` (typed `BridgetteData`). Generated from `src/data.js` by `tools/build_app_data.mjs` (single source — edit `src/data.js`, re-run the generator). Interfaces in `app/src/lib/data/types.ts`.
- **Progress-loss guards (hard gates):** `app/src/lib/engine/__fixtures__/card-ids.json` (frozen 176-id snapshot, `card-ids.test.ts`) and `__fixtures__/golden-progress.v1.json` (`migration.test.ts` proves a real v1 user's boxes/streak/readiness survive + orphan ids drop). **Keep these green** — a red card-ids test means an `id` changed and Leitner state would wipe.
- **Audio:** 17 MP3s at `app/static/audio/<wineId>.mp3` + `manifest.json` (fallback text/lang per wine). Util: `import { playPronunciation, audioUrl } from '$lib/audio/playPronunciation'` — MP3 → Web-Speech(lang) → (respelling, always shown by the UI). The SW precaches the MP3s for offline.
- **PWA:** `@vite-pwa/sveltekit`, `registerType:'prompt'` (never auto-reload mid-session). Manifest name "Bridgette Bar Training", standalone, portrait, theme/bg `#132b3b`. **`icons:[]` is empty + the favicon link was removed** — Phase 3 must add the branded maskable icon set + favicon (this was the one deferred scaffold item).

**What Phase 3 builds (spec §5–§10, to the frozen design):** the 5 surfaces — **Practice** (default; core loop + Guest Simulator + Readiness), **Today** (cockpit + action-first onboarding), **Wine School** (7 lessons + deductive grid + new families/geography), **Reference** (chip-filtered library + multi-entry search), **Progress** (mastery rings + weak list + forgiving streak + export/import). Shell = sidebar → rail → tab-bar at the 3 breakpoints. v2 features: core loop with instant why-feedback + animated summary, the Simulator (Ask→Match→Explain→Confirm + the new `objections[]`), reasoning layer (families, climate/region map, body×acidity style map, "Mystery Pour"), confidence tap + hypercorrection, forgiving streak (weekly goal + silent freeze), dual-coding visuals.

**Phase 3 CI gates (from spec §15/§16):** Playwright visual-regression at the 3 breakpoints vs the mockup; offline e2e (setOffline → app + flashcard + audio fallback); axe per route+state; the migration golden fixture; all engine/component/e2e green; plus the adversarial self-review pass (screenshot each screen → diff vs mockup → fix every generic-default/missing-interaction/unlabeled-control), wiring `interface-design:critique` + `web-quality-audit` + `accessibility`.

**Edge-case decisions (note, override if you disagree):** the sparkling Lambrusco is in **"Bubbles & Rosé"**; the 0.0% Neverwine is in **"Bright & Crisp Whites"**. Both documented in open-questions.

---

## 4. How to run it

```bash
cd app
npm ci                 # reproducible install
npm run test           # 98 unit/engine/migration tests
npm run check          # typecheck
npm run dev            # local dev server (placeholder page only until Phase 3)
npm run build          # static SPA + PWA into app/build
node ../tools/build_app_data.mjs   # regenerate app data after editing src/data.js
```

---

## 5. Your decisions before Phase 3
1. **Sign off on `app/src/app.css` tokens** (the visual contract) and the **green engine tests** (spec §15 Step 0).
2. Skim **[open questions](v2-open-questions.md)** — a few sommelier calls (St. John Claret grapes, two not-vegan flags, Neverwine origin).
3. Green-light the **Phase 3 autonomous UI workflow**.
