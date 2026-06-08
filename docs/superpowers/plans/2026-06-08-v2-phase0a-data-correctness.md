# Phase 0a — Data Correctness + Zero-Proof Safety Guard (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every server-facing data error found by the correctness sweep — starting with the guest-safety bug (a 5.0% beer listed as "zero-proof") — and add a build-time guard so an alcoholic drink can never again leak into the non-alcoholic field.

**Architecture:** The menu data has two sources. Core facts (by-the-glass wines, foods, the core translator) live in `src/data.js` (shared with v1) and are compiled to `app/src/lib/data/data.js` by `node tools/build_app_data.mjs`. Bottle/beer/fortified facts trace to `docs/research/2026-06-07-v2-content-sourced.json` → `node tools/curate_sourced.mjs` → `src/data-fullmenu.json` → the same build step (which also emits `app/static/fullmenu.json`). We edit the **source**, regenerate, and verify the frozen card-id contract + v1 gate stay green after every change.

**Tech Stack:** Node ESM build scripts, Vitest, Python (`tests/check_training.py`), the `@vite-pwa/sveltekit` build.

**Authoritative change-set:** [`docs/research/2026-06-08-v2-content-correctness-sweep.md`](../../research/2026-06-08-v2-content-correctness-sweep.md) (committed; exact from→to + sources for every fix). This plan sequences and verifies those fixes; the sweep doc is the per-record reference.

**Invariants that must hold after EVERY task (the verification gate):**
```bash
cd app && npm test            # Vitest — includes the card-id snapshot + data tests (FAILS if any existing card-id changes)
cd app && npx svelte-check --tsconfig ./tsconfig.json   # 0 errors / 0 warnings
cd app && npm run build       # production build succeeds
python tests/check_training.py   # v1 gate stays PASS (run from repo root)
```
If a data edit would change an existing card-id, **stop** — the contract is additive-only; reassess rather than force it.

---

### Task 1: The zero-proof safety guard (failing test first) + the critical fix

**Files:**
- Create: `app/src/lib/data/zero-proof.test.ts`
- Modify: `src/data.js` (the `french-fries` food record, ~line 129)
- Regenerate: `app/src/lib/data/data.js`, `app/static/fullmenu.json` (via the build script)

- [ ] **Step 1: Write the failing guard test**

Create `app/src/lib/data/zero-proof.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { data } from './data.js';

// The ONLY drinks the menu sells as non-alcoholic (verified against
// source_menus/calgary-drink.txt "no alcohol" section in the 2026-06-08 sweep).
// True 0.0% + the <0.5% de-alcoholized items the menu lists under "no alcohol".
const ALLOWED_ZERO = new Set([
  'Gallina de Piel Neverwine',
  'Peroni Pilsner 0.0',
  'Redbull',
  'Pop',
  'Lovers Mountain',
  'Short Film',
  'Sunrise Spritz',
  'Noughty Rouge',
  'Freixenet Sparkling Wine'
]);

// foods[].zero is a display string; multiple options are joined with " or ".
function tokens(zero: string): string[] {
  return zero.split(/\s+or\s+/i).map((s) => s.trim()).filter(Boolean);
}

describe('foods[].zero is only ever genuinely non-alcoholic', () => {
  for (const f of data.foods.filter((x: any) => x.zero)) {
    it(`${f.id}: every zero-proof option is on the verified N/A list`, () => {
      for (const t of tokens(f.zero)) {
        expect(ALLOWED_ZERO.has(t), `"${t}" in ${f.id}.zero is not a verified non-alcoholic item`).toBe(true);
      }
    });
  }
});
```

- [ ] **Step 2: Run it and confirm it FAILS on the live data**

Run: `cd app && npx vitest run src/lib/data/zero-proof.test.ts`
Expected: FAIL — `"Ol' Beautiful Okami Kasu Japanese Lager" in french-fries.zero is not a verified non-alcoholic item`.

- [ ] **Step 3: Fix the source (`src/data.js`, `french-fries` record)**

Replace the `zero` field. Old (current):
```js
zero:"Freixenet Sparkling Wine or Ol' Beautiful Okami Kasu Japanese Lager",
```
New:
```js
zero:"Freixenet Sparkling Wine or Peroni Pilsner 0.0",
```

- [ ] **Step 4: Regenerate the app data**

Run: `node tools/build_app_data.mjs`
Expected: `wrote data.js (17 wines) + static/fullmenu.json (...)` and `git diff app/src/lib/data/data.js` shows only the french-fries `zero` change.

- [ ] **Step 5: Run the guard test and confirm it PASSES**

Run: `cd app && npx vitest run src/lib/data/zero-proof.test.ts`
Expected: PASS (every food's zero options are now on the allow-list).

- [ ] **Step 6: Run the full verification gate**

Run (from repo root):
```bash
cd app && npm test && npx svelte-check --tsconfig ./tsconfig.json && npm run build && cd .. && python tests/check_training.py
```
Expected: Vitest all pass (card-id snapshot unchanged), svelte-check 0/0, build OK, check_training PASS.

- [ ] **Step 7: Commit**

```bash
git add app/src/lib/data/zero-proof.test.ts src/data.js app/src/lib/data/data.js app/static/fullmenu.json
git commit -m "fix(v2): remove 5% beer from French Fries zero-proof field + add build-time non-alc guard (sweep CRITICAL)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Core (`src/data.js`) data corrections

Apply each fix below to `src/data.js` (locate the record by grepping the quoted anchor), then regenerate and verify. These are display/fact corrections; none changes a card-id (verified by the gate in Step N).

**Files:**
- Modify: `src/data.js`
- Regenerate: `app/src/lib/data/data.js`, `app/static/fullmenu.json`

- [ ] **Step 1: Translator "Moscato / sweet white" — dangling Tawny Port**

In the `translator` row `{ask:"Moscato / sweet white", …}`, change `bottleOptions`:
- From: `bottleOptions:["Valdespino Cream Sherry","Tawny Port"],`
- To: `bottleOptions:["Valdespino Cream Sherry","Quevedo Tawny 10yr"],`

- [ ] **Step 2: Fattoria Moretto Semprebon — it is off-dry, not dry**

Find the `wines[]` record whose `name:"Fattoria Moretto Semprebon"`. Change `structure.sweetness` from `"dry"` to `"off-dry"`, and rewrite any "runs dry / not sweet" copy in its `objection`/`say`/`structureNote` to: `"gently off-dry and fruity — I'll taste-confirm."` (The named "Semprebon" cuvée is the Amabile; sweep HIGH.) **Flag for Adrian:** confirm which Moretto cuvée is actually poured (Semprebon=amabile vs Canova=secco).

- [ ] **Step 3: St. John Claret — it is Cabernet-led**

Find `wines[]` `name:"St. John Claret"`. Change `grape` from `"Merlot & Cabernet Sauvignon"` to `"Cabernet Sauvignon & Merlot"`. Update any objection/translator copy that calls it "Merlot-led" to "Cab-led Bordeaux blend". (49% Cab / 43% Merlot / 6% Cab Franc / 2% Malbec.)

- [ ] **Step 4: Wagyu Beef Carpaccio — the "why" calls high-tannin Nebbiolo "light-tannin"**

Find the `foods[]` record `name:"Wagyu Beef Carpaccio"`. It pairs `wine:"Ca' del Baio Langhe Nebbiolo"` with a `why` describing light tannin — a false fact. **Flag for Adrian (team decision):** either (a) change the `wine` to `"Deinhard Deidesheim"` (the low-tannin Pinot, which already pairs the dish), or (b) keep the Nebbiolo and rewrite the `why` to stop claiming light tannin. Default for this pass: **(a) swap to Deinhard Deidesheim** and set the `why` to: `"Delicate raw beef wants a high-acid, low-tannin red — the Pinot lifts the richness without overwhelming it."` Note the swap in the open-questions doc for sommelier sign-off.

- [ ] **Step 5: Display-consistency fixes**

- Darting Dürkheimer Fronhof `wines[]` record: soften `structure.sweetness` from `"off-dry"` to keep the existing `structureNote` "taste to confirm" framing — change is optional/low; leave `off-dry` if it has a sweetness card (the gate will tell you). Skip if it risks a card-id change.
- In the four `wines[].pair` arrays that contain `"Oysters"` (Blue Mountain Brut, Darting Dürkheimer Fronhof, Ameztoi Rubentis, Gallina de Piel Neverwine), change `"Oysters"` → `"Oysters 1/2 dozen"` to match the food record name.

- [ ] **Step 6: Regenerate + verify gate**

Run: `node tools/build_app_data.mjs` then the full gate (Task 1 Step 6). Confirm `npm test` shows **no card-id change** and `check_training.py` PASS. If any card-id changed, revert that specific edit and flag it.

- [ ] **Step 7: Commit**

```bash
git add src/data.js app/src/lib/data/data.js app/static/fullmenu.json docs/v2-open-questions.md
git commit -m "fix(v2): core data corrections — Tawny Port, Fattoria off-dry, Claret Cab-led, Wagyu pairing, Oysters name (sweep HIGH/MED)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Full-menu (bottles/beers) corrections via the sourced JSON

These records are generated. Edit the **source** `docs/research/2026-06-07-v2-content-sourced.json`, re-run curate, then build. (Editing `src/data-fullmenu.json` directly would be overwritten by the next curate run.)

**Files:**
- Modify: `docs/research/2026-06-07-v2-content-sourced.json`
- Regenerate: `src/data-fullmenu.json` (via `node tools/curate_sourced.mjs`), then `app/static/fullmenu.json` + `app/src/lib/data/data.js` (via `node tools/build_app_data.mjs`)

- [ ] **Step 1: Apply the field corrections** (grep each `"name"` to find the record)

| Record | Field | To |
|---|---|---|
| Charlotte & Jean Baptiste Senat Amalgame | `grape` | `"Grenache Noir, Grenache Gris & old Languedoc varieties (Piquepoul, Counoise, Terret)"` |
| Raventós i Blanc de Nit Rosé | `grape` | `"Xarel·lo, Macabeu, Parellada & Monastrell"` |
| Gulfi Nerojbleo | `region` | `"Terre Siciliane IGT, Sicily, Italy"` |
| Dandy The Julia Peach Cobbler Sour | `abv` | `"5.5%"` |
| Uncommon Tropical Cider | `abv` | `"6.8%"` |
| Michelob Ultra | `abv` | `"4.2%"` *(menu prints 4.0% — flag for Adrian whether to match the menu or reality)* |

- [ ] **Step 2: Fallentimber Honey Buck — confirm placement**

Verify whether `Fallentimber Honey Buck` (a 5.0% sparkling mead) currently sits under `fortifieds` in the sourced JSON; if so, leave the record but ensure its `type`/`style` reads `"Sparkling mead (honey, lemon, ginger; gluten-free)"` and **flag for Adrian** whether it should be surfaced under Beer rather than Digestifs (categorization, low risk). Do not delete it.

- [ ] **Step 3: Regenerate**

Run:
```bash
node tools/curate_sourced.mjs && node tools/build_app_data.mjs
```
Expected: curate prints its counts with no `throw` (the LMH map only throws on unmapped *structure* values; these edits touch only string fields). `git diff src/data-fullmenu.json` shows only the intended field changes.

- [ ] **Step 4: Verify gate + commit**

Run the full gate (Task 1 Step 6). Then:
```bash
git add docs/research/2026-06-07-v2-content-sourced.json src/data-fullmenu.json app/static/fullmenu.json app/src/lib/data/data.js docs/v2-open-questions.md
git commit -m "fix(v2): bottle/beer corrections — Senat & Raventós blends, Gulfi IGT, cider/sour ABVs, Michelob (sweep)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: PWA opens on the dashboard (`start_url`)

**Files:**
- Modify: `app/vite.config.ts` (the `manifest` object, ~line 11)

- [ ] **Step 1: Add `start_url` + `id` to the manifest**

In the `manifest: { … }` object, after `description`, add:
```ts
        start_url: '/today',
        id: '/today',
```

- [ ] **Step 2: Build and verify the manifest**

Run: `cd app && npm run build`
Then confirm the generated manifest carries it:
Run: `node -e "const m=require('./app/.svelte-kit/output/client/manifest.webmanifest'); console.log(m.start_url)"` *(if the path differs, grep the built `*.webmanifest` under `app/.svelte-kit` / `app/build` for `start_url`)*.
Expected: `/today`.

- [ ] **Step 3: Commit**

```bash
git add app/vite.config.ts
git commit -m "fix(v2): PWA start_url -> /today so the installed app opens on the dashboard, not the deck picker

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Tighten the palette to Bridgette's live brand bytes

**Files:**
- Modify: `app/src/app.css` (`:root` tokens, lines 8 + 14)

- [ ] **Step 1: Update the two off-by-bytes tokens**

In `:root`:
- `--cream: #ffeed7;` → `--cream: #ffeed6;`
- `--orange: #f15623;` → `--orange: #f15825;`

- [ ] **Step 2: Verify contrast regression tests still pass**

Run (from repo root): `python tests/check_dashboard_contrast.py`
Expected: PASS (the change is ~1–2 bytes; if any contrast assertion now fails, adjust the dependent token and re-run — do not weaken a passing ratio).

- [ ] **Step 3: Verify the app build + Vitest token test**

Run: `cd app && npm test && npm run build`
Expected: PASS (the `tokens.test.ts` reads `app.css`; if it pins the old hex, update the expected value to the new byte).

- [ ] **Step 4: Commit**

```bash
git add app/src/app.css app/src/lib/tokens.test.ts
git commit -m "style(v2): align cream/orange tokens to Bridgette's live brand bytes (#ffeed6 / #f15825)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (against the spec §11 + the sweep fix-list):**
- Critical zero-proof bug + build guard → Task 1. ✅
- HIGH: Tawny Port (T2.1), Fattoria off-dry (T2.2), Senat & Raventós blends (T3.1), cider/sour ABVs (T3.1), Wagyu pairing (T2.4). ✅
- MEDIUM: St. John Claret (T2.3), Gulfi region (T3.1), Michelob ABV (T3.1), Oysters name (T2.5). ✅
- Spec §8 start_url → Task 4. Spec §10 palette bytes → Task 5. ✅
- **Deferred to Plan 0b (UI, separate plan):** matrix `slice(0,40)` fix, surfacing `familiar` + pronunciation on the Reference Translator card, emoji→line icons, kinder empty state, the `app/static/fullmenu.json` Fallentimber surfacing UI. Noted, not dropped.
- **Confirm-with-team (routed to `docs/v2-open-questions.md`, not auto-applied):** Fattoria cuvée, Wagyu swap, Michelob menu vs reality, Bindi Classico-vs-DOCG (left unchanged — needs the physical bottle), Stella ABV.

**Placeholder scan:** no TBD/TODO; every data edit has an exact from→to or a grep-able anchor + field + value; every step has a runnable command + expected output. The two "flag for Adrian" items are deliberate human decisions logged to open-questions, not code gaps.

**Type/contract consistency:** every task ends on the same verification gate (`npm test` card-id snapshot + `check_training.py`), so no edit can silently change a frozen card-id or break v1. The allow-list set in `zero-proof.test.ts` is the single source for "what counts as non-alcoholic" and is reused as the guard.

---

## Execution Handoff

Plan complete. Two execution options:
1. **Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks.
2. **Inline Execution** — execute here with checkpoints.

Bindi Sergardi (Chianti Classico vs DOCG) is intentionally **not** changed in this plan — it needs the physical bottle; it stays in open-questions.
