# V3 — Dish photos on every card + authored "romance" lines + a romance study guide

**Date:** 2026-06-14
**App:** `app-v3/` only (SvelteKit PWA, deploys to bridgette-v3.vercel.app on push to `v2-app`).
**Status:** Design — approved decisions captured below; spec under user review before plan.

---

## 1. Goal

When Adrian studies food flashcards he should **see the plate on every card** (the way he sees it at the drop in real life), and on the **answer side of every dish card** he should get a **one-sentence "romance"** — the dish name plus **≥3 real key ingredients** in warm, sensory, memorizable language — that he can learn and recite when he sets the plate down. Plus a **read-through study guide** listing every dish name + its romance line.

### Success criteria
- Every dish-anchored study/practice card (dish, allergen, pairing) shows the dish photo on the **prompt** (branded placeholder when no photo exists). 28/41 path dishes already have photos.
- Every **dish** card's answer side shows the authored romance line ("say it like this →").
- All ~41 path dishes have an authored, **verified** romance line (name + ≥3 real components, warm register, no false/oversell/allergen-safe claims).
- The `/romance` drill and Romance Exam quote the authored romance as the model line.
- `/romance/guide` lists every dish: photo + name + romance, grouped by menu category, printable.
- v2 (`app/`) stays byte-untouched. All existing tests stay green; new pure-layer + e2e/axe coverage added.

---

## 2. Decisions (locked with the user)

| # | Decision | Choice |
|---|----------|--------|
| D1 | Photo timing | **Always visible on the prompt** (study/practice surfaces) |
| D2 | Card scope for the photo | **All dish-anchored cards** — dish, allergen, pairing |
| D3 | Romance use | Show on answer + study guide **+ feed the `/romance` drill & exam** |
| D4 | Tone register | **Warm & natural** |
| D5 | Photo on graded surfaces (`/romance/exam`, mock `/test`) | **Reveal-only** (never on the prompt — must not inflate a readiness score) |
| D6 | Romance content home | **v3-only journey overlay** `app-v3/src/lib/journey/romance.ts` |
| D7 | Study guide route | **`/romance/guide`** (sibling to `/romance/exam`) |
| D8 | Authoring scope | All **41 path dishes** (+ any other food with official `ingredients`, e.g. `sorbet`); **exclude** `matinee-snack-menu` (menu-section placeholder, no plate) |

---

## 3. Constraints

- **v2 isolation:** `app/` must remain byte-untouched. Romance content therefore lives in a v3 journey overlay, **not** in shared `src/data.js` (which `tools/build_app_data.mjs` compiles into *both* apps). No new build step.
- **OneDrive / parallel-session hazard:** repo lives in OneDrive and may be shared with a parallel Claude session on the same working tree + `.git`. Re-read files before edit; confirm sync settled + `git fetch` before any write-back. **Do not mutate local git** (no checkout/branch/reset/commit) if a parallel actor is present — land commits via the **GitHub Data API**, as established for prior v3 batches. v2 `app/` byte-untouched throughout (no Vercel collision).
- **Accessibility:** maintain WCAG AA (axe green in both themes). Photos need real `alt`; the romance line must be a real text node (SR-readable), not decorative.
- **Grading unchanged:** romance/exam grade on `named + min(3, components)` exactly as today; the authored romance is the *model line to recite*, not a new grading target. SRS write paths untouched.
- **Allergen safety untouched:** the existing allergen framing + confirm line stay exactly as-is; the romance line never makes an allergen-safe claim.

---

## 4. Architecture overview

Three additive layers, no structural rewrites:

1. **Data:** new overlay `journey/romance.ts` → `ROMANCE: Record<foodId, string>`, validated at module init (hard-fail if a path dish lacks one, mirroring `key-components.ts` + the `memoryHook`/`description` init guards).
2. **Content accessors (`journey/items.ts`):** thread `photoId` into the food-anchored MC + cued/free reveal accessors, and `romance` into the dish cued/free + `RomanceContent`.
3. **Components/routes:** `DishPhoto` gains a compact "prompt thumbnail" treatment; `FlashMc` + `FlashReveal` gain optional photo (prompt) + romance (reveal); `RomanceCard`/`RomanceExamCard`/`TeachCard` surface the romance line; new `/romance/guide` route.

---

## 5. Data design — the romance overlay

`app-v3/src/lib/journey/romance.ts`:

```ts
/** foodId → the one-sentence guest-facing romance (warm register, names >=3
 *  real components incl. the one in the dish name; no oversell / no allergen-safe
 *  claim). Authored from each dish's official name + ingredients + description +
 *  KEY_COMPONENTS, adversarially verified (see §6). v3-only — never touches v2. */
export const ROMANCE: Record<string, string> = { /* 41 entries */ };
```

- Consumed via `ROMANCE[foodId]` (same shape of lookup as `KEY_COMPONENTS[foodId]`).
- **Init validation** in `items.ts` (where the existing dish init guard lives): every path dish must have a non-empty `ROMANCE` entry that (a) is one sentence, (b) contains the dish name's hero token, (c) names ≥3 official components (or all, when the dish has <3). Hard-fail loud — a content drift can never ship a silent gap.
- `romanceFor()` gains `romance: ROMANCE[f.id]`; `RomanceContent` gains `romance: string`. The official `description` stays as the secondary `modelLine`.

---

## 6. Romance-writing method (how the 41 lines are authored)

**Formula:** `Here's the [DISH] — [technique] [hero], [second ingredient], and [finishing flourish].` Name the dish first (usually = ingredient #1) → 2 more real components → one sensory/technique word each, layered *method → texture → finish* → land on the flourish. One sentence, rule-of-three, said at the drop. (Source: synthesized romance playbook, `sell-the-sizzle` lineage + menu-romance-copy research, 2026-06-14.)

**Guardrails (enforced per line):**
- Every named ingredient is a verbatim/normalized member of that dish's official `ingredients`.
- No invented facts; provenance/technique only where the official `description` states it (e.g. *Vancouver Island* octopus, *five-day* dough — both literally true).
- Banned: *delicious, tasty, decadent, sinful, to-die-for, cooked-to-perfection, melt-in-your-mouth*, and **any absolute allergen-safe / health claim**.
- One sentence, reads cleanly aloud (no tongue-twister consonant stacks), names ≥3 components (or all for 1–2-component plates like the fries / bread & butter).

**Authoring process (implementation, post-approval):** a `Workflow` pipeline over the 41 dishes — per dish: **draft** (grounded in name + ingredients + description + KEY_COMPONENTS + the playbook) → **adversarial verify** (ingredient-truth, banned-word, false-claim, sayability, ≥3-count) → revise on fail. Output is the `ROMANCE` map. A final completeness pass confirms 41/41 present and valid.

**Approved samples (warm register):**
- Grilled Octopus Salad — *Here's the grilled octopus salad — octopus braised tender and charred over the wood fire, tossed with shaved fennel and sweet orange in a sherry-soy vinaigrette.*
- Spiced Beet Salad — *This is the spiced beet salad — warm-spiced beets resting on cool whipped feta, finished with pickled shallots and toasted pistachio.*
- Margherita — *Here's the Margherita — our five-day wood-fired dough under house-made tomato sauce, milky fior di latte, and just-torn basil.*
- Snap Peas — *Here's the snap peas — crisp snap peas and shaved fennel in a creamy, spicy 'nduja dressing, finished with shaved pecorino and a bacon gremolata.*
- Tuna Crudo — *This is the tuna crudo — ahi tuna cured thin over a smoked tonnato, lifted by a bright puttanesca vinaigrette and finished with fried capers and torn mint.*

---

## 7. Surfacing the photo + romance

### 7a. Photo on the prompt (D1, D2, D5)
- **`DishPhoto.svelte`** gains a compact prompt treatment (a centered, rounded plate thumbnail ~160–200px) alongside the existing `framed` (240px reveal) and bare (full-bleed teach) variants — e.g. a `variant: 'thumb' | 'framed' | 'bare'` (or a `size` prop). Placeholder behavior unchanged.
- **`FlashMc.svelte`** + **`FlashReveal.svelte`** gain an optional `photoId` (+ a placement flag, see below). When present on the **prompt**, render `DishPhoto` (thumb) above the `.q` question.
- **Accessors (`items.ts`)** expose `photoId` (= foodId) on the food-anchored returns: `mcFor`/`allergenMcFor`/`pairingMcFor` (MC) and `cuedFor`/`freeFor` (cued/free). `wine`/`build` returns omit it → no photo.
- **Placement rule (D5):** the photo renders on the **prompt** for practice surfaces and on the **reveal** for graded ones. Implementation: a `photoOnPrompt` (default true) flag passed by the route; graded routes pass it false (or simply route the photo to the reveal slot).
  - **Prompt photo:** `/unit/[unitId]` (pretest MC, quiz MC, cued, free, teach), `/romance` drill, `/preshift`, `/burst`, `/playbook`.
  - **Reveal-only photo:** `/romance/exam` (already reveal-only via `RomanceExamCard` — no change) and the mock `/test` (ensure its question components do **not** receive the prompt photo).

### 7b. Romance on the answer (D3)
- **`FlashReveal.svelte`** gains optional `romance`; rendered inside `.rv` as a distinct **"say it like this →"** line (own style, above/near the allergen framing), for **dish** cued/free only. `cuedFor`/`freeFor` pass `romance` for `kind === 'dish'` only (allergen/pairing/wine/build omit it).
- **`RomanceCard.svelte`** + **`RomanceExamCard.svelte`:** the authored `romance` becomes the headline model line to recite; the official `description` is demoted to small secondary reference. Pass bar + grading unchanged.
- **`TeachCard.svelte`:** add the romance line to the dish teach page (the "dish description card") near the description, styled as the say-it model.
- **`/romance` drill prompt:** moves the plate photo to the prompt (you see the plate as you would at the drop), with the pass bar + romance model on the reveal. (Flagged for user confirmation in spec review.)

### 7c. Study guide — `/romance/guide` (D7)
- New route `app-v3/src/routes/romance/guide/+page.svelte`, a **read-through reference** (no grading, no SRS writes), built on the `/playbook/cram` printable pattern (cream both themes, black-on-white `@media print`, `@page`).
- Lists every romanceable dish **grouped by menu category**, each row: **plate photo (or placeholder) + dish name + the one-sentence romance**. Reuses `.card`/`.grid`/`.pill` tokens + `DishPhoto`.
- Linked from **Today's "This week" card**, plus a link atop `/romance` and `/playbook`.
- Order: menu-category order (stable, study-friendly) — not SRS-shaky order (this is a read-through, not a drill).

---

## 8. Files touched (all under `app-v3/`, plus this doc)

**New:**
- `src/lib/journey/romance.ts` (the overlay)
- `src/routes/romance/guide/+page.svelte` (study guide)
- tests: `romance.test.ts` (overlay validity/coverage), guide e2e, photo-on-prompt e2e

**Edited:**
- `src/lib/journey/items.ts` — `photoId` on food-anchored MC + cued/free; `romance` on dish cued/free + `RomanceContent`; `romanceFor` wires `romance`; init validation for `ROMANCE`.
- `src/lib/components/session/DishPhoto.svelte` — compact `thumb` variant.
- `src/lib/components/session/FlashMc.svelte` — optional prompt photo.
- `src/lib/components/session/FlashReveal.svelte` — optional prompt photo + `romance` reveal line.
- `src/lib/components/session/RomanceCard.svelte`, `RomanceExamCard.svelte`, `TeachCard.svelte` — surface `romance`; RomanceCard plate-on-prompt.
- `src/routes/unit/[unitId]/+page.svelte` — pass `photoId`/`romance` to FlashMc/FlashReveal.
- `src/routes/romance/+page.svelte`, `src/routes/preshift/+page.svelte`, `src/routes/burst/+page.svelte` — pass prompt `photoId`.
- `src/routes/test/+page.svelte` — ensure prompt photo is **off** (reveal-only).
- `src/routes/today/+page.svelte`, `src/routes/playbook/+page.svelte` — link to `/romance/guide`.

---

## 9. Testing

- **Pure layer (vitest):** `ROMANCE` covers all 41 path dishes; each line names ≥3 real components (or all when <3), contains no banned token, contains the dish-name hero, is one sentence. `romanceFor`/`cuedFor`/`freeFor` carry `romance`/`photoId` for the right kinds and omit them for wine/build. Init guard throws on a missing/invalid romance.
- **e2e (Playwright + axe):** photo renders on the prompt for a dish unit card; romance line renders on a dish reveal; `/romance/guide` renders all dishes + is axe-clean in both themes; graded `/test` + `/romance/exam` show **no** prompt photo.
- Full existing suite stays green (currently ~910 vitest / ~100 e2e at HEAD).

---

## 10. Out of scope (YAGNI)

- No new photos sourced/added in this work (placeholder covers the ~13 without). Photo-sourcing is a separate effort (existing shot-list).
- No change to allergen content, SRS scheduling, grading thresholds, or pairing/wine/build content.
- No romance lines for `matinee-snack-menu`.
- No audio/teleprompter for romance (the existing `/romance` say-it flow already covers spoken practice).

---

## 11. Risks & mitigations

- **Guest-facing wording accuracy** → adversarial verification per line + the study guide is the human-reviewable artifact (user reviews the full 41 before they're "trusted").
- **Prompt photo revealing a "what's in it" answer** → accepted by the user (D1); realistic to the drop. Mitigated on graded surfaces by D5.
- **v2 drift** → overlay-only; no `src/data.js` edit; `app/` untouched; verify via `git status` that no `app/` file changed.
- **OneDrive race** → land commits via GitHub Data API; re-read before edit.
