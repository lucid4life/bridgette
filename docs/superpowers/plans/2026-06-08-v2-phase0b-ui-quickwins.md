# Phase 0b — UI Quick-Wins (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Three low-risk, high-value UI fixes that need no data or card-id changes: restore 2 dishes silently dropped from the pairing matrix, resurrect the well-written-but-invisible `familiar` substitution copy (plus pronunciation) on the Reference Translator card, and replace the demotivating "3% shift-ready" early-state with encouraging-but-honest copy.

**Architecture:** Pure Svelte 5 component edits in three route files. No engine, data, or card-id changes — so the frozen contract is untouched by construction. Each change is gated by svelte-check + Vitest (card-id snapshot must stay green) + production build + the Playwright axe-per-route e2e.

**Tech Stack:** SvelteKit / Svelte 5 runes, Vitest, Playwright + @axe-core/playwright.

**Note:** The emoji→line-icon swap (spec §10) is intentionally deferred to Phase 1e (visual polish) so the icon shapes get visual verification.

**Verification gate (run after each task, from repo root):**
```bash
cd app && npm test && npx svelte-check --tsconfig ./tsconfig.json && npm run build && npx playwright test
```
Expected: Vitest all pass (incl. card-id snapshot — must be unchanged), svelte-check 0/0, build OK, Playwright (smoke + axe-per-route + offline) all pass. (If Playwright can't run in this environment, run the first three and note it.)

---

### Task 1: Reference — restore matrix dishes + enrich the Translator card

**Files:**
- Modify: `app/src/routes/reference/+page.svelte`

- [ ] **Step 1: Restore the 2 dropped matrix dishes.** On line 57, remove the `.slice(0, 40)` so all dishes with a wine pairing render (it currently drops Chocolate Pot de Crème + Matinee Snack Menu — 42 rows truncated to 40).

Change:
```ts
  const matrixRows = $derived(data.foods.filter((f) => f.wine).slice(0, 40));
```
to:
```ts
  const matrixRows = $derived(data.foods.filter((f) => f.wine));
```

- [ ] **Step 2: Add a name→wine lookup** so the Translator card can show the by-the-glass pour's pronunciation. Add this line in the `<script>`, right after the `translatorRows` derived block (after line ~84):
```ts
  // Join a translator row's bestGlass back to the wine for pronunciation (the existing
  // speak()/speaking machinery is reused). Surfaces the previously-dead `familiar` copy.
  const wineByName = new Map(data.wines.map((w) => [w.name, w] as const));
```

- [ ] **Step 3: Rewrite the Translator card body** to surface `familiar` + the pour's respelling and 🔊 button. Replace the current `{#each translatorRows ...}` article (lines ~212–220) with:
```svelte
      {#each translatorRows as t (t.ask)}
        {@const gw = wineByName.get(t.bestGlass)}
        <article class="card light">
          <h3>{t.ask}</h3>
          <div class="winecard-head">
            <p class="winecard-body" style="margin:0">By the glass → <strong>{t.bestGlass}</strong></p>
            {#if gw}
              <button
                class="speak"
                type="button"
                aria-pressed={speaking === gw.id}
                aria-label={'Hear ' + gw.name + ' pronounced'}
                onclick={() => speak(gw)}
              >🔊</button>
            {/if}
          </div>
          {#if gw}<p class="winecard-pron meta">Say: <strong>{gw.pronunciation.respell}</strong></p>{/if}
          {#if t.familiar}<p class="meta">Same lane: {t.familiar}</p>{/if}
          {#if t.bottleOptions?.length}<p class="meta upgrade-line">Bottle upgrade → <strong>{t.bottleOptions.join(', ')}</strong></p>{/if}
          {#if t.different}<p class="meta winecard-profile">Point of difference: {t.different}</p>{/if}
          <p class="meta">{t.phrase}</p>
        </article>
      {/each}
```
(The `.speak`, `.winecard-head`, `.winecard-pron` classes already exist; `speak()`, `speaking`, and `playPronunciation` are already imported/defined. `gw` is undefined for any row whose bestGlass isn't a by-the-glass wine — the `{#if gw}` guards handle that gracefully.)

- [ ] **Step 4: Verify.** Run the gate. Then in a browser (`cd app && npm run dev`, open `/reference`): click **Translator** — every card now shows a "Say: …" respelling, a working 🔊 button, and a "Same lane: …" line; click **Pairing matrix** and confirm Chocolate Pot de Crème + Matinee Snack Menu now appear. Confirm Vitest card-id snapshot still passes (no card-id touched) and Playwright axe-per-route passes for `/reference`.

- [ ] **Step 5: Commit.**
```bash
git add app/src/routes/reference/+page.svelte
git commit -m "feat(v2): Reference Translator shows the 'familiar' pivot + pronunciation; restore 2 dropped matrix dishes (sweep + consultant)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Today — kinder, still-honest early-state copy

**Files:**
- Modify: `app/src/routes/today/+page.svelte`

**Problem:** Once you've graded any card, the Shift-ready card shows a stark estimate (e.g. "3%") with the flat label "Estimate from deck mastery" — demotivating exactly when encouragement matters. Fix: keep the honest number, but contextualize a *low early estimate* (when no real Readiness Check has been taken yet) with encouraging copy. Do NOT change the number.

- [ ] **Step 1: Replace the Shift-ready meta line** (line 66). Change:
```svelte
        <p class="meta">{progressStore.readiness ? 'From your last Readiness Check' : 'Estimate from deck mastery'}</p>
```
to:
```svelte
        <p class="meta">
          {#if progressStore.readiness}From your last Readiness Check
          {:else if shiftReady < 25}Early days — this climbs fast as you learn. Run a quick check anytime.
          {:else}Estimate from deck mastery{/if}
        </p>
```

- [ ] **Step 2: Verify.** Run the gate. In a browser, confirm: a brand-new-but-just-started account (low estimate, no Readiness Check) shows the encouraging line instead of the flat "Estimate from deck mastery"; once a Readiness Check is taken, it reads "From your last Readiness Check"; a higher estimate (≥25, no check) still reads "Estimate from deck mastery". The percentage itself is unchanged in all cases.

- [ ] **Step 3: Commit.**
```bash
git add app/src/routes/today/+page.svelte
git commit -m "fix(v2): encouraging (still honest) Today copy for a low early shift-ready estimate (consultant)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:** matrix truncation (spec §11/§9) → T1 S1; surface `familiar` + pronunciation on the substitution surface (spec §8/§14 Phase 0) → T1 S2–S3; kinder empty/early state (spec §8/§14) → T2. Emoji→icons (spec §10) explicitly deferred to Phase 1e (noted). ✅

**Placeholder scan:** every step has exact before/after code + a runnable gate + a browser check. No TBDs.

**Type/contract consistency:** `wineByName` is `Map<string, Wine>`; `gw` is `Wine | undefined`, guarded by `{#if gw}`. `speak(w)` already accepts `(typeof data.wines)[number]`, which `gw` (narrowed by the guard) satisfies. No card-id, data, or engine change — the Vitest card-id snapshot proves the frozen contract holds.

---

## Execution Handoff
Two small, independent UI tasks — can be done by one implementer subagent with two separate commits, or two. Recommended model: standard.
