# v2 Study-Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). Steps use checkbox (`- [ ]`) syntax. Every commit must pass the gates: `cd app && npm test`, `npx svelte-check --tsconfig ./tsconfig.json`, `npm run build`, `npx playwright test`, and repo-root `python tests/check_training.py`. Branch `v2-app` only. Never push/merge/deploy.

**Goal:** Re-center the app on studying: app-wide brief→Expand progressive disclosure, rich miss-feedback, a Floor-Basics study on-ramp, retention levers, a daily-habit nudge, and 4 quick wins — all surfacing existing data depth, no new card ids.

**Architecture:** Pure engine helpers (`sourceForCard`/`expandFor`/`missFeedback`) resolve each card to its rich source record via additive `sourceKind`/`sourceId` fields; a shared `<Expandable>` (native `<details>`) renders brief→deep everywhere. Floor Basics is a soft `basicsOnly` filter in `buildSession`. Leitner + frozen contracts untouched.

**Tech Stack:** SvelteKit, Svelte 5 (runes), TypeScript, Vitest, Playwright, adapter-static PWA, localStorage.

**Spec:** [`../specs/2026-06-09-v2-study-redesign-design.md`](../specs/2026-06-09-v2-study-redesign-design.md)

---

## Phase 0 — Engine foundation (source linkage + helpers)

### Task 0.1: Add `sourceKind`/`sourceId` to generated cards

**Files:**
- Modify: `app/src/lib/engine/training.js` (the 9 `gen*`/`build*` generators)
- Modify: `app/src/lib/data/types.ts:183-198` (Card interface)
- Test: `app/src/lib/engine/source.test.ts` (new)

- [ ] **Step 1 — failing test** (`source.test.ts`): every card resolves to a source record.

```ts
import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { data } from '../data/index';

describe('card source linkage', () => {
  const cards = T.allCards(data);
  it('every card has a sourceKind + sourceId', () => {
    for (const c of cards) {
      expect(c.sourceKind, c.id).toBeTruthy();
      expect(c.sourceId, c.id).toBeTruthy();
    }
  });
  it('sourceForCard resolves a real record for every card', () => {
    for (const c of cards) {
      const src = T.sourceForCard(c, data);
      expect(src, c.id).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2 — run, expect FAIL** (`sourceForCard` undefined). `cd app && npx vitest run src/lib/engine/source.test.ts`
- [ ] **Step 3 — implement.** In `types.ts` add to `Card`: `sourceKind?: 'wine' | 'translator' | 'food' | 'cocktail'; sourceId?: string; sourceFoodId?: string; sourceWineId?: string;`. In each generator add the fields:
  - `genTranslator`: `sourceKind:'translator', sourceId: slug(t.ask)`
  - `genWineIdentity`, `genStructure` (both card shapes), `genPronunciation`, `genUpsell`, `buildMysteryPour` (both): `sourceKind:'wine', sourceId: w.id`
  - `genPairing`: `sourceKind:'food', sourceId: f.id`
  - `genCocktailPairing`: `sourceKind:'food', sourceId: f.id` (+ keep `answer` = cocktail name)
  - `genWineDish`: `sourceKind:'wine', sourceId: w.id, sourceFoodId: food.id`
  Add exported resolver:

```js
export function sourceForCard(card, data) {
  switch (card.sourceKind) {
    case 'wine': return data.wines.find((w) => w.id === card.sourceId) || null;
    case 'food': return data.foods.find((f) => f.id === card.sourceId) || null;
    case 'translator': return data.translator.find((t) => slug(t.ask) === card.sourceId) || null;
    case 'cocktail': return data.cocktails.find((c) => c.name === card.sourceId) || null;
    default: return null;
  }
}
```

- [ ] **Step 4 — run all engine tests, expect PASS** incl. the frozen `card-ids.test.ts` (ids unchanged): `cd app && npx vitest run src/lib/engine`
- [ ] **Step 5 — commit:** `feat(v2): additive sourceKind/sourceId on cards + sourceForCard resolver (no id change)`

### Task 0.2: `expandFor(card, data)` — the Expand drawer content

**Files:** Modify `training.js`; Test `app/src/lib/engine/expand.test.ts` (new)

- [ ] **Step 1 — failing test:**

```ts
import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { data } from '../data/index';

describe('expandFor', () => {
  it('a wine card surfaces tenSecond + structure + say', () => {
    const c = T.generateDeck('wine-identity', data)[0];
    const { sections } = T.expandFor(c, data);
    const labels = sections.map((s) => s.label);
    expect(labels).toContain('10-second');
    expect(labels).toContain('Structure');
  });
  it('a translator card surfaces the familiar/different/phrase', () => {
    const c = T.generateDeck('translator', data)[0];
    const { sections } = T.expandFor(c, data);
    expect(sections.length).toBeGreaterThan(0);
  });
  it('only returns sections that have data (no empty text)', () => {
    for (const c of T.allCards(data)) {
      for (const s of T.expandFor(c, data).sections) {
        expect(s.text || (s.items && s.items.length), `${c.id}/${s.label}`).toBeTruthy();
      }
    }
  });
});
```

- [ ] **Step 2 — run, expect FAIL.**
- [ ] **Step 3 — implement** `expandFor(card, data)` returning `{ sections: [{label, text?, items?, kind?}] }`. Resolve via `sourceForCard`. For `wine`: push sections for `tenSecond` (10-second), `structure` (meters: acidity/body/tannin/sweetness), `grape`+`region`+`climate` (The grape), `say` (Say it), `mnemonic` (Remember), `pair` (Pairs — items), `objections` (If they push back — items of {cue,reply}), `upgrade` (Upgrade bottle) — **each only if the field is non-empty**. For `translator`: `familiar` (Why it fits), `different` (Point of difference), `phrase` (Say it), `bottleOptions` (Real grape — items). For `food`: `why` (The lever), and the three picks (wine/cocktail/zero) as items. Pure; no rng.
- [ ] **Step 4 — run, expect PASS.**
- [ ] **Step 5 — commit:** `feat(v2): expandFor() builds the progressive-disclosure drawer from existing data`

### Task 0.3: `missFeedback(card, chosen, data)` — generalised chosen-vs-correct

**Files:** Modify `training.js`; Test `app/src/lib/engine/miss.test.ts` (new)

- [ ] **Step 1 — failing test:** chosen ≠ answer → `{said: chosen, correct: card.answer, why}`; same-family wine confusion still populates `confusion`.
- [ ] **Step 2 — run, expect FAIL.**
- [ ] **Step 3 — implement** `missFeedback(card, chosen, data)` → `{ said, correct, why, confusion? }`. `said=chosen`, `correct=card.answer`, `why=card.why`. `confusion`: resolve answer + chosen to wines (by name, the existing path) and, when both are wines of the same `family`, return `{ chose: chosenWine, answer: answerWine }` with the `tenSecond`. (Keep wine-specific confusion; the generalisation is that it no longer lives in the component.)
- [ ] **Step 4 — run, expect PASS.**
- [ ] **Step 5 — commit:** `feat(v2): missFeedback() — engine helper for you-said/correct/why`

---

## Phase 1 — The study card

### Task 1.1: `<Expandable>` component

**Files:** Create `app/src/lib/components/Expandable.svelte`; Test via build + a11y e2e (Task 1.4).

- [ ] **Step 1 — implement** a `<details class="expandable">` wrapper: `summary` shows `label` (closed) / `openLabel` (open) with a rotating `▸` SVG chevron; `<slot>` is the depth. Props `label='Expand'`, `openLabel='Less'`, `tone?: 'default'|'miss'`. Style to match `.objections summary`. Respects `prefers-reduced-motion`. Min-height 44px summary (touch).
- [ ] **Step 2 — verify:** `cd app && npx svelte-check --tsconfig ./tsconfig.json` → 0/0.
- [ ] **Step 3 — commit:** `feat(v2): <Expandable> — native <details> accordion for the brief->depth house style`

### Task 1.2: Rich miss-feedback + Expand drawer in the flashcard

**Files:** Modify `app/src/routes/+page.svelte` (reveal block `:375-411`, the `confusion` derived `:63-68`, the live region `:315-321`).

- [ ] **Step 1 — replace** the local `confusion` derivation with `engine.missFeedback(card, chosen ?? typedValue, data)` (computed on reveal). Render, on a miss (`pendingCorrect===false`): a `.miss` banner = `You said {said} ✗` / `Correct {correct} ✓` (+ speaker if audioText). Keep the existing `.confusion` mix-up line, fed from `missFeedback().confusion`.
- [ ] **Step 2 — add** the Expand drawer: `<Expandable label="Expand — full card">` rendering `engine.expandFor(card, data).sections` (structure as meters via `StructureMeter`, objections as nested `<Expandable>` or a list, pairs as pills). Always available at every box.
- [ ] **Step 3 — retention §7:** drop the `pendingCorrect === false` guard on the `Explain this →` link (`:393`) so correct reveals offer it too; add the MC retrieval nudge (`:351`); widen hypercorrection to any committed recall miss (`:142`).
- [ ] **Step 4 — update** the `aria-live` reveal text to include `said`/`correct` for screen readers.
- [ ] **Step 5 — verify:** `npm run build`; preview + `preview_snapshot`/`preview_eval` an MC miss shows the you-said/correct banner and the Expand opens. `npx svelte-check` 0/0.
- [ ] **Step 6 — commit:** `feat(v2): study card — you-said/correct miss-feedback + always-available Expand drawer`

### Task 1.3: Engine + retention unit coverage

**Files:** extend the Phase-0 tests + add a buildSession-interleave test for the focus-deck change (§7.4) if implemented.

- [ ] Verify `npx vitest run` green; commit any added tests: `test(v2): cover miss-feedback + expand rendering paths`.

### Task 1.4: a11y/e2e for the new card

- [ ] **Step 1 — run** `cd app && npx playwright test` — the Practice route axe check must stay AA with the new `<details>`/banner. Fix contrast/labels if flagged.
- [ ] **Step 2 — commit** any fixes: `fix(v2): keep Practice AA with the redesigned reveal`.

---

## Phase 2 — App-wide brief→Expand

### Task 2.1: Reference wine + bottle cards
**Files:** Modify `app/src/routes/reference/+page.svelte` (wine `:108-145`, bottles `:209-234`).
- [ ] Wrap the deep block (profile, pairs, upgrade, objections) in `<Expandable>`; brief stays head+pron+tenSecond+price+meters. Fold the existing `objections <details>` inside the one disclosure. Repeat for Bottles (brief→`tenSecond`; Expand=`pairWhy`+pairs).
- [ ] Verify build + svelte-check + the reference axe e2e. Commit: `feat(v2): Reference wine/bottle cards adopt brief->Expand`.

### Task 2.2: On-the-Floor substitution cards
**Files:** `app/src/routes/on-the-floor/+page.svelte:182-211`.
- [ ] Brief = ask + pour + bridge line; Expand = meters + pronunciation + point-of-difference + bottleOptions + phrase. Commit: `feat(v2): On-the-Floor subs collapse to the bridge line + Expand`.

### Task 2.3: Learn read sections
**Files:** `app/src/routes/learn/+page.svelte:255-302`.
- [ ] Brief = name + grape/category + pron; Expand = structure meters + tenSecond. Commit: `feat(v2): Learn read sections adopt brief->Expand`.

---

## Phase 3 — Floor Basics study on-ramp

### Task 3.1: `basics.js` + guard test
**Files:** Create `app/src/lib/engine/basics.js`; Test `app/src/lib/engine/basics.test.ts`.
- [ ] **Step 1 — failing test:** `basicsIdSet(data)` returns 30–40 ids, all ∈ `validIdSet`, spanning ≥5 decks.
- [ ] **Step 2 — implement** the human-readable allow-list (§6 list) + `basicsIdSet(data)` that resolves keys via the generators (`generateDeck('translator',…)` match by `slug(ask)`; wine-identity/pronunciation by `wineId`/`sourceId`; pairing by `food.id`; structure by `wineId`). Drop unresolved keys silently. **Verify the exact wine/food ids against `data.js` first.**
- [ ] **Step 3 — PASS;** commit `feat(v2): Floor Basics allow-list + basicsIdSet (guarded)`.

### Task 3.2: `basicsOnly` setting + migration + buildSession filter
**Files:** `training.js` (`defaultProgressShape`, `migrateProgress`, `buildSession`), `progress.svelte.ts` (`dueCount` optional filter, `setBasicsOnly`), `types.ts` (settings).
- [ ] **Step 1 — failing test** (`app/src/lib/engine/basics-session.test.ts`): `buildSession(null, {data, progress, basicsOnly:true})` returns only basics ids; migration defaults `basicsOnly` ON for empty `cards`, OFF when `cards` non-empty; explicit saved value respected.
- [ ] **Step 2 — implement:** add `basicsOnly` to settings type + default `true`; migrator: `base.settings.basicsOnly = (raw.settings && 'basicsOnly' in raw.settings) ? raw.settings.basicsOnly !== false : Object.keys(base.cards).length === 0;`. In `buildSession`: read `ctx.basicsOnly ?? progress.settings.basicsOnly`; if true and `deckId == null`, `pool = cards.filter(c => basicsIdSet(data).has(c.id))` (memoise the set). `dueCount(basicsOnly?)` filters likewise. `progressStore.setBasicsOnly(b)`.
- [ ] **Step 3 — PASS** (+ all existing buildSession/migration tests green); commit `feat(v2): soft Floor-Basics gate in Smart Review (default new-user only)`.

### Task 3.3: The toggle UI
**Files:** `app/src/routes/+page.svelte` (Practice home) + a line on Today.
- [ ] Add a "Just the basics ⇄ Study everything" segmented control bound to `progressStore.value.settings.basicsOnly` / `setBasicsOnly`. Copy explains the soft gate. Verify build + axe. Commit `feat(v2): Floor-Basics toggle on Practice/Today`.

---

## Phase 4 — Habit + backup

### Task 4.1: `<BackupCard>` on Today (data-loss fix)
**Files:** Create `app/src/lib/components/BackupCard.svelte` (move `doExport`/`onFile`/`fileInput` from `progress/+page.svelte:24-44,115-124`); add to `today/+page.svelte` after the floor-moves grid.
- [ ] Implement; reuse `progressStore.exportJson()/importJson()`. Keep `/progress` reachable from the session summary. Verify build + e2e (Today axe). Commit `fix(v2): reachable progress Backup card on Today (closes data-loss gap)`.

### Task 4.2: Drill of the Day + study-now
**Files:** `today/+page.svelte:65-101,104`.
- [ ] Add a "Today's drill: {weakest deck}" card → `/?deck={lowestDeckId}`; add a persistent "Study now" affordance for course/caught-up days. Verify. Commit `feat(v2): Drill of the Day + persistent Study-now on Today`.

---

## Phase 5 — Quick wins

### Task 5.1: `Icon.svelte` + emoji→SVG sweep
**Files:** Create `app/src/lib/components/Icon.svelte` (path-array set: speaker, slow, flame, snowflake, calendar, warning, lock, check, cross, dot); replace functional emoji at the mapped sites (`+page.svelte`, `today`, `progress`, `on-the-floor`, `reference`, `learn`, `practice/simulator`). Keep decorative prose `→`/`←` as text.
- [ ] Implement Icon + replace each functional emoji, preserving `aria-hidden`/labels. Verify build + svelte-check + full axe e2e. Commit `feat(v2): replace functional emoji with the inline-SVG Icon set`.

### Task 5.2: Zero-proof Reference section
**Files:** `app/src/routes/reference/+page.svelte` (+ chips `:17`).
- [ ] Add a "Zero-proof" filter/section listing each verified N/A drink (the `zero-proof.test.ts` allow-list) with the dishes it's suggested for (invert `foods[].zero`) + `data.beerZero`. Searchable via existing `GuestSearch`. No new data authoring. Verify. Commit `feat(v2): zero-proof drinks as first-class Reference lookups`.

### Task 5.3: CI workflow
**Files:** Create `.github/workflows/ci.yml`.
- [ ] Node 20 matrix; steps: `npm ci` (in `app/`), `npm test`, `npx svelte-check`, `npm run build`, `npx playwright install --with-deps`, `npx playwright test`, then root `python tests/check_training.py`. Won't run until the remote exists. Commit `ci(v2): add gates workflow (runs once a GitHub remote exists)`.

---

## Phase 6 — Docs & memory
- [ ] Update `docs/v2-redesign-status.md` (the pivot + what shipped), append decisions/open-questions to `docs/v2-open-questions.md` (the ~37 basics list for sign-off; basicsOnly default; zero-proof scope), update the `bridgette-training-tool` memory. Commit `docs(v2): record the study-redesign pivot + outcomes + open questions`.

---

## Self-review (coverage)
Spec §3 Expandable → T1.1; §4 card/source/helpers → T0.1–0.3,1.2; §5 app-wide → T2.1–2.3; §6 Floor Basics → T3.1–3.3; §7 retention → T1.2 step 3; §8 habit → T4.2; §9 quick wins → T5.1–5.3 + T4.1; §10 contracts → enforced by card-ids/data tests run every phase; §11 gates → every task's verify step; §13/§14 → T6. No placeholders; types (`sourceKind`, `basicsOnly`, `expandFor().sections`, `missFeedback()→{said,correct,why,confusion}`) consistent across tasks.
