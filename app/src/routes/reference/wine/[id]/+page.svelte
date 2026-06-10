<script lang="ts" module>
  // Reference-only full-menu data (bottles + fortifieds) — fetched once per app
  // lifetime and cached at module scope so revisits / back-forward don't refetch.
  import type { Bottle, Beer, Fortified } from '$lib/data/types';
  type FullMenu = { bottles: Bottle[]; beers: Beer[]; fortifieds: Fortified[] };
  let fullmenuPromise: Promise<FullMenu> | null = null;
  function loadFullMenu(): Promise<FullMenu> {
    if (!fullmenuPromise) {
      fullmenuPromise = fetch('/fullmenu.json').then((r) => {
        if (!r.ok) throw new Error('fullmenu.json: ' + r.status);
        return r.json() as Promise<FullMenu>;
      });
      // a failed fetch must not poison the cache — allow a retry on the next visit
      fullmenuPromise.catch(() => { fullmenuPromise = null; });
    }
    return fullmenuPromise;
  }
</script>

<script lang="ts">
  import { data } from '$lib/data/index';
  import { langFor } from '$lib/engine/training.js';
  import { playPronunciation } from '$lib/audio/playPronunciation';
  import StructureMeter from '$lib/components/StructureMeter.svelte';
  import StyleMap from '$lib/components/StyleMap.svelte';
  import RegionMap from '$lib/components/RegionMap.svelte';
  import Expandable from '$lib/components/Expandable.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import type { Wine, Structure, Pronunciation, Objection } from '$lib/data/types';
  import type { PageData } from './$types';

  let { data: route }: { data: PageData } = $props();

  // Normalized view-model: one shape for the three record kinds, every section
  // optional so the page renders only what the record actually carries.
  interface View {
    kind: 'Glass pour' | 'Bottle list' | 'Digestif';
    id: string;
    name: string;
    pills: string[];
    price?: string; // glass: "16 | 26 | 80" = 5oz | 8oz | bottle
    priceBottle?: number | null;
    vegan?: boolean | null;
    veganNote?: string;
    exclusive?: boolean;
    pron?: Pronunciation | null;
    lang?: string;
    glassWine?: boolean; // has dots on the style/region maps
    grape?: string;
    region?: string;
    country?: string;
    vintage?: string;
    climate?: string;
    origin?: string;
    abv?: string;
    servedAs?: string;
    sweetnessWord?: string;
    structure?: Structure;
    structureNote?: string;
    tenSecond?: string;
    profile?: string;
    producerStory?: string;
    whyWePourIt?: string;
    say?: string;
    objections?: Objection[];
    pair?: string[];
    pairWhy?: string;
    avoid?: string;
    mnemonic?: string;
    compare?: string[];
    storyMnemonic?: string;
  }

  function fromWine(w: Wine): View {
    return {
      kind: 'Glass pour', id: w.id, name: w.name,
      pills: [w.family, w.category],
      price: w.price,
      vegan: w.vegan, veganNote: w.veganNote, exclusive: w.exclusive,
      pron: w.pronunciation, lang: langFor(w.country), glassWine: true,
      grape: w.grape, region: w.region, country: w.country, vintage: w.vintage, climate: w.climate,
      structure: w.structure, structureNote: w.structureNote,
      tenSecond: w.tenSecond, profile: w.profile,
      producerStory: w.producerStory, whyWePourIt: w.whyWePourIt,
      say: w.say, objections: w.objections,
      pair: w.pair, avoid: w.avoid,
      mnemonic: w.mnemonic, compare: w.compare, storyMnemonic: w.storyMnemonic
    };
  }
  function fromBottle(b: Bottle): View {
    return {
      kind: 'Bottle list', id: b.id, name: b.name,
      pills: [b.family, b.type],
      priceBottle: b.priceBottle,
      vegan: b.vegan, exclusive: b.exclusive,
      pron: b.pronunciation, lang: langFor(b.country),
      grape: b.grape, region: b.region, country: b.country, vintage: b.vintage, climate: b.climate,
      structure: b.structure,
      tenSecond: b.tenSecond, profile: b.profile,
      producerStory: b.producerStory, whyWePourIt: b.whyWePourIt,
      pair: b.pair, pairWhy: b.pairWhy,
      mnemonic: b.mnemonic
    };
  }
  function fromFortified(f: Fortified): View {
    return {
      kind: 'Digestif', id: f.id, name: f.name,
      pills: [f.servedAs],
      pron: f.pronunciation,
      origin: f.origin, abv: f.abv, servedAs: f.servedAs, sweetnessWord: f.sweetness,
      profile: f.profile,
      pair: f.pairWith
    };
  }

  let view = $state<View | null>(null);
  let status = $state<'loading' | 'found' | 'missing'>('loading');
  let speaking = $state<'normal' | 'slow' | null>(null);

  // Resolve the id: glass wines are in the bundled data (synchronous); bottles +
  // fortifieds live in the static fullmenu.json (fetched + module-cached). The token
  // guards a stale async resolve when navigating between two deep-dive pages.
  let token = 0;
  $effect(() => {
    const id = route.id;
    const t = ++token;
    speaking = null;
    const glass = data.wines.find((w) => w.id === id);
    if (glass) { view = fromWine(glass); status = 'found'; return; }
    view = null; status = 'loading';
    loadFullMenu().then(
      (fm) => {
        if (t !== token) return;
        const b = fm.bottles.find((x) => x.id === id);
        const f = b ? undefined : fm.fortifieds.find((x) => x.id === id);
        if (b) { view = fromBottle(b); status = 'found'; }
        else if (f) { view = fromFortified(f); status = 'found'; }
        else status = 'missing';
      },
      () => { if (t === token) status = 'missing'; }
    );
  });

  function speak(rate?: number) {
    if (!view) return;
    const which = rate ? 'slow' : 'normal';
    speaking = which;
    // truthful playing-state: cleared by the real audio 'ended'/speech onend, not a timer
    playPronunciation(view.id, view.pron?.say ?? view.name, view.lang, () => {
      if (speaking === which) speaking = null;
    }, rate);
  }

  // Decode the "5oz | 8oz | bottle" glass-price string (same rule as Reference).
  const ladder = $derived.by(() => {
    if (!view?.price) return null;
    const p = view.price.split('|').map((s) => s.trim());
    return p.length === 3 ? { pour5: p[0], pour8: p[1], bottle: p[2] } : null;
  });

  function dishHref(dish: string): string {
    // Reference's deep-link contract: ?filter=<chip>&q=<query> (see reference/+page.svelte onMount)
    return '/reference?filter=Food&q=' + encodeURIComponent(dish);
  }

  const hasIdentity = $derived(!!(view && (view.grape || view.region || view.country || view.vintage || view.climate || view.origin || view.abv || view.servedAs)));
  const hasStory = $derived(!!(view && (view.tenSecond || view.profile || view.producerStory || view.whyWePourIt)));
  const hasScript = $derived(!!(view && (view.say || view.objections?.length)));
  const hasPairings = $derived(!!(view && (view.pair?.length || view.pairWhy || view.avoid)));
  const hasMemory = $derived(!!(view && (view.mnemonic || view.storyMnemonic || view.compare?.length)));
</script>

<svelte:head><title>{view ? view.name + ' · ' : ''}Reference · Bridgette Training</title></svelte:head>

<section class="screen">
  {#if status === 'loading'}
    <p class="h-eyebrow">Reference</p>
    <h1>Loading…</h1>
    <p class="sub">Pulling up the bottle.</p>
  {:else if status === 'missing'}
    <p class="h-eyebrow">Reference</p>
    <h1>Hmm — can't find that one</h1>
    <div class="card light notfound">
      <h2>Not on the current list</h2>
      <p>That pour isn't on the menu data right now — the list rotates, so it may have come off. Search the live list instead.</p>
      <a class="btn" href="/reference">Back to Reference</a>
    </div>
  {:else if view}
    <p class="h-eyebrow">Reference · {view.kind}</p>
    <h1>{view.name}</h1>

    <div class="pills">
      {#each view.pills.filter(Boolean) as p (p)}<span class="pill">{p}</span>{/each}
      {#if view.exclusive}<span class="pill">exclusive</span>{/if}
      {#if view.vegan === true}<span class="pill">vegan</span>{/if}
    </div>
    {#if view.veganNote}<p class="meta vegan-note">{view.veganNote}</p>{/if}

    {#if ladder}
      <p class="meta priceline">5oz <b>${ladder.pour5}</b> · 8oz <b>${ladder.pour8}</b> · bottle <b>${ladder.bottle}</b></p>
    {:else if view.price}
      <p class="meta priceline">{view.price}</p>
    {:else if view.priceBottle}
      <p class="meta priceline">bottle <b>${view.priceBottle}</b></p>
    {/if}

    {#if view.pron}
      <div class="pron">
        <span class="meta">Say: <strong>{view.pron.respell}</strong></span>
        <button class="btn ghost pron-btn" type="button" aria-pressed={speaking === 'normal'} aria-label={'Hear it — ' + view.name + ' pronounced'} onclick={() => speak()}>
          <Icon name="speaker" size={15} /> Hear it
        </button>
        <button class="btn ghost pron-btn" type="button" aria-pressed={speaking === 'slow'} aria-label={'Slow — ' + view.name + ' pronounced at 0.7x'} onclick={() => speak(0.7)}>
          <Icon name="slow" size={15} /> Slow
        </button>
      </div>
    {/if}

    <div class="stack">
      {#if hasIdentity}
        <section class="card light sect">
          <h2>Identity</h2>
          <dl class="facts">
            {#if view.grape}<div><dt>Grape</dt><dd>{view.grape}</dd></div>{/if}
            {#if view.region}<div><dt>Region</dt><dd>{view.region}</dd></div>{/if}
            {#if view.country}<div><dt>Country</dt><dd>{view.country}</dd></div>{/if}
            {#if view.origin}<div><dt>Origin</dt><dd>{view.origin}</dd></div>{/if}
            {#if view.vintage}<div><dt>Vintage</dt><dd>{view.vintage}</dd></div>{/if}
            {#if view.climate}<div><dt>Climate</dt><dd class="cap">{view.climate}</dd></div>{/if}
            {#if view.abv}<div><dt>ABV</dt><dd>{view.abv}</dd></div>{/if}
            {#if view.sweetnessWord}<div><dt>Sweetness</dt><dd class="cap">{view.sweetnessWord}</dd></div>{/if}
            {#if view.servedAs}<div><dt>Served as</dt><dd>{view.servedAs}</dd></div>{/if}
          </dl>
          {#if view.glassWine}
            <!-- The maps render the whole glass list (they take no highlight prop) —
                 still useful context: this wine's dot is on both. -->
            <Expandable label="See it on the maps">
              <div class="maps">
                <RegionMap />
                <StyleMap />
              </div>
            </Expandable>
          {/if}
        </section>
      {/if}

      {#if view.structure}
        <section class="card light sect">
          <h2>Structure</h2>
          <div class="meters">
            <StructureMeter label="Acidity" level={view.structure.acidity} />
            <StructureMeter label="Body" level={view.structure.body} />
            <StructureMeter label="Tannin" level={view.structure.tannin} />
            <div class="sweet"><span class="meta">Sweetness</span> <b>{view.structure.sweetness}</b></div>
          </div>
          {#if view.structureNote}<p class="meta note-line">{view.structureNote}</p>{/if}
        </section>
      {/if}

      {#if hasStory}
        <section class="card light sect">
          <h2>The story</h2>
          {#if view.tenSecond}<p class="lead"><strong>{view.tenSecond}</strong></p>{/if}
          {#if view.profile}<p class="body-line">{view.profile}</p>{/if}
          {#if view.producerStory}
            <h3>The producer</h3>
            <p class="body-line">{view.producerStory}</p>
          {/if}
          {#if view.whyWePourIt}
            <h3>Why we pour it</h3>
            <p class="body-line">{view.whyWePourIt}</p>
          {/if}
        </section>
      {/if}

      {#if hasScript}
        <section class="card light sect">
          <h2>Guest script</h2>
          {#if view.say}
            <p class="meta">What to say at the table:</p>
            <blockquote class="say">“{view.say}”</blockquote>
          {/if}
          {#if view.objections?.length}
            <Expandable label="If the guest pushes back">
              <ul class="objections">
                {#each view.objections as o (o.cue)}<li><b>“{o.cue}”</b> — {o.reply}</li>{/each}
              </ul>
            </Expandable>
          {/if}
        </section>
      {/if}

      {#if hasPairings}
        <section class="card light sect">
          <h2>Pairings</h2>
          {#if view.pair?.length}
            <ul class="pairlist">
              {#each view.pair as dish (dish)}
                <li><a class="pill alt dish" href={dishHref(dish)}>{dish}</a></li>
              {/each}
            </ul>
          {/if}
          {#if view.pairWhy}<p class="body-line"><b>Why it works:</b> {view.pairWhy}</p>{/if}
          {#if view.avoid}<p class="body-line"><b>Avoid:</b> {view.avoid}</p>{/if}
        </section>
      {/if}

      {#if hasMemory}
        <section class="card light sect">
          <h2>Remember it</h2>
          {#if view.mnemonic}<p class="body-line">{view.mnemonic}</p>{/if}
          {#if view.storyMnemonic}<p class="body-line">{view.storyMnemonic}</p>{/if}
          {#if view.compare?.length}
            <h3>Don't confuse with</h3>
            <ul class="compare">
              {#each view.compare as row (row)}<li>{row}</li>{/each}
            </ul>
          {/if}
        </section>
      {/if}

      <section class="sect drill">
        <h2>Drill it</h2>
        <div class="drillrow">
          <a class="btn" href="/?deck=wine-identity">Wine identity</a>
          <a class="btn ghost" href="/?deck=structure">Structure</a>
          <a class="btn ghost" href="/?deck=pairing">Pairing</a>
        </div>
      </section>
    </div>
  {/if}
</section>

<style>
  .pills { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 0; }
  .vegan-note { margin: 8px 0 0; max-width: 60ch; }
  .priceline { margin: 10px 0 0; }
  .priceline b { color: var(--text-strong); }
  .pron { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 12px 0 0; }
  .pron strong { color: var(--text-strong); }
  .pron-btn { padding: 8px 12px; font-size: 12px; min-height: 44px; }
  .pron-btn[aria-pressed='true'] { background: var(--highlight); border-color: var(--highlight); color: var(--highlight-ink); }

  .stack { display: grid; gap: 16px; margin-top: 22px; max-width: 720px; }
  .sect h2 {
    margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: .08em;
  }
  .card.light.sect h2 { color: var(--accent); }
  .sect h3 {
    margin: 14px 0 2px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em;
    color: var(--text-label);
  }

  .facts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 18px; margin: 0; }
  .facts div { display: grid; gap: 1px; }
  .facts dt { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
  .facts dd { margin: 0; font-weight: 600; }
  .facts .cap { text-transform: capitalize; }
  @media (max-width: 420px) { .facts { grid-template-columns: 1fr; } }
  .maps { display: grid; gap: 16px; margin-top: 8px; }

  .meters { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; }
  .sweet { display: flex; align-items: center; gap: 8px; }
  .sweet b { color: var(--text-strong); text-transform: capitalize; }
  @media (max-width: 420px) { .meters { grid-template-columns: 1fr; } }
  .note-line { margin: 10px 0 0; }

  .lead { margin: 0; font-size: 16px; }
  .body-line { margin: 8px 0 0; font-size: 14px; }
  .body-line b { font-weight: 700; }

  .say {
    margin: 8px 0 0; padding: 10px 14px; font-size: 15px;
    border-left: 4px solid var(--highlight-line); background: color-mix(in srgb, var(--highlight) 10%, transparent);
    border-radius: var(--radius-nav);
  }
  .objections { margin: 4px 0 0; padding-left: 18px; }
  .objections li { font-size: 13px; margin: 6px 0; color: var(--text-strong); }
  .objections li b { font-weight: 600; }

  .pairlist { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; }
  .pill.dish { text-decoration: none; padding: 8px 12px; }
  .pill.dish:hover { background: color-mix(in srgb, var(--info) 30%, transparent); }
  .compare { margin: 6px 0 0; padding-left: 18px; }
  .compare li { font-size: 14px; margin: 4px 0; }

  .drill h2 { color: var(--highlight); }
  .drillrow { display: flex; gap: 10px; flex-wrap: wrap; }

  .notfound { max-width: 520px; }
  .notfound h2 { margin: 0 0 8px; font-size: 18px; }
  .notfound p { margin: 0 0 14px; }
</style>
