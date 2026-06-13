<script lang="ts">
  // Task J — /playbook/cram: the printable Menu Cram. Deliberately plain,
  // ink-on-paper: one compact section per menu category, every dish one tight
  // row (name+price · components · allergen abbreviations). On screen it is a
  // cream paper sheet in BOTH themes (.on-cream scope + explicit background);
  // in print the theme tokens collapse to black-on-white. Ported from v2's
  // reference/cram print approach.
  import { data } from '$lib/data/index';
  import type { Food } from '$lib/data/types';

  // Group by menu category in the data's natural order (Snacks → Matinee /
  // Late Night). ALL 42 records make the sheet — the matinee meta-entry has no
  // ingredients, so its `menu` availability line stands in for components.
  const sections: { name: string; dishes: Food[] }[] = [];
  for (const f of data.foods) {
    let sec = sections.find((s) => s.name === f.category);
    if (!sec) {
      sec = { name: f.category, dishes: [] };
      sections.push(sec);
    }
    sec.dishes.push(f);
  }

  const catLabel = (c: string) => (c === 'Matinee / Late Night' ? 'Matinee' : c);
  const price = (p: string) => (/^\d/.test(p) ? '$' + p : p);
  const abbr = (allergens: string[]) => allergens.map((a) => a.toUpperCase()).join(' · ');

  // Two sheets, one page: the reference cram (read it) and the self-test sheet
  // (names left, answers in a right column behind a fold line — fold the paper
  // or cover the right half and quiz yourself dish by dish).
  let mode = $state<'reference' | 'selftest'>('reference');
</script>

<svelte:head><title>Menu Cram · Bridgette Trainer</title></svelte:head>

<section class="screen cram">
  <div class="toolbar no-print">
    <a class="back" href="/playbook">← back to the playbook</a>
    <div class="tb-actions">
      <div class="mode-switch" role="group" aria-label="Sheet style">
        <button type="button" class="mode" aria-pressed={mode === 'reference'} onclick={() => (mode = 'reference')}>reference</button>
        <button type="button" class="mode" aria-pressed={mode === 'selftest'} onclick={() => (mode = 'selftest')}>self-test</button>
      </div>
      <button class="btn" type="button" onclick={() => window.print()}>Print</button>
    </div>
  </div>

  <div class="sheet on-cream" class:selftest={mode === 'selftest'}>
    <header class="cram-head">
      <p class="src">bridgette bar · official food syllabus · june 2026</p>
      <h1>menu cram</h1>
      <p class="hint no-print">
        {mode === 'selftest'
          ? 'fold along the dotted line (or cover the right column) and name each dish — then check.'
          : 'print me — letter, portrait, 100%. it lives in your apron pocket.'}
      </p>
      <p class="confirm">{data.confirm.allergens}</p>
    </header>

    {#each sections as sec (sec.name)}
      <section class="cat">
        <h2>{catLabel(sec.name)}</h2>
        {#each sec.dishes as f (f.id)}
          <p class="dish">
            <span class="q-side"><b class="nm">{f.name}</b>
              <span class="price">{price(f.price)}</span></span>
            <span class="answer">
              {#if f.ingredients?.length}
                <span class="comps">— {f.ingredients.join(', ')}</span>
              {:else if f.menu}
                <span class="comps">— {f.menu}</span>
              {/if}
              {#if f.allergens?.length}
                <span class="allerg"><span class="visually-hidden">Allergens: </span>{abbr(f.allergens)}</span>
              {/if}
              {#if f.allergenNote}<span class="anote">({f.allergenNote})</span>{/if}
              {#if f.vegan === true}<span class="veg">VEGAN</span>{/if}
            </span>
          </p>
        {/each}
      </section>
    {/each}
  </div>
</section>

<style>
  /* ---- screen: a cream paper sheet on the canvas, both themes ---- */
  .toolbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; max-width: 860px; margin: 0 auto 14px;
  }
  .back {
    font-size: 14px; font-weight: 700; color: var(--accent-text);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--accent-text) 45%, transparent);
    text-underline-offset: 3px;
  }
  .back:hover { text-decoration-color: var(--accent-text); }
  .tb-actions { display: flex; align-items: center; gap: 10px; }
  .mode-switch { display: flex; gap: 0; border: 1px solid var(--line); border-radius: var(--radius-chip); overflow: hidden; }
  .mode {
    padding: 7px 14px; background: var(--surface-card); color: var(--text-body);
    font-size: 12.5px; font-weight: 700; text-transform: lowercase; min-height: 34px; border: 0;
  }
  .mode[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); }

  .sheet {
    max-width: 860px; margin: 0 auto;
    background: var(--bb-paper); color: var(--text-body);
    border-top: 3px solid var(--flash-edge); /* the printed menu's coral rule */
    border-radius: var(--radius-flash);
    padding: 26px 30px 30px;
    box-shadow: var(--shadow-2);
  }
  .cram-head { margin-bottom: 16px; }
  .src {
    margin: 0 0 2px; font-family: var(--font-display); font-size: 12px;
    font-weight: 700; text-transform: uppercase; letter-spacing: .12em;
    color: var(--text-label);
  }
  .sheet h1 { font-size: clamp(26px, 3.4vw, 36px); margin: 0 0 6px; }
  .hint { margin: 0 0 10px; font-size: 13px; color: var(--text-muted); }
  /* the non-negotiable, ONCE, prominently at the top — screen and paper */
  .confirm {
    margin: 0; padding: 8px 12px; font-weight: 700; font-size: 14px;
    border: 1.5px solid var(--text-strong); border-radius: 6px;
  }

  .cat { margin: 0 0 14px; }
  .cat h2 {
    margin: 0 0 4px; font-size: 18px; letter-spacing: .04em;
    padding-bottom: 2px; border-bottom: 1.5px solid var(--text-strong);
  }
  .dish {
    margin: 0; padding: 3px 0; font-size: 13.5px; line-height: 1.45;
    border-top: 1px solid var(--line);
  }
  .dish:first-of-type { border-top: 0; }
  .nm { color: var(--text-strong); }
  .price { font-weight: 700; color: var(--text-strong); white-space: nowrap; }
  .comps { color: var(--text-body); }
  .allerg {
    font-weight: 800; font-size: 11px; letter-spacing: .05em;
    color: var(--bb-ember-deep); white-space: nowrap;
  }
  .anote { font-size: 12px; color: var(--text-muted); }
  .veg { font-weight: 800; font-size: 11px; letter-spacing: .05em; color: var(--ok); }

  /* ---- self-test: name left, answers right, behind a dotted FOLD line ----
     Fold the paper (or cover the right half) and name each dish before checking. */
  .sheet.selftest .dish {
    display: grid;
    grid-template-columns: minmax(38%, 0.9fr) 1.1fr;
    column-gap: 0;
    align-items: baseline;
  }
  .sheet.selftest .q-side { padding-right: 12px; }
  .sheet.selftest .answer {
    padding-left: 14px;
    border-left: 1.5px dashed var(--text-muted);
  }
  /* the fold line spans the whole section in self-test — a continuous guide */
  .sheet.selftest .cat { position: relative; }

  /* ---- print: black ink on white paper, compact, sections never split ---- */
  @page { margin: 12mm; }
  @media print {
    /* Override the theme tokens for print ONLY (explicit light/dark + the auto
       block), so every token-consuming rule resolves to plain ink-on-paper. The
       light variant is needed because bare `html` (0,0,1) loses to the `:root`
       token block (0,1,0). */
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
      --text-label: #000;
      --accent-text: #000;
      --line: #000;
      --grain: none;
      --shadow-1: none;
      --shadow-2: none;
      --shadow-3: none;
      --shadow-flash: none;
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

    .cram { animation: none; }
    .no-print { display: none !important; }

    .sheet {
      max-width: none; background: #fff; color: #000;
      border: 0; border-radius: 0; box-shadow: none; padding: 0;
      font-family: Georgia, 'Times New Roman', serif; font-size: 10pt; line-height: 1.3;
    }
    .cram-head { margin-bottom: 8pt; }
    .src { font-family: inherit; font-size: 8.5pt; letter-spacing: .08em; color: #000; margin: 0 0 1pt; }
    .sheet h1 { font-size: 19pt; margin: 0 0 4pt; font-family: inherit; font-weight: 700; letter-spacing: 0; }
    .confirm { border: 1.5pt solid #000; border-radius: 0; padding: 4pt 7pt; font-size: 10.5pt; }

    .cat { margin: 0 0 7pt; break-inside: avoid; page-break-inside: avoid; }
    .cat h2 {
      font-size: 12pt; font-family: inherit; font-weight: 700; letter-spacing: 0;
      margin: 0 0 2pt; padding-bottom: 1pt; border-bottom: 1.2pt solid #000;
      text-transform: none;
    }
    .dish { font-size: 9.5pt; padding: 1.5pt 0; border-top: 0.5pt solid #000; break-inside: avoid; page-break-inside: avoid; }
    .dish:first-of-type { border-top: 0; }
    .price { font-weight: 700; }
    .allerg { font-size: 8.5pt; font-weight: 700; color: #000; }
    .anote { font-size: 8.5pt; color: #000; }
    .veg { font-size: 8.5pt; color: #000; }

    /* self-test prints with the fold column intact */
    .sheet.selftest .dish { display: grid; grid-template-columns: minmax(40%, 0.9fr) 1.1fr; align-items: baseline; }
    .sheet.selftest .q-side { padding-right: 8pt; }
    .sheet.selftest .answer { padding-left: 8pt; border-left: 1pt dashed #000; }
  }
</style>
