<script lang="ts">
  // "On the Floor" hub (spec §4) — the in-the-moment helper. Two VIEWS over the
  // ONE canonical data layer (spec §3 single-source rule): Substitutions (the
  // translator[] join to wines[]) and Pairings (foods[] + inverted wines[].pair).
  // No content is re-authored here — every line renders the same source Learn and
  // Practice cross-link to.
  import { data } from '$lib/data/index';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { langFor } from '$lib/engine/training.js';
  import { playPronunciation } from '$lib/audio/playPronunciation';
  import StructureMeter from '$lib/components/StructureMeter.svelte';
  import Expandable from '$lib/components/Expandable.svelte';
  import Icon from '$lib/components/Icon.svelte';

  type View = 'subs' | 'pairs';
  type Direction = 'dish' | 'drink' | 'lever';

  let view = $state<View>('subs');
  let subQ = $state('');
  let pairQ = $state('');
  let direction = $state<Direction>('dish');
  let speaking = $state<string | null>(null);

  function speak(w: (typeof data.wines)[number]) {
    speaking = w.id;
    // truthful playing-state: cleared by the real audio 'ended'/speech onend (not a timer)
    playPronunciation(w.id, w.pronunciation.say, langFor(w.country), () => {
      if (speaking === w.id) speaking = null;
    });
  }

  // Deep-link: the global "Guest asked for…" search lands here with ?view=&q= so the
  // surface opens pre-filtered. view=pairings → Pairings tab; otherwise Substitutions.
  // q seeds the active view's search box. No params → behaviour is unchanged.
  onMount(() => {
    const params = page.url.searchParams;
    const v = params.get('view');
    const q = params.get('q');
    if (v === 'pairings') {
      view = 'pairs';
      if (q) pairQ = q;
    } else {
      if (v === 'substitutions') view = 'subs';
      if (q) subQ = q;
    }
  });

  // Join a translator row's bestGlass back to its wine (verified 30/30 — every
  // bestGlass resolves), surfacing the otherwise-dead `familiar` line + the pour's
  // structure meter and pronunciation.
  const wineByName = new Map(data.wines.map((w) => [w.name, w] as const));

  // ---- Substitutions: filter + group by the structure-family of the pour ----
  const subQl = $derived(subQ.trim().toLowerCase());
  const subRows = $derived(
    data.translator.filter((t) => {
      if (!subQl) return true;
      const hay = [t.ask, ...(t.aliases ?? []), t.bestGlass].join(' ').toLowerCase();
      return hay.includes(subQl);
    })
  );

  // Lightest → boldest, so the cross-grape logic reads top-to-bottom (spec §4a).
  const FAMILY_ORDER = [
    'Bubbles & Rosé',
    'Bright & Crisp Whites',
    'Round Whites',
    'Light Reds',
    'Structured Reds'
  ] as const;

  // Group filtered rows by the family of their bestGlass wine; unmatched → 'Other'.
  // Only non-empty groups, in the lightest→boldest order (with 'Other' last).
  const subGroups = $derived.by(() => {
    const buckets = new Map<string, typeof subRows>();
    for (const t of subRows) {
      const gw = wineByName.get(t.bestGlass);
      const fam = gw?.family ?? 'Other';
      const arr = buckets.get(fam) ?? [];
      arr.push(t);
      buckets.set(fam, arr);
    }
    const ordered: { family: string; rows: typeof subRows }[] = [];
    for (const fam of FAMILY_ORDER) {
      const rows = buckets.get(fam);
      if (rows?.length) ordered.push({ family: fam, rows });
    }
    const other = buckets.get('Other');
    if (other?.length) ordered.push({ family: 'Other', rows: other });
    return ordered;
  });

  // Honest-pivot flag: no-true-match asks (e.g. Moscato) get a candid badge so the
  // server doesn't oversell a wine we don't pour (spec §4a point 7).
  const HONEST_PIVOT = /not a true|no true|do not have|don't have|no sweetened/i;

  // ---- Pairings ----
  const pairQl = $derived(pairQ.trim().toLowerCase());
  // Dish → drink: every food carries a wine; show the three picks + the shared lever.
  const pairFoods = $derived(
    data.foods.filter((f) => {
      if (!f.wine) return false;
      if (!pairQl) return true;
      const hay = [f.name, f.category, f.flavor].join(' ').toLowerCase();
      return hay.includes(pairQl);
    })
  );

  // Drink → dish: invert foods[].wine. "I'm pouring this — what do I feed it?"
  const dishesFor = (wineName: string) =>
    data.foods.filter((f) => f.wine === wineName).map((f) => f.name);
  const pairWines = $derived(
    data.wines
      .map((w) => ({ wine: w, dishes: dishesFor(w.name) }))
      .filter(({ dishes }) => dishes.length > 0)
  );

  // By lever: group every food (with a wine) by the structural rule in its why.
  // First match wins; if nothing matches, falls back to 'Match the weight'.
  const LEVER_ORDER = [
    'Tannin needs protein',
    'Acidity cuts fat',
    'Sweetness tames heat',
    'Salt lifts the wine',
    'Bitterness as structure',
    'Freshness & acidity',
    'Match the weight'
  ] as const;
  type Lever = (typeof LEVER_ORDER)[number];

  function leverOf(why: string): Lever {
    const w = (why || '').toLowerCase();
    if (/tannin/.test(w)) return 'Tannin needs protein';
    if (/acid/.test(w) && /(fat|fried|cream|rich|oil|butter)/.test(w)) return 'Acidity cuts fat';
    if (/(sweet|honey).*(heat|spice|chili|chilli)|(heat|spice|chili|chilli).*(sweet|honey)/.test(w)) return 'Sweetness tames heat';
    if (/salt/.test(w)) return 'Salt lifts the wine';
    if (/bitter/.test(w)) return 'Bitterness as structure';
    if (/acid|fresh|bubble|crisp/.test(w)) return 'Freshness & acidity';
    return 'Match the weight';
  }

  const leverGroups = $derived.by(() => {
    const buckets = new Map<Lever, typeof pairFoods>();
    for (const f of pairFoods) {
      const lev = leverOf(f.why ?? '');
      const arr = buckets.get(lev) ?? [];
      arr.push(f);
      buckets.set(lev, arr);
    }
    const ordered: { lever: Lever; foods: typeof pairFoods }[] = [];
    for (const lev of LEVER_ORDER) {
      const foods = buckets.get(lev);
      if (foods?.length) ordered.push({ lever: lev, foods });
    }
    return ordered;
  });
</script>

<svelte:head><title>On the Floor · Bridgette Training</title></svelte:head>

<section class="screen">
  <p class="h-eyebrow">On the Floor</p>
  <h1>A guest just spoke — what's your move?</h1>
  <p class="sub">Two moves, one menu. Find the substitute that lands in the same structure lane, or build the pairing that works in both directions.</p>

  <div class="segmented" role="group" aria-label="On the Floor view">
    <button type="button" class="seg" aria-pressed={view === 'subs'} onclick={() => { view = 'subs'; speaking = null; }}>Substitutions</button>
    <button type="button" class="seg" aria-pressed={view === 'pairs'} onclick={() => { view = 'pairs'; speaking = null; }}>Pairings</button>
  </div>

  {#if view === 'subs'}
    <label class="search">
      <span class="visually-hidden">Search a guest ask by grape, alias, or wine</span>
      <input type="search" bind:value={subQ} placeholder="Search a guest ask — Cabernet, Napa Cab, Malbec…" autocomplete="off" />
    </label>

    {#if subGroups.length}
      {#each subGroups as group (group.family)}
        <h2 class="lane">{group.family}</h2>
        <div class="grid cols-2 on-cream">
          {#each group.rows as t (t.ask)}
            {@const gw = wineByName.get(t.bestGlass)}
            <article class="card light">
              {#if HONEST_PIVOT.test(t.different)}
                <p class="flag"><span class="pill">Honest pivot</span></p>
              {/if}
              <h3>{t.ask}{#if t.aliases?.length}<span class="aliases">also: {t.aliases.map((a) => `"${a}"`).join(', ')}</span>{/if}</h3>
              <div class="winecard-head">
                <p class="pour">By the glass → <strong>{t.bestGlass}</strong></p>
                {#if gw}
                  <button
                    class="speak"
                    type="button"
                    aria-pressed={speaking === gw.id}
                    aria-label={'Hear ' + gw.name + ' pronounced'}
                    onclick={() => speak(gw)}
                  ><Icon name="speaker" /></button>
                {/if}
              </div>
              {#if t.familiar}<p class="bridge">{t.familiar}</p>{/if}
              <Expandable label="More">
                {#if gw}
                  <div class="meters">
                    <StructureMeter label="Acidity" level={gw.structure.acidity} />
                    <StructureMeter label="Body" level={gw.structure.body} />
                    <StructureMeter label="Tannin" level={gw.structure.tannin} />
                  </div>
                  <p class="winecard-pron meta">Say: <strong>{gw.pronunciation.respell}</strong></p>
                {/if}
                {#if t.different}<p class="meta">Point of difference: {t.different}</p>{/if}
                {#if t.bottleOptions?.length}<p class="meta upgrade-line">Want the real grape? → <strong>{t.bottleOptions.join(', ')}</strong></p>{/if}
                <p class="meta phrase">{t.phrase}</p>
              </Expandable>
            </article>
          {/each}
        </div>
      {/each}
    {:else}
      <p class="sub">No guest ask matches “{subQ}”. Try a grape, a wine, or a style.</p>
    {/if}

  {:else}
    <label class="search">
      <span class="visually-hidden">Search a dish by name, course, or flavor</span>
      <input type="search" bind:value={pairQ} placeholder="Search a dish — oysters, lamb, salty, spicy…" autocomplete="off" />
    </label>

    <div class="segmented dir" role="group" aria-label="Pairing direction">
      <button type="button" class="seg" aria-pressed={direction === 'dish'} onclick={() => { direction = 'dish'; }}>Dish → drink</button>
      <button type="button" class="seg" aria-pressed={direction === 'drink'} onclick={() => { direction = 'drink'; }}>Drink → dish</button>
      <button type="button" class="seg" aria-pressed={direction === 'lever'} onclick={() => { direction = 'lever'; }}>By lever</button>
    </div>

    {#if direction === 'dish'}
      <h2 class="visually-hidden">Dish to drink pairings</h2>
      {#if pairFoods.length}
        <div class="grid cols-2 on-cream">
          {#each pairFoods as f (f.id)}
            <article class="card light">
              <h3>{f.name}</h3>
              <div class="meta">{f.category} · {f.flavor}</div>
              <div class="picks">
                <div class="pick">
                  <span class="pick-label">Wine</span>
                  <span class="pick-val">{f.wine}</span>
                </div>
                <div class="pick">
                  <span class="pick-label">Cocktail</span>
                  <span class="pick-val">{f.cocktail ?? '—'}</span>
                </div>
                <div class="pick">
                  <span class="pick-label">Zero-proof</span>
                  <span class="pick-val">{f.zero ?? '—'}</span>
                </div>
              </div>
              <p class="lever">{f.why}</p>
            </article>
          {/each}
        </div>
      {:else}
        <p class="sub">No dish matches “{pairQ}”. Try an ingredient or a flavor.</p>
      {/if}
    {:else if direction === 'drink'}
      <h2 class="visually-hidden">Drink to dish pairings</h2>
      <p class="sub intro">You're pouring this — what do you feed it?</p>
      <div class="grid cols-2 on-cream">
        {#each pairWines as { wine, dishes } (wine.id)}
          <article class="card light">
            <h3>{wine.name}</h3>
            <div class="best-with">
              <span class="meta">Best with:</span>
              {#each dishes as dish}<span class="pill alt">{dish}</span>{/each}
            </div>
          </article>
        {/each}
      </div>
    {:else}
      {#if leverGroups.length}
        {#each leverGroups as group (group.lever)}
          <h2 class="lane">{group.lever}</h2>
          <div class="grid cols-2 on-cream">
            {#each group.foods as f (f.id)}
              <article class="card light">
                <h3>{f.name}</h3>
                <div class="meta">{f.category} · {f.flavor}</div>
                <div class="picks">
                  <div class="pick">
                    <span class="pick-label">Wine</span>
                    <span class="pick-val">{f.wine}</span>
                  </div>
                  <div class="pick">
                    <span class="pick-label">Cocktail</span>
                    <span class="pick-val">{f.cocktail ?? '—'}</span>
                  </div>
                  <div class="pick">
                    <span class="pick-label">Zero-proof</span>
                    <span class="pick-val">{f.zero ?? '—'}</span>
                  </div>
                </div>
                <p class="lever">{f.why}</p>
              </article>
            {/each}
          </div>
        {/each}
      {:else}
        <p class="sub">No dish matches "{pairQ}". Try an ingredient or a flavor.</p>
      {/if}
    {/if}
  {/if}
</section>

<style>
  /* Segmented control: pill container, active = orange-on-cream action colour.
     Uses --accent-dark (not raw --orange) so the cream text clears AA contrast. */
  .segmented {
    display: inline-flex; gap: 4px; padding: 4px; margin: 0 0 18px;
    background: rgba(255, 238, 215, .05); border: 1px solid var(--line);
    border-radius: var(--radius-chip);
  }
  .segmented.dir { margin: 4px 0 18px; }
  .seg {
    padding: 9px 18px; border: 1px solid transparent; border-radius: var(--radius-chip);
    background: none; color: var(--cream); font-size: 13px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .04em; min-height: 40px;
  }
  .seg[aria-pressed='true'] { background: var(--accent-dark); border-color: var(--accent-dark); color: var(--cream); }
  .seg:hover:not([aria-pressed='true']) { background: rgba(255, 238, 215, .08); }

  .search input {
    width: 100%; max-width: 420px; padding: 11px 14px; margin: 0 0 14px;
    border-radius: var(--radius-btn); border: 1px solid var(--line);
    background: rgba(255, 238, 215, .05); color: var(--cream); font-size: 15px;
  }
  .search input::placeholder { color: var(--muted); opacity: 1; }

  /* Family lane heading: Oswald display, uppercase, muted, with a hairline. */
  .lane {
    font-family: var(--font-display); text-transform: uppercase; letter-spacing: .04em;
    color: var(--muted); font-size: 15px; margin: 26px 0 12px;
    padding-bottom: 8px; border-bottom: 1px solid var(--line);
  }
  .lane:first-of-type { margin-top: 4px; }

  /* Card internals (cream surface — text uses --ink / --muted-paper). */
  .aliases { display: block; font-size: 12px; font-weight: 400; text-transform: none; letter-spacing: normal; color: var(--muted-paper); margin-top: 3px; }
  .flag { margin: 0 0 6px; }
  .winecard-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 2px; }
  .pour { margin: 0; font-size: 14px; color: var(--ink); }
  .pour strong { color: var(--ink); }
  .winecard-pron { margin: 4px 0 0; }
  .upgrade-line { margin: 6px 0 0; }
  .upgrade-line strong { color: var(--ink); }
  .phrase { margin: 8px 0 0; }

  /* The bridge line as the hero — the one sentence the server says. Gold-tinted
     callout matching the existing .why/.we treatment (spec §4a point 3). */
  .bridge {
    background: rgba(252, 181, 57, .14); border: 1px solid rgba(252, 181, 57, .4);
    border-radius: var(--radius-nav); padding: 10px 12px; margin: 10px 0 0;
    color: var(--ink); font-size: 14px; font-weight: 600;
  }

  .meters { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin: 10px 0 0; }
  @media (max-width: 420px) { .meters { grid-template-columns: 1fr; } }

  /* Pairings: three picks side by side (wine | cocktail | zero-proof). */
  .picks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0 0; }
  .pick {
    background: rgba(30, 56, 75, .05); border: 1px solid var(--line-dark);
    border-radius: var(--radius-nav); padding: 8px 10px; display: grid; gap: 3px;
  }
  .pick-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--label-light); }
  .pick-val { font-size: 14px; font-weight: 600; color: var(--ink); }

  /* The shared lever line that justifies all three picks. */
  .lever {
    background: rgba(252, 181, 57, .14); border: 1px solid rgba(252, 181, 57, .4);
    border-radius: var(--radius-nav); padding: 10px 12px; margin: 10px 0 0;
    color: var(--ink); font-size: 14px;
  }

  .best-with { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 6px; }
  .intro { margin: 0 0 16px; }

  @media (max-width: 680px) {
    .picks { grid-template-columns: 1fr; }
  }
</style>
