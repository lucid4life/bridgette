<script lang="ts">
  // Pairing Explorer — a FREE-ROAM browse of every printed pairing, both directions.
  // Deliberately NOT Leitner-graded: this is the "wander the menu" mode; the graded
  // retrieval lives in the pairing / pairing-principle / wine-dish decks.
  import { data } from '$lib/data/index';
  import { LEVERS } from '$lib/engine/pairing.js';
  import type { Food, Wine } from '$lib/data/types';

  type Tab = 'dish' | 'wine';
  let tab = $state<Tab>('dish');
  let pickedFood = $state<Food | null>(null);
  let pickedWine = $state<Wine | null>(null);
  let revealed = $state(false);

  const winesByName = new Map(data.wines.map((w) => [w.name, w] as const));
  // Foods with a printed pour, grouped by menu category in data (menu) order.
  const groups: { category: string; foods: Food[] }[] = [];
  for (const f of data.foods) {
    if (!f.wine) continue;
    const g = groups.find((x) => x.category === f.category);
    if (g) g.foods.push(f);
    else groups.push({ category: f.category, foods: [f] });
  }

  const LEVER_MAP = LEVERS as Record<string, { id: string; label: string; script: string }>;
  const lever = $derived(pickedFood?.lever ? LEVER_MAP[pickedFood.lever] ?? null : null);
  // Resolve the printed pour name to one of the 17 glass wines (dessert pours won't resolve).
  const pourWine = $derived(pickedFood?.wine ? winesByName.get(pickedFood.wine) ?? null : null);

  function pickFood(f: Food) { pickedFood = f; revealed = false; }
  function pickWine(w: Wine) { pickedWine = w; revealed = false; }
  function setTab(t: Tab) { tab = t; pickedFood = null; pickedWine = null; revealed = false; }
</script>

<svelte:head><title>Pairing Explorer · Bridgette Training</title></svelte:head>

<section class="screen on-dark">
  <p class="h-eyebrow"><a href="/" class="back">← Practice</a> · Pairing Explorer</p>
  <h1>Work the levers</h1>
  <p class="sub">Free roam — nothing is graded. Pick a dish (or a pour), make your call in your head first, then reveal the printed answer and the lever that makes it work.</p>

  <div class="tabs" role="group" aria-label="Pairing direction">
    <button class="chip" type="button" aria-pressed={tab === 'dish'} onclick={() => setTab('dish')}>Dish → Wine</button>
    <button class="chip" type="button" aria-pressed={tab === 'wine'} onclick={() => setTab('wine')}>Wine → Dish</button>
  </div>

  {#if tab === 'dish'}
    {#each groups as g (g.category)}
      <h3 class="grp">{g.category}</h3>
      <div class="picker">
        {#each g.foods as f (f.id)}
          <button class="chip" type="button" aria-pressed={pickedFood?.id === f.id} onclick={() => pickFood(f)}>{f.name}</button>
        {/each}
      </div>
    {/each}

    {#if pickedFood}
      <div class="flash flashcard-face explore">
        <p class="q">A guest orders {pickedFood.name}. What do you pour — and which lever makes it work?</p>
        {#if !revealed}
          <p class="meta nudge">Say your pour and the lever out loud first — then reveal.</p>
          <div class="gradebar"><button class="btn gold" type="button" onclick={() => (revealed = true)}>Reveal</button></div>
        {:else}
          <p class="ans">
            {#if pourWine}<a class="pour-link" href={'/reference/wine/' + pourWine.id}>{pickedFood.wine}</a>{:else}{pickedFood.wine}{/if}
          </p>
          {#if lever}<p class="why"><strong>{lever.label}:</strong> {lever.script}</p>{/if}
          {#if pickedFood.why}<p class="why"><strong>Why it works:</strong> {pickedFood.why}</p>{/if}
          {#if pickedFood.zero}<p class="why"><strong>Zero-proof:</strong> {pickedFood.zero}</p>{/if}
        {/if}
      </div>
    {/if}
  {:else}
    <div class="picker wines">
      {#each data.wines as w (w.id)}
        <button class="chip" type="button" aria-pressed={pickedWine?.id === w.id} onclick={() => pickWine(w)}>{w.name}</button>
      {/each}
    </div>

    {#if pickedWine}
      <div class="flash flashcard-face explore">
        <p class="q">You're pouring {pickedWine.name}. Which dishes sing with it — and what do you steer it away from?</p>
        {#if !revealed}
          <p class="meta nudge">Name a dish or two in your head first — then reveal.</p>
          <div class="gradebar"><button class="btn gold" type="button" onclick={() => (revealed = true)}>Reveal</button></div>
        {:else}
          {#if pickedWine.pair?.length}
            <div class="pair-pills">{#each pickedWine.pair as p}<span class="pill alt">{p}</span>{/each}</div>
          {/if}
          {#if pickedWine.pairWhy}<p class="why"><strong>Why:</strong> {pickedWine.pairWhy}</p>{/if}
          {#if pickedWine.avoid}<p class="why avoid"><strong>Avoid:</strong> {pickedWine.avoid}</p>{/if}
          <p class="explain"><a class="pour-link" href={'/reference/wine/' + pickedWine.id}>Full card: {pickedWine.name} →</a></p>
        {/if}
      </div>
    {/if}
  {/if}
</section>

<style>
  .back { color: var(--highlight); text-decoration: none; }
  .tabs { display: inline-flex; gap: 8px; margin: 0 0 18px; }
  .grp { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .05em; font-size: 13px; margin: 14px 0 8px; }
  .picker { display: flex; flex-wrap: wrap; gap: 8px; }
  .picker.wines { margin-top: 4px; }
  .explore { text-align: left; margin-top: 22px; }
  .nudge { border-left: 2px solid var(--highlight-line); padding-left: 8px; margin: 4px 0; }
  .ans { font-weight: 700; font-size: 20px; margin: 6px 0 0; }
  .pour-link { color: inherit; text-decoration: underline; text-decoration-color: var(--highlight); text-underline-offset: 3px; }
  .why { background: color-mix(in srgb, var(--info) 12%, transparent); border-radius: var(--radius-nav); padding: 10px; font-size: 14px; margin: 8px 0 0; }
  .why.avoid { background: color-mix(in srgb, var(--accent) 10%, transparent); }
  .pair-pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 0; }
  .explain { margin: 10px 0 0; font-size: 14px; }
</style>
