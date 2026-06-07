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
    playPronunciation(w.id, w.pronunciation.say, langFor(w.country));
    setTimeout(() => { if (speaking === w.id) speaking = null; }, 1500);
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
</script>

<section class="screen">
  <p class="h-eyebrow">Reference</p>
  <h1>Look it up fast</h1>
  <p class="sub">Filter to what you need — no endless scroll. Search by grape, style, food, or region.</p>

  <div class="chips" role="group" aria-label="Reference filter">
    {#each FILTERS as f}
      <button class="chip" type="button" aria-pressed={filter === f} onclick={() => (filter = f)}>{f}</button>
    {/each}
  </div>

  {#if filter === 'Wine'}
    <label class="search">
      <span class="visually-hidden">Search wines by grape, style, food, or region</span>
      <input type="search" bind:value={q} placeholder="Search grape, style, food, region…" autocomplete="off" />
    </label>
    <p class="meta" aria-live="polite" style="margin:0 0 12px">{wines.length} of {data.wines.length} wines</p>
    <div class="grid cols-2 on-cream">
      {#each wines as w (w.id)}
        <article class="card light winecard">
          <div class="winecard-head">
            <span class="name">{w.name}</span>
            <button
              class="speak"
              type="button"
              aria-pressed={speaking === w.id}
              aria-label={'Hear ' + w.name + ' pronounced'}
              onclick={() => speak(w)}
            >🔊</button>
          </div>
          <div class="meta">{w.grape} · {w.region} · {w.price}</div>
          <div class="meters">
            <StructureMeter label="Acidity" level={w.structure.acidity} />
            <StructureMeter label="Body" level={w.structure.body} />
            <StructureMeter label="Tannin" level={w.structure.tannin} />
            <div class="sweet"><span class="meta">Sweetness</span> <b>{w.structure.sweetness}</b></div>
          </div>
          <p class="winecard-pron meta">Say: <strong>{w.pronunciation.respell}</strong></p>
          <p class="winecard-body">{w.tenSecond}</p>
          <div class="winecard-tags">
            <span class="pill">{w.family}</span>
            <span class="pill alt">{w.climate} climate</span>
            {#if w.exclusive}<span class="pill alt">exclusive</span>{/if}
            {#if w.vegan === true}<span class="pill alt">vegan</span>{/if}
          </div>
        </article>
      {/each}
    </div>

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
    <div class="grid cols-2 on-cream">
      {#each data.translator as t (t.ask)}
        <article class="card light">
          <h3>{t.ask}</h3>
          <p class="winecard-body">→ <strong>{t.bestGlass}</strong></p>
          <p class="meta">{t.phrase}</p>
        </article>
      {/each}
    </div>

  {:else}
    <table class="matrix">
      <thead><tr><th>Dish</th><th>Wine</th><th>Cocktail</th><th>Zero-proof</th><th>Why</th></tr></thead>
      <tbody>
        {#each matrixRows as f (f.id)}
          <tr><th>{f.name}</th><td>{f.wine}</td><td>{f.cocktail ?? '—'}</td><td>{f.zero ?? '—'}</td><td>{f.why}</td></tr>
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
  .meters { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin: 2px 0; }
  .sweet { display: flex; align-items: center; gap: 8px; }
  .sweet b { color: var(--ink); text-transform: capitalize; }
  @media (max-width: 420px) { .meters { grid-template-columns: 1fr; } }
  .winecard-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .winecard-pron { margin: 2px 0 0; }
  .winecard-body { margin: 6px 0 0; font-size: 14px; }
  .winecard-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
  .pill.alt { background: rgba(67, 124, 147, .16); color: var(--ink); border-color: rgba(67, 124, 147, .4); }
</style>
