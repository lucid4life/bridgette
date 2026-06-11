<script lang="ts">
  import { data } from '$lib/data/index';
  import type { Food } from '$lib/data/types';

  // Group dishes by menu category in the data's natural order (Snacks → Dessert).
  // Foods without official `ingredients` are skipped — that drops the
  // matinee-snack-menu meta-item (and its "Matinee / Late Night" pseudo-category).
  const sections: { name: string; dishes: Food[] }[] = [];
  for (const f of data.foods) {
    if (!f.ingredients?.length) continue;
    let sec = sections.find((s) => s.name === f.category);
    if (!sec) {
      sec = { name: f.category, dishes: [] };
      sections.push(sec);
    }
    sec.dishes.push(f);
  }

  // One-line description = first sentence of the official text. The lookahead
  // (space or end after the stop) keeps decimals/abbreviations from truncating.
  function firstSentence(s: string): string {
    const m = s.match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : s;
  }
</script>

<svelte:head><title>Food Cram · Bridgette Training</title></svelte:head>

<section class="screen cram">
  <header class="cram-head">
    <p class="h-eyebrow">Reference · Cram sheet</p>
    <h1>Bridgette Bar — Food Cram</h1>
    <p class="src">Official Food Syllabus · June 2026</p>
    <p class="compliance">Allergen flags from the official syllabus. ALWAYS confirm with the kitchen before promising a guest.</p>
    <button class="btn no-print" type="button" onclick={() => window.print()}>Print</button>
  </header>

  {#each sections as sec (sec.name)}
    <section class="cat">
      <h2>{sec.name}</h2>
      {#each sec.dishes as f (f.id)}
        <article class="dish">
          <h3 class="dish-name">{f.name} <span class="price">${f.price}</span></h3>
          <p class="comps">{#each f.ingredients ?? [] as ing, i}{#if i > 0}{', '}{/if}{#if i < 3}<b>{ing}</b>{:else}{ing}{/if}{/each}</p>
          {#if f.allergens?.length || f.allergenNote || f.vegan === true}
            <p class="allerg">
              {#if f.allergens?.length}<span class="warn" aria-hidden="true">⚠</span><span class="visually-hidden">Allergens:</span> {f.allergens.join(' · ')}{/if}
              {#if f.allergenNote}<span class="note">({f.allergenNote})</span>{/if}
              {#if f.vegan === true}<span class="veg">(vegan)</span>{/if}
            </p>
          {/if}
          {#if f.description}<p class="desc">{firstSentence(f.description)}</p>{/if}
        </article>
      {/each}
    </section>
  {/each}

  <p class="footnote">Off-menu dairy-free option: Sorbet (rotating Noto Gelato flavour) — per syllabus, not on the printed menu.</p>
</section>

<style>
  /* ---- screen (phone read-through): native app look, token-routed, dark-safe ---- */
  .cram-head { margin-bottom: 18px; }
  .cram-head h1 { margin-bottom: 6px; }
  .src { margin: 0 0 6px; font-weight: 600; color: var(--text-muted); }
  .compliance { margin: 0 0 14px; font-size: 13px; color: var(--text-muted); max-width: 60ch; }
  .cat {
    background: var(--surface-card); border: 1px solid var(--line);
    border-radius: var(--radius-card); padding: 14px 18px 6px;
    box-shadow: var(--shadow-1); margin: 0 0 14px;
  }
  .cat h2 { margin: 0 0 2px; font-size: 20px; color: var(--text-strong); }
  .dish { padding: 10px 0; border-top: 1px solid var(--line); }
  .dish:first-of-type { border-top: 0; }
  .dish-name { margin: 0; font-size: 16px; color: var(--text-strong); }
  .price { font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--text-muted); }
  .comps { margin: 3px 0 0; font-size: 14px; }
  .comps b { color: var(--text-strong); } /* first three = the money components */
  .allerg { margin: 3px 0 0; font-size: 13px; color: var(--text-muted); }
  .allerg .warn { color: var(--accent-text); }
  .allerg .veg { font-weight: 700; }
  .desc { margin: 3px 0 0; font-size: 13px; color: var(--text-muted); }
  .footnote { margin: 4px 0 0; padding: 10px 14px; border: 1px dashed var(--line); border-radius: 10px; font-size: 13px; color: var(--text-muted); }

  /* ---- print: black ink on white paper, one category per page ---- */
  @page { margin: 14mm; }
  @media print {
    /* Override the theme tokens for print ONLY (explicit light/dark + the auto block),
       so every token-consuming rule resolves to plain ink-on-paper. The light variant
       is needed because bare `html` (0,0,1) loses to the `:root` token block (0,1,0). */
    :global(html),
    :global(html[data-theme='dark']),
    :global(html[data-theme='light']),
    :global(html:not([data-theme])) {
      color-scheme: light;
      --surface-canvas: #fff;
      --surface-bar: #fff;
      --surface-card: transparent;
      --surface-paper: #fff;
      --text-strong: #000;
      --text-body: #000;
      --text-muted: #000;
      --accent-text: #000;
      --line: #000;
      --grain: none;
      --shadow-1: none;
      --shadow-2: none;
      --shadow-3: none;
    }
    :global(body) { background: #fff; color: #000; }
    /* Hide the app shell chrome (sidebar / topbar / tabbar / PWA toasts / skip link). */
    :global(.app .sidebar),
    :global(.app .topbar),
    :global(.app .tabbar),
    :global(.toast-stack),
    :global(.skip-link) { display: none !important; }
    :global(.app) { display: block; }
    :global(.app .screen-wrap) { padding: 0; max-width: none; }

    .cram { animation: none; font-family: Georgia, 'Times New Roman', serif; font-size: 10.5pt; line-height: 1.35; }
    .no-print, .h-eyebrow { display: none !important; }
    .cram-head { margin-bottom: 10pt; }
    .cram-head h1 { font-size: 20pt; margin: 0 0 2pt; }
    .src { font-size: 10pt; margin: 0 0 2pt; }
    .compliance { font-size: 9.5pt; max-width: none; margin: 0; }
    .cat { background: transparent; border: 0; border-radius: 0; box-shadow: none; padding: 0; margin: 0; }
    /* Each category starts a fresh page (the header shares page 1 with Snacks). */
    .cat:not(:first-of-type) { break-before: page; page-break-before: always; }
    .cat h2 { font-size: 14pt; margin: 0 0 4pt; padding-bottom: 2pt; border-bottom: 1.5pt solid #000; }
    .dish { padding: 5pt 0; border-top: 0.5pt solid #000; break-inside: avoid; page-break-inside: avoid; }
    .dish:first-of-type { border-top: 0; }
    .dish-name { font-size: 11.5pt; font-family: inherit; }
    .price { font-family: inherit; font-size: 9.5pt; }
    .comps { font-size: 10.5pt; margin: 1pt 0 0; }
    .allerg { font-size: 9.5pt; margin: 1pt 0 0; }
    .desc { font-size: 9.5pt; margin: 1pt 0 0; }
    .footnote { border: 0; padding: 0; margin-top: 8pt; font-size: 9.5pt; break-inside: avoid; }
  }
</style>
