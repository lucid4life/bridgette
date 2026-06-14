<script lang="ts">
  // /romance/guide — the Romance study guide: a read-through of every dish, its
  // plate, and the one-sentence romance to say at the drop. Pure reference — no
  // grading, no SRS. On screen it's a cream paper sheet in BOTH themes with the
  // plate beside each line; in print the theme tokens collapse to black ink on
  // white and the photos drop out, leaving a tight name + romance sheet for the
  // apron pocket. (Built on the /playbook/cram printable pattern.)
  import DishPhoto from '$lib/components/session/DishPhoto.svelte';
  import { data } from '$lib/data/index';
  import { romanceGuide } from '$lib/journey/items';

  const groups = romanceGuide();
  const total = groups.reduce((n, g) => n + g.dishes.length, 0);
  const catLabel = (c: string) => (c === 'Matinee / Late Night' ? 'Matinee' : c);
</script>

<svelte:head><title>Romance the menu · study guide · Bridgette Trainer</title></svelte:head>

<section class="screen guide">
  <div class="toolbar no-print">
    <a class="back" href="/romance">← back to the drill</a>
    <button class="btn" type="button" onclick={() => window.print()}>Print</button>
  </div>

  <div class="sheet on-cream">
    <header class="g-head">
      <p class="src">bridgette bar · romance the dish · say it at the drop</p>
      <h1>the romance guide</h1>
      <p class="hint">
        {total} plates · the dish, plus the line to say as you set it down — read it through, then say each one out loud.
      </p>
    </header>

    {#each groups as g (g.category)}
      <section class="cat">
        <h2>{catLabel(g.category)}</h2>
        {#each g.dishes as d (d.id)}
          <article class="dish">
            <div class="d-photo no-print" aria-hidden="true">
              <DishPhoto photoId={d.photoId} name={d.name} />
            </div>
            <div class="d-text">
              <p class="d-name">{d.name}</p>
              <p class="d-romance">{d.romance}</p>
            </div>
          </article>
        {/each}
      </section>
    {/each}

    <footer class="g-foot">
      <p class="g-confirm">{data.confirm.allergens}</p>
    </footer>
  </div>
</section>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    max-width: 760px;
    margin: 0 auto 14px;
  }
  .back {
    font-size: 14px;
    font-weight: 700;
    color: var(--accent-text);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--accent-text) 45%, transparent);
    text-underline-offset: 3px;
  }
  .back:hover {
    text-decoration-color: var(--accent-text);
  }

  .sheet {
    max-width: 760px;
    margin: 0 auto;
    background: var(--bb-paper);
    color: var(--text-body);
    border-top: 3px solid var(--flash-edge);
    border-radius: var(--radius-flash);
    padding: 26px 30px 24px;
    box-shadow: var(--shadow-2);
  }
  .g-head {
    margin-bottom: 18px;
  }
  .src {
    margin: 0 0 2px;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-label);
  }
  .sheet h1 {
    font-size: clamp(26px, 3.4vw, 36px);
    margin: 0 0 6px;
  }
  .hint {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--text-muted);
    max-width: 52ch;
  }

  .cat {
    margin: 0 0 18px;
  }
  .cat h2 {
    margin: 0 0 10px;
    font-size: 18px;
    letter-spacing: 0.04em;
    padding-bottom: 3px;
    border-bottom: 1.5px solid var(--text-strong);
  }
  .dish {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 0;
    border-top: 1px solid color-mix(in srgb, var(--highlight-line) 45%, transparent);
  }
  .dish:first-of-type {
    border-top: 0;
  }
  .d-photo {
    flex: none;
    width: 68px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: var(--shadow-1);
  }
  .d-text {
    flex: 1;
    min-width: 0;
  }
  .d-name {
    margin: 0;
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--text-strong);
  }
  .d-romance {
    margin: 3px 0 0;
    font-size: 14px;
    font-style: italic;
    line-height: 1.5;
    color: var(--text-body);
  }

  .g-foot {
    margin-top: 6px;
    padding-top: 12px;
    border-top: 1px solid color-mix(in srgb, var(--highlight-line) 45%, transparent);
  }
  .g-confirm {
    margin: 0;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }

  /* ---- print: black ink on white, photos drop out, tight name + romance ---- */
  @page {
    margin: 12mm;
  }
  @media print {
    :global(html),
    :global(html[data-theme='dark']),
    :global(html[data-theme='light']),
    :global(html:not([data-theme])) {
      color-scheme: light;
      --surface-canvas: #fff;
      --surface-paper: #fff;
      --text-strong: #000;
      --text-body: #000;
      --text-muted: #000;
      --text-label: #000;
      --accent-text: #000;
      --highlight-line: #000;
      --shadow-1: none;
      --shadow-2: none;
      --shadow-flash: none;
    }
    :global(body) {
      background: #fff;
      color: #000;
    }
    :global(.app .sidebar),
    :global(.app .topbar),
    :global(.app .tabbar),
    :global(.toast-stack),
    :global(.skip-link) {
      display: none !important;
    }
    :global(.app) {
      display: block;
    }
    :global(.app .screen-wrap) {
      padding: 0;
      max-width: none;
    }
    .guide {
      animation: none;
    }
    .no-print {
      display: none !important;
    }
    .sheet {
      max-width: none;
      background: #fff;
      color: #000;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      padding: 0;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 10pt;
      line-height: 1.35;
    }
    .sheet h1 {
      font-size: 19pt;
      margin: 0 0 4pt;
      font-family: inherit;
      font-weight: 700;
    }
    .src {
      font-family: inherit;
      font-size: 8.5pt;
      color: #000;
    }
    .cat {
      margin: 0 0 8pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .cat h2 {
      font-size: 12pt;
      font-family: inherit;
      font-weight: 700;
      letter-spacing: 0;
      margin: 0 0 3pt;
      border-bottom: 1.2pt solid #000;
    }
    .dish {
      display: block;
      padding: 2.5pt 0;
      border-top: 0.5pt solid #000;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .dish:first-of-type {
      border-top: 0;
    }
    .d-name {
      font-family: inherit;
      font-size: 10pt;
      font-weight: 700;
      display: inline;
    }
    .d-romance {
      font-size: 9.5pt;
      font-style: italic;
      margin: 1pt 0 0;
    }
  }
</style>
