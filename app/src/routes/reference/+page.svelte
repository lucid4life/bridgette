<script lang="ts">
  import { data } from '$lib/data/index';
  import { langFor } from '$lib/engine/training.js';
  import { playPronunciation } from '$lib/audio/playPronunciation';
  import StructureMeter from '$lib/components/StructureMeter.svelte';

  type Filter = 'Wine' | 'Food' | 'Cocktails' | 'Translator' | 'Pairing matrix';
  const FILTERS: Filter[] = ['Wine', 'Food', 'Cocktails', 'Translator', 'Pairing matrix'];
  let filter = $state<Filter>('Wine');
  let q = $state('');
  let speaking = $state<string | null>(null);

  function speak(w: (typeof data.wines)[number]) {
    speaking = w.id;
    // truthful playing-state: cleared by the real audio 'ended'/speech onend, not a timer
    playPronunciation(w.id, w.pronunciation.say, langFor(w.country), () => {
      if (speaking === w.id) speaking = null;
    });
  }

  // multi-entry search: by name / grape / style / food / region (spec §5)
  const ql = $derived(q.trim().toLowerCase());
  const wines = $derived(
    data.wines.filter((w) => {
      if (!ql) return true;
      const hay = [w.name, w.grape, w.region, w.family, w.category, ...(w.tags ?? []), ...(w.pair ?? [])]
        .join(' ').toLowerCase();
      return hay.includes(ql);
    })
  );
  const matrixRows = $derived(data.foods.filter((f) => f.wine).slice(0, 40));

  // Decode the "5oz | 8oz | bottle" price string for the upsell ladder (UX-02).
  function priceLadder(price: string): { pour5: string; pour8: string; bottle: string } | null {
    const p = price.split('|').map((s) => s.trim());
    return p.length === 3 ? { pour5: p[0], pour8: p[1], bottle: p[2] } : null;
  }

  // Translator cue/alias search so "Meiomi", "Napa Cab", "Malbec" all resolve (CT-04).
  const translatorRows = $derived(
    data.translator.filter((t) => {
      if (!ql) return true;
      const hay = [t.ask, ...(t.aliases ?? []), t.bestGlass, ...(t.bottleOptions ?? [])]
        .join(' ').toLowerCase();
      return hay.includes(ql);
    })
  );
</script>

<svelte:head><title>Reference · Bridgette Training</title></svelte:head>

<section class="screen">
  <p class="h-eyebrow">Reference</p>
  <h1>Look it up fast</h1>
  <p class="sub">Filter to what you need — no endless scroll. Search by grape, style, food, or region.</p>

  <div class="chips" role="group" aria-label="Reference filter">
    {#each FILTERS as f}
      <button class="chip" type="button" aria-pressed={filter === f} onclick={() => { filter = f; q = ''; speaking = null; }}>{f}</button>
    {/each}
  </div>

  {#if filter === 'Wine'}
    <label class="search">
      <span class="visually-hidden">Search wines by grape, style, food, or region</span>
      <input type="search" bind:value={q} placeholder="Search grape, style, food, region…" autocomplete="off" />
    </label>
    <p class="meta" aria-live="polite" style="margin:0 0 12px">{wines.length} of {data.wines.length} wines</p>
    {#if wines.length}
    <div class="grid cols-2 on-cream">
      {#each wines as w (w.id)}
        {@const pl = priceLadder(w.price)}
        <article class="card light winecard">
          <div class="winecard-head">
            <h3 class="name">{w.name}</h3>
            <button
              class="speak"
              type="button"
              aria-pressed={speaking === w.id}
              aria-label={'Hear ' + w.name + ' pronounced'}
              onclick={() => speak(w)}
            >🔊</button>
          </div>
          <div class="meta">{w.grape} · {w.region}</div>
          {#if pl}<p class="price-ladder meta">5oz <b>${pl.pour5}</b> · 8oz <b>${pl.pour8}</b> · bottle <b>${pl.bottle}</b> <span class="ladder-note">≈ 5 glasses</span></p>{/if}
          <div class="meters">
            <StructureMeter label="Acidity" level={w.structure.acidity} />
            <StructureMeter label="Body" level={w.structure.body} />
            <StructureMeter label="Tannin" level={w.structure.tannin} />
            <div class="sweet"><span class="meta">Sweetness</span> <b>{w.structure.sweetness}</b></div>
          </div>
          <p class="winecard-pron meta">Say: <strong>{w.pronunciation.respell}</strong></p>
          <p class="winecard-body">{w.tenSecond}</p>
          {#if w.profile}<p class="meta winecard-profile">{w.profile}</p>{/if}
          {#if w.pair?.length}
            <div class="best-with"><span class="meta">Best with:</span>{#each w.pair.slice(0, 5) as dish}<span class="pill alt">{dish}</span>{/each}</div>
          {/if}
          {#if w.upgrade}<p class="meta upgrade-line">Upsell → <strong>{w.upgrade}</strong></p>{/if}
          {#if w.objections?.length}
            <details class="objections"><summary>Guest objections ({w.objections.length})</summary>
              <ul>{#each w.objections as o}<li><b>“{o.cue}”</b> — {o.reply}</li>{/each}</ul>
            </details>
          {/if}
          <div class="winecard-tags">
            <span class="pill">{w.family}</span>
            <span class="pill alt">{w.climate} climate</span>
            {#if w.exclusive}<span class="pill alt">exclusive</span>{/if}
            {#if w.vegan === true}<span class="pill alt">vegan</span>{/if}
          </div>
        </article>
      {/each}
    </div>
    {:else}
      <p class="sub">No wines match “{q}”. Try a grape, style, food, or region.</p>
    {/if}

  {:else if filter === 'Food'}
    <div class="grid cols-2 on-cream">
      {#each data.foods as f (f.id)}
        <article class="card light">
          <h3>{f.name}</h3>
          <div class="meta">{f.category} · {f.price}</div>
          {#if f.wine}<p class="winecard-body"><strong>{f.wine}</strong> — {f.why}</p>{/if}
          {#if f.flags?.length}<p class="meta">Confirm: {f.flags.join(', ')}</p>{/if}
        </article>
      {/each}
    </div>

  {:else if filter === 'Cocktails'}
    <div class="grid cols-2 on-cream">
      {#each data.cocktails as c (c.id)}
        <article class="card light">
          <h3>{c.name}</h3>
          <div class="meta">{c.category} · {c.price}</div>
          <p class="winecard-body">{c.say}</p>
        </article>
      {/each}
    </div>

  {:else if filter === 'Translator'}
    <label class="search">
      <span class="visually-hidden">Search a guest ask by grape, style, alias, or wine</span>
      <input type="search" bind:value={q} placeholder="Search a guest ask — Cabernet, Meiomi, Malbec…" autocomplete="off" />
    </label>
    <p class="meta" aria-live="polite" style="margin:0 0 12px">{translatorRows.length} of {data.translator.length} guest asks</p>
    {#if translatorRows.length}
    <div class="grid cols-2 on-cream">
      {#each translatorRows as t (t.ask)}
        <article class="card light">
          <h3>{t.ask}</h3>
          <p class="winecard-body">By the glass → <strong>{t.bestGlass}</strong></p>
          {#if t.bottleOptions?.length}<p class="meta upgrade-line">Bottle upgrade → <strong>{t.bottleOptions.join(', ')}</strong></p>{/if}
          {#if t.different}<p class="meta winecard-profile">Point of difference: {t.different}</p>{/if}
          <p class="meta">{t.phrase}</p>
        </article>
      {/each}
    </div>
    {:else}
      <p class="sub">No guest ask matches “{q}”. Try a grape, a wine name, or a style.</p>
    {/if}

  {:else}
    <table class="matrix">
      <caption class="visually-hidden">Dish-by-dish pairing matrix: wine, cocktail, zero-proof, and why.</caption>
      <thead><tr><th>Dish</th><th>Wine</th><th>Cocktail</th><th>Zero-proof</th><th>Why</th></tr></thead>
      <tbody>
        {#each matrixRows as f (f.id)}
          <tr>
            <th>{f.name}</th>
            <td data-label="Wine">{f.wine}</td>
            <td data-label="Cocktail">{f.cocktail ?? '—'}</td>
            <td data-label="Zero-proof">{f.zero ?? '—'}</td>
            <td data-label="Why">{f.why}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  .search input {
    width: 100%; max-width: 420px; padding: 11px 14px; margin: 0 0 8px;
    border-radius: var(--radius-btn); border: 1px solid var(--line);
    background: rgba(255, 238, 215, .05); color: var(--cream); font-size: 15px;
  }
  .search input::placeholder { color: var(--muted); opacity: 1; }
  .meters { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin: 2px 0; }
  .sweet { display: flex; align-items: center; gap: 8px; }
  .sweet b { color: var(--ink); text-transform: capitalize; }
  @media (max-width: 420px) { .meters { grid-template-columns: 1fr; } }
  .winecard-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .winecard-head .name { margin: 0; }
  .winecard-pron { margin: 2px 0 0; }
  .winecard-body { margin: 6px 0 0; font-size: 14px; }
  .winecard-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
  .pill.alt { background: rgba(67, 124, 147, .16); color: var(--ink); border-color: rgba(67, 124, 147, .4); }
  .price-ladder { margin: 4px 0 0; }
  .price-ladder b { color: var(--ink); }
  .winecard-profile { margin: 6px 0 0; }
  .best-with { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; }
  .upgrade-line { margin: 6px 0 0; }
  .upgrade-line strong { color: var(--ink); }
  .objections { margin-top: 8px; }
  .objections > summary { cursor: pointer; min-height: 24px; display: list-item; color: var(--ink); font-size: 13px; }
  .objections ul { margin: 6px 0 0; padding-left: 18px; }
  .objections li { font-size: 13px; margin: 4px 0; color: var(--ink); }
  .objections li b { font-weight: 600; }
</style>
