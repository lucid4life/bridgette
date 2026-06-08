<script lang="ts">
  import { data } from '$lib/data/index';
  import { onMount } from 'svelte';
  import { langFor } from '$lib/engine/training.js';
  import { playPronunciation } from '$lib/audio/playPronunciation';
  import StructureMeter from '$lib/components/StructureMeter.svelte';
  import type { Bottle, Beer, Fortified } from '$lib/data/types';

  // Reference-only full-menu data — fetched as a STATIC JSON ASSET (PERF-03) so it is
  // never bundled into any route chunk; loaded only when you open Reference. SW-precached.
  type FullMenu = { bottles: Bottle[]; beers: Beer[]; fortifieds: Fortified[] };
  let fullmenu = $state<FullMenu | null>(null);
  onMount(async () => {
    try { fullmenu = await fetch('/fullmenu.json').then((r) => r.json()); } catch { fullmenu = { bottles: [], beers: [], fortifieds: [] }; }
  });

  type Filter = 'Wine' | 'Bottles' | 'Food' | 'Cocktails' | 'Beer' | 'Digestifs';
  const FILTERS: Filter[] = ['Wine', 'Bottles', 'Food', 'Cocktails', 'Beer', 'Digestifs'];
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
  // Search the Food + Cocktail tabs too (spec §5 lists "food" as a search axis).
  const foods = $derived(
    data.foods.filter((f) => {
      if (!ql) return true;
      const hay = [f.name, f.category, f.menu, f.flavor, f.wine ?? '', f.cocktail ?? '', f.zero ?? '', f.why, ...(f.tags ?? [])]
        .join(' ').toLowerCase();
      return hay.includes(ql);
    })
  );
  const cocktails = $derived(
    data.cocktails.filter((c) => {
      if (!ql) return true;
      const hay = [c.name, c.category, c.profile, c.pair, c.say, ...(c.tags ?? [])].join(' ').toLowerCase();
      return hay.includes(ql);
    })
  );
  // By-the-bottle list (Phase B): searchable by grape/style/region/alias/dish (COMP-01).
  const allBottles = $derived(fullmenu?.bottles ?? []);
  const bottles = $derived(
    allBottles.filter((b) => {
      if (!ql) return true;
      const hay = [b.name, b.grape, b.region, b.family, b.type, ...(b.aliases ?? []), ...(b.pair ?? [])]
        .join(' ').toLowerCase();
      return hay.includes(ql);
    })
  );

  // Decode the "5oz | 8oz | bottle" price string for the upsell ladder (UX-02).
  function priceLadder(price: string): { pour5: string; pour8: string; bottle: string } | null {
    const p = price.split('|').map((s) => s.trim());
    return p.length === 3 ? { pour5: p[0], pour8: p[1], bottle: p[2] } : null;
  }

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

  <!-- a11y: gives the per-card h3s a parent h2 so the heading order is h1→h2→h3 (1.3.1).
       Not a live region (A11Y-N6) — the aria-pressed filter chips already announce the switch. -->
  <h2 class="visually-hidden">{filter}</h2>

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
    <label class="search">
      <span class="visually-hidden">Search dishes by name, ingredient, or pairing</span>
      <input type="search" bind:value={q} placeholder="Search a dish — oysters, lamb, truffle…" autocomplete="off" />
    </label>
    <p class="meta" aria-live="polite" style="margin:0 0 12px">{foods.length} of {data.foods.length} dishes</p>
    {#if foods.length}
    <div class="grid cols-2 on-cream">
      {#each foods as f (f.id)}
        <article class="card light">
          <h3>{f.name}</h3>
          <div class="meta">{f.category} · {f.price}</div>
          {#if f.wine}<p class="winecard-body"><strong>{f.wine}</strong> — {f.why}</p>{/if}
          {#if f.cocktail}<p class="meta">Cocktail: <strong>{f.cocktail}</strong></p>{/if}
          {#if f.zero}<p class="meta">Zero-proof: <strong>{f.zero}</strong></p>{/if}
          {#if f.flags?.length}<p class="meta">Confirm: {f.flags.join(', ')}</p>{/if}
        </article>
      {/each}
    </div>
    {:else}
      <p class="sub">No dish matches “{q}”. Try an ingredient or a pairing.</p>
    {/if}

  {:else if filter === 'Cocktails'}
    <label class="search">
      <span class="visually-hidden">Search cocktails by name, ingredient, or pairing</span>
      <input type="search" bind:value={q} placeholder="Search a cocktail — mezcal, amaro, citrus…" autocomplete="off" />
    </label>
    <p class="meta" aria-live="polite" style="margin:0 0 12px">{cocktails.length} of {data.cocktails.length} cocktails</p>
    {#if cocktails.length}
    <div class="grid cols-2 on-cream">
      {#each cocktails as c (c.id)}
        <article class="card light">
          <h3>{c.name}</h3>
          <div class="meta">{c.category} · {c.price}</div>
          {#if c.profile}<p class="meta">{c.profile}</p>{/if}
          <p class="winecard-body">{c.say}</p>
          {#if c.pair}<p class="meta">Great with: <strong>{c.pair}</strong></p>{/if}
          {#if c.caveat}<p class="meta">Note: {c.caveat}</p>{/if}
        </article>
      {/each}
    </div>
    {:else}
      <p class="sub">No cocktail matches “{q}”. Try an ingredient or a profile.</p>
    {/if}

  {:else if filter === 'Bottles'}
    <label class="search">
      <span class="visually-hidden">Search bottles by grape, style, region, or dish</span>
      <input type="search" bind:value={q} placeholder="Search the bottle list — Napa Cab, Barolo, Sancerre…" autocomplete="off" />
    </label>
    <p class="meta" aria-live="polite" style="margin:0 0 12px">{fullmenu ? `${bottles.length} of ${allBottles.length} bottles` : 'Loading the bottle list…'}</p>
    {#if !fullmenu}
      <p class="sub">Loading the bottle list…</p>
    {:else if bottles.length}
    <div class="grid cols-2 on-cream">
      {#each bottles as b (b.id)}
        <article class="card light winecard">
          <h3 class="name">{b.name}</h3>
          <div class="meta">{b.grape} · {b.region}</div>
          {#if b.priceBottle}<p class="price-ladder meta">bottle <b>${b.priceBottle}</b></p>{/if}
          <div class="meters">
            <StructureMeter label="Acidity" level={b.structure.acidity} />
            <StructureMeter label="Body" level={b.structure.body} />
            <StructureMeter label="Tannin" level={b.structure.tannin} />
            <div class="sweet"><span class="meta">Sweetness</span> <b>{b.structure.sweetness}</b></div>
          </div>
          <p class="winecard-pron meta">Say: <strong>{b.pronunciation.respell}</strong></p>
          <p class="winecard-body">{b.tenSecond}</p>
          {#if b.pairWhy}<p class="meta winecard-profile">{b.pairWhy}</p>{/if}
          {#if b.pair?.length}
            <div class="best-with"><span class="meta">Best with:</span>{#each b.pair.slice(0, 4) as dish}<span class="pill alt">{dish}</span>{/each}</div>
          {/if}
          <div class="winecard-tags">
            <span class="pill">{b.family}</span>
            <span class="pill alt">{b.climate} climate</span>
            {#if b.upgradeFrom !== 'none'}<span class="pill alt">upgrade from {b.upgradeFrom}</span>{/if}
            {#if b.vegan === true}<span class="pill alt">vegan</span>{/if}
          </div>
        </article>
      {/each}
    </div>
    {:else}
      <p class="sub">No bottle matches “{q}”. Try a grape, region, or a dish.</p>
    {/if}

  {:else if filter === 'Beer'}
    {#if !fullmenu}
      <p class="sub">Loading the beer list…</p>
    {:else}
    <div class="grid cols-2 on-cream">
      {#each fullmenu?.beers ?? [] as b (b.id)}
        <article class="card light">
          <h3>{b.name}</h3>
          <div class="meta">{b.style} · {b.origin} · {b.abv}{b.oz ? ' · ' + b.oz : ''}</div>
          {#if b.flavor}<p class="winecard-body">{b.flavor}</p>{/if}
          {#if b.pairWith?.length}
            <div class="best-with"><span class="meta">Best with:</span>{#each b.pairWith as dish}<span class="pill alt">{dish}</span>{/each}</div>
          {/if}
        </article>
      {/each}
    </div>
    {/if}

  {:else if filter === 'Digestifs'}
    <p class="meta" style="margin:0 0 12px">Dessert pours + after-dinner sherry, port, amaro, cognac, calvados, armagnac, grappa.</p>
    {#if !fullmenu}
      <p class="sub">Loading the digestif list…</p>
    {:else}
    <div class="grid cols-2 on-cream">
      {#each fullmenu?.fortifieds ?? [] as f (f.id)}
        <article class="card light">
          <h3>{f.name}</h3>
          <div class="meta">{f.type}{f.origin ? ' · ' + f.origin : ''}{f.abv ? ' · ' + f.abv : ''}</div>
          <p class="winecard-pron meta">Say: <strong>{f.pronunciation.respell}</strong></p>
          {#if f.profile}<p class="winecard-body">{f.profile}</p>{/if}
          {#if f.pairWith?.length}
            <div class="best-with"><span class="meta">Best with:</span>{#each f.pairWith as dish}<span class="pill alt">{dish}</span>{/each}</div>
          {/if}
          {#if f.sweetness}<p class="meta">{f.sweetness} · served as {f.servedAs}</p>{/if}
        </article>
      {/each}
    </div>
    {/if}
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
