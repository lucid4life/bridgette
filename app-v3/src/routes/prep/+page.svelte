<script lang="ts">
  // /prep — "Prep my bottle": the Wednesday-tasting / assigned-bottle prep tool.
  // Pick any pour (17 by-the-glass + 38 by-the-bottle) → study its deep-dive →
  // a 5-question self-check (self-rated) → a 60-second preshift presentation
  // script you can read like a teleprompter. Not a path module, not graded — a
  // standalone study surface over the official wine records.
  import { goto } from '$app/navigation';
  import Icon from '$lib/components/Icon.svelte';
  import WineSay from '$lib/components/session/WineSay.svelte';
  import { data } from '$lib/data';
  import { loadFullMenu } from '$lib/data/fullmenu';
  import { stageStatus } from '$lib/journey/gating';
  import {
    bottleToPrep,
    glassToPrep,
    prepScript,
    prepSelfCheck,
    type PrepWine
  } from '$lib/journey/prep';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  const LMH: Record<string, number> = { low: 1, medium: 2, high: 3 };

  // Gate to the unlocked Wine stage — this is the wine stage's companion tool and
  // has nothing to teach a server who has not reached wine yet. The render gate
  // below also holds on wineLocked so no pour content paints during the redirect.
  const wineLocked = $derived(
    progress.ready && stageStatus('wine', progressView(progress.state)) === 'locked'
  );
  $effect(() => {
    if (wineLocked) void goto('/');
  });

  // Load the unified pour list: glass pours are bundled (instant); bottles come
  // from the fetched full menu. A failed fetch falls back to the 17 glass pours.
  let wines = $state<PrepWine[] | null>(null);
  let loadError = $state(false);
  let started = false;
  $effect(() => {
    // Only load once the gate has CLEARED (ready + unlocked) — a locked user is
    // redirected and never triggers the ~100KB full-menu fetch. (started is
    // instance-scoped, so re-entering /prep retries a failed fetch.)
    if (!progress.ready || wineLocked || started) return;
    started = true;
    const glass = data.wines.map(glassToPrep);
    wines = glass; // the 17 glass pours render immediately
    loadFullMenu()
      .then((fm) => {
        wines = [...glass, ...fm.bottles.map(bottleToPrep)];
      })
      .catch(() => {
        loadError = true; // keep glass-only
      });
  });

  type Phase = 'pick' | 'study' | 'check' | 'script';
  let phase = $state<Phase>('pick');
  let selected = $state<PrepWine | null>(null);
  let query = $state('');

  // grouped + filtered picker list
  const FAMILY_ORDER = ['Bubbles & Rosé', 'Bright & Crisp Whites', 'Round Whites', 'Light Reds', 'Structured Reds'];
  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const pool = wines ?? [];
    return q
      ? pool.filter(
          (w) =>
            w.name.toLowerCase().includes(q) ||
            w.grape.toLowerCase().includes(q) ||
            w.region.toLowerCase().includes(q)
        )
      : pool;
  });
  const groups = $derived.by(() => {
    const by = new Map<string, PrepWine[]>();
    for (const w of filtered) {
      const k = FAMILY_ORDER.includes(w.family) ? w.family : 'Other';
      (by.get(k) ?? by.set(k, []).get(k)!).push(w);
    }
    return [...FAMILY_ORDER, 'Other'].filter((f) => by.has(f)).map((f) => ({ family: f, wines: by.get(f)! }));
  });

  function pick(w: PrepWine): void {
    selected = w;
    phase = 'study';
    resetCheck();
  }

  // self-check state
  const questions = $derived(selected ? prepSelfCheck(selected) : []);
  let qIdx = $state(0);
  let revealed = $state(false);
  let got = $state<boolean[]>([]);
  function resetCheck(): void {
    qIdx = 0;
    revealed = false;
    got = [];
  }
  function startCheck(): void {
    resetCheck();
    phase = 'check';
  }
  function rate(ok: boolean): void {
    got = [...got, ok];
    revealed = false;
    qIdx += 1;
  }
  const checkDone = $derived(phase === 'check' && qIdx >= questions.length);
  const checkScore = $derived(got.filter(Boolean).length);

  const script = $derived(selected ? prepScript(selected) : []);
</script>

<svelte:head><title>Prep my bottle · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready || wineLocked || wines === null}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the bottle list</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if phase === 'pick'}
    <p class="h-eyebrow">for the wednesday tasting</p>
    <h1>Prep my bottle</h1>
    <p class="sub">Pick your pour — study it, test yourself, then build a sixty-second script to present at preshift.</p>
    {#if loadError}<p class="warn">Couldn't load the by-the-bottle list — showing the by-the-glass pours.</p>{/if}

    <label class="search">
      <Icon name="speaker" size={16} />
      <input type="search" placeholder="search by name, grape or region…" bind:value={query} aria-label="Search wines" />
    </label>

    {#each groups as g (g.family)}
      <section class="grp">
        <h2 class="grp-h">{g.family}</h2>
        <ul class="grp-list">
          {#each g.wines as w (w.id)}
            <li>
              <button type="button" class="pick" onclick={() => pick(w)}>
                <span class="p-name">{w.name}</span>
                <span class="p-meta">{w.grape} · {w.kind === 'glass' ? 'by the glass' : 'bottle'}</span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
    {#if filtered.length === 0}<p class="sub">No pour matches “{query}”.</p>{/if}

  {:else if selected && phase === 'study'}
    {@const w = selected}
    <button type="button" class="back" onclick={() => (phase = 'pick')}><Icon name="slow" size={14} /> all pours</button>
    <article class="deep on-cream">
      <p class="d-eyebrow">{w.kind === 'glass' ? 'by the glass' : 'by the bottle'} · {w.family}</p>
      <h1 class="d-name">{w.name}</h1>
      <p class="d-price">{w.price}{w.exclusive ? ' · exclusive' : ''}{w.vegan ? ' · vegan' : ''}</p>
      <div class="d-say"><WineSay name={w.name} respell={w.respell} audioId={w.id} say={w.say} /></div>

      <div class="d-sec">
        <p class="d-label">identity</p>
        <dl class="d-facts">
          <div><dt>grape</dt><dd>{w.grape}</dd></div>
          <div><dt>region</dt><dd>{w.region}, {w.country}</dd></div>
          {#if w.vintage}<div><dt>vintage</dt><dd>{w.vintage}</dd></div>{/if}
          <div><dt>climate</dt><dd>{w.climate}</dd></div>
        </dl>
      </div>

      <div class="d-sec">
        <p class="d-label">structure</p>
        <div class="d-meters">
          {#each [['acidity', w.structure.acidity], ['body', w.structure.body], ['tannin', w.structure.tannin]] as [label, level] (label)}
            <div class="d-meter">
              <span class="m-label">{label}</span>
              <span class="m-bar" role="img" aria-label="{label}: {level}">
                {#each [1, 2, 3] as seg (seg)}<span class="m-seg" class:on={seg <= LMH[level]}></span>{/each}
              </span>
              <span class="m-val">{level}</span>
            </div>
          {/each}
        </div>
        <p class="d-sweet">sweetness: <b>{w.structure.sweetness}</b></p>
      </div>

      <div class="d-sec">
        <p class="d-label">the story</p>
        <p class="d-lead">{w.tenSecond}</p>
        {#if w.profile}<p class="d-body">{w.profile}</p>{/if}
        {#if w.producerStory}<p class="d-sub"><b>the producer:</b> {w.producerStory}</p>{/if}
        <p class="d-sub"><b>why we pour it:</b> {w.whyWePourIt}</p>
      </div>

      {#if w.pair.length > 0}
        <div class="d-sec">
          <p class="d-label">pairings</p>
          <p class="d-body">{w.pair.join(', ')}</p>
          {#if w.pairWhy}<p class="d-sub">{w.pairWhy}</p>{/if}
        </div>
      {/if}

      {#if w.objections && w.objections.length > 0}
        <div class="d-sec">
          <p class="d-label">if the guest pushes back</p>
          {#each w.objections as o (o.cue)}
            <p class="d-obj"><b>“{o.cue}”</b> — {o.reply}</p>
          {/each}
        </div>
      {/if}

      {#if w.mnemonic}<p class="d-mnem">{w.mnemonic}</p>{/if}

      <div class="d-actions">
        <button type="button" class="btn" onclick={startCheck}>test myself</button>
        <button type="button" class="btn ghost" onclick={() => (phase = 'script')}>build my script</button>
      </div>
    </article>

  {:else if selected && phase === 'check'}
    {@const w = selected}
    <button type="button" class="back" onclick={() => (phase = 'study')}><Icon name="slow" size={14} /> back to {w.name}</button>
    {#if checkDone}
      <article class="card-room">
        <p class="r-eyebrow">self-check done</p>
        <h1 class="r-title">{checkScore}/{questions.length} from memory</h1>
        <p class="sub">{checkScore === questions.length ? 'you have this bottle cold. now build the script and say it out loud.' : 'study the gaps, then build the script and rehearse it out loud.'}</p>
        <div class="d-actions">
          <button type="button" class="btn" onclick={() => (phase = 'script')}>build my script</button>
          <button type="button" class="btn ghost" onclick={() => (phase = 'study')}>study again</button>
        </div>
      </article>
    {:else}
      {@const q = questions[qIdx]}
      <article class="check on-cream">
        <p class="c-eyebrow">self-check · {qIdx + 1} of {questions.length}</p>
        <p class="c-q">{q.prompt}</p>
        {#if !revealed}
          <button type="button" class="btn" onclick={() => (revealed = true)}>show answer</button>
          <p class="c-think">answer it out loud first — then check</p>
        {:else}
          <p class="c-a">{q.answer}</p>
          <div class="c-rate">
            <button type="button" class="btn" onclick={() => rate(true)}>got it</button>
            <button type="button" class="btn ghost" onclick={() => rate(false)}>missed it</button>
          </div>
        {/if}
      </article>
    {/if}

  {:else if selected && phase === 'script'}
    {@const w = selected}
    <button type="button" class="back" onclick={() => (phase = 'study')}><Icon name="slow" size={14} /> back to {w.name}</button>
    <article class="script on-cream">
      <p class="s-eyebrow">sixty-second presentation</p>
      <h1 class="s-name">{w.name}</h1>
      <p class="sub">Read it top to bottom — that's your preshift pour, start to finish.</p>
      <ol class="s-beats">
        {#each script as beat (beat.label)}
          <li>
            <span class="s-label">{beat.label}</span>
            <span class="s-line">{beat.line}</span>
          </li>
        {/each}
      </ol>
      <div class="d-actions">
        <button type="button" class="btn" onclick={startCheck}>test myself</button>
        <button type="button" class="btn ghost" onclick={() => (phase = 'pick')}>prep another</button>
      </div>
    </article>
  {/if}
</div>

<style>
  .warn {
    margin: 8px 0 0;
    font-size: 13px;
    color: var(--accent-text);
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 16px 0 18px;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--surface-card);
    color: var(--text-muted);
  }
  .search input {
    flex: 1;
    border: none;
    background: none;
    color: var(--text-body);
    font: inherit;
    min-height: 28px;
  }
  .search input:focus {
    outline: none;
  }
  .grp {
    margin-bottom: 18px;
  }
  .grp-h {
    margin: 0 0 8px;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--info);
  }
  .grp-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .pick {
    width: 100%;
    text-align: left;
    display: grid;
    gap: 2px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--surface-card);
    color: inherit;
  }
  .pick:hover {
    background: var(--surface-hover);
    border-color: color-mix(in srgb, var(--info) 45%, transparent);
  }
  .p-name {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .p-meta {
    font-size: 12.5px;
    color: var(--text-muted);
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 12px;
    padding: 4px 2px;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 13.5px;
    min-height: 36px;
  }
  .back:hover {
    color: var(--accent-text);
  }

  /* ---- deep-dive + check + script share the cream-card room ---- */
  .deep,
  .check,
  .script,
  .card-room {
    max-width: 560px;
    margin: 0 auto;
    padding: 22px 24px 24px;
    background: var(--surface-paper);
    color: var(--text-body);
    border-radius: var(--radius-flash);
    border-top: 3px solid var(--info); /* teal — the wine room */
    box-shadow: var(--shadow-flash);
    animation: card-in 0.22s ease;
  }
  .card-room {
    text-align: center;
  }
  @keyframes card-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: none; }
  }
  .d-eyebrow,
  .c-eyebrow,
  .s-eyebrow,
  .r-eyebrow {
    margin: 0 0 4px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    /* text-safe teal on cream (raw --info fails AA as text — the sanctioned
       per-track-room exception, same as the allergens page's --bb-teal-deep) */
    color: var(--bb-teal-deep);
  }
  .d-name,
  .s-name,
  .r-title {
    margin: 0;
    font-size: clamp(24px, 4.5vw, 32px);
    font-weight: 600;
    line-height: 1.05;
    color: var(--text-strong);
  }
  .d-price {
    margin: 4px 0 0;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .d-say {
    margin-top: 12px;
  }
  .d-sec {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--info) 30%, transparent);
  }
  .d-label {
    margin: 0 0 8px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-label);
  }
  .d-facts {
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .d-facts div {
    display: flex;
    gap: 10px;
    align-items: baseline;
  }
  .d-facts dt {
    flex: 0 0 64px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-label);
  }
  .d-facts dd {
    margin: 0;
    font-size: 14px;
  }
  .d-meters {
    display: grid;
    gap: 7px;
  }
  .d-meter {
    display: grid;
    grid-template-columns: 64px 1fr auto;
    align-items: center;
    gap: 10px;
  }
  .m-label {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-label);
  }
  .m-bar {
    display: inline-flex;
    gap: 4px;
  }
  .m-seg {
    flex: 1;
    height: 8px;
    border-radius: 3px;
    background: var(--surface-track);
  }
  .m-seg.on {
    background: var(--info);
  }
  .m-val {
    font-size: 12.5px;
    color: var(--text-muted);
    min-width: 6ch;
    text-align: right;
  }
  .d-sweet {
    margin: 9px 0 0;
    font-size: 13px;
    color: var(--text-muted);
  }
  .d-sweet b {
    color: var(--text-body);
  }
  .d-lead {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
  }
  .d-body {
    margin: 10px 0 0;
    font-size: 14px;
    line-height: 1.55;
  }
  .d-sub {
    margin: 9px 0 0;
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--text-muted);
  }
  .d-sub b {
    color: var(--text-body);
  }
  .d-obj {
    margin: 8px 0 0;
    font-size: 13.5px;
    line-height: 1.5;
  }
  .d-mnem {
    margin: 16px 0 0;
    padding: 10px 12px;
    border-left: 3px solid color-mix(in srgb, var(--info) 60%, transparent);
    font-size: 13px;
    font-style: italic;
    color: var(--text-muted);
  }
  .d-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-top: 22px;
  }

  /* ---- self-check ---- */
  .c-q {
    margin: 8px 0 18px;
    font-size: 19px;
    font-weight: 600;
    line-height: 1.4;
    text-align: center;
  }
  .check {
    text-align: center;
  }
  .c-think {
    margin: 12px 0 0;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }
  .c-a {
    margin: 0 0 16px;
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-strong);
  }
  .c-rate {
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  /* ---- script teleprompter ---- */
  .s-beats {
    list-style: none;
    margin: 18px 0 0;
    padding: 0;
    counter-reset: beat;
    display: grid;
    gap: 12px;
  }
  .s-beats li {
    counter-increment: beat;
    display: grid;
    gap: 3px;
    padding: 12px 14px 12px 40px;
    position: relative;
    border-radius: var(--radius-card);
    background: var(--surface-card);
  }
  .s-beats li::before {
    content: counter(beat);
    position: absolute;
    left: 12px;
    top: 12px;
    width: 20px;
    height: 20px;
    display: grid;
    place-content: center;
    border-radius: 50%;
    background: color-mix(in srgb, var(--info) 22%, transparent);
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    color: var(--bb-teal-deep);
  }
  .s-label {
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-label);
  }
  .s-line {
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-strong);
  }

  .sk {
    background: var(--surface-card);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    margin: 0 auto 16px;
    animation: sk-pulse 1.2s ease-in-out infinite alternate;
  }
  .head-sk {
    max-width: 560px;
    height: 84px;
  }
  .card-sk {
    max-width: 560px;
    height: 320px;
    border-radius: var(--radius-flash);
  }
  @keyframes sk-pulse {
    from { opacity: 0.55; }
    to { opacity: 1; }
  }
</style>
