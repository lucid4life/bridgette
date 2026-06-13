<script lang="ts">
  // Task H — the teach/reteach card: a printed menu page on cream paper.
  // Dish: photo band (branded no-photo placeholder until real photos land),
  // name … price leader, the menu accompaniment line, official description,
  // ingredient chunks, allergen chips + the NON-NEGOTIABLE confirm line.
  // Service: the rule + its source. Resolves with oncontinue (advance()).
  import type { TeachContent } from '$lib/journey/items';
  import { formatGlassPrice } from '$lib/journey/price';
  import { termsFor } from '$lib/journey/pronunciation';
  import { PHOTO_IDS } from './photos';
  import TermSay from './TermSay.svelte';
  import WineSay from './WineSay.svelte';

  // structure level → filled meter segments (the WSET low/medium/high scale)
  const LMH: Record<string, number> = { low: 1, medium: 2, high: 3 };

  let {
    teach,
    eyebrow,
    oncontinue,
    continueLabel = 'Continue'
  }: {
    teach: TeachContent;
    eyebrow?: string;
    oncontinue: () => void;
    continueLabel?: string;
  } = $props();

  let imgFailed = $state(false);
  let imgLoaded = $state(false);
  const hasPhoto = $derived(teach.kind === 'dish' && PHOTO_IDS.has(teach.photoId) && !imgFailed);

  // The say-it pass bar matches romanceFor's bold-first-3 rule: three
  // components — fewer when the dish only has 1-2 (ingredients are display
  // CHUNKS, so flatten before counting).
  const sayCount = $derived(
    teach.kind === 'dish' ? Math.min(3, teach.ingredients.flat().length) : 0
  );

  // $state: the heading is bound inside an {#if} branch — the effect fires
  // once the branch mounts and hands it focus (a11y: land on the new card).
  let hEl = $state<HTMLElement | null>(null);
  $effect(() => {
    hEl?.focus();
  });

  function onKey(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tgt = e.target;
    if (tgt instanceof HTMLElement && tgt.closest('button, a, input, select, textarea')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      oncontinue();
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<article class="tcard on-cream">
  {#if eyebrow}<p class="t-eyebrow">{eyebrow}</p>{/if}

  {#if teach.kind === 'dish'}
    <div class="t-photo">
      {#if hasPhoto}
        <img
          src="/img/{teach.photoId}.webp"
          alt={teach.name}
          class:show={imgLoaded}
          onload={() => (imgLoaded = true)}
          onerror={() => (imgFailed = true)}
        />
      {/if}
      {#if !hasPhoto || !imgLoaded}
        <div class="t-noimg" aria-hidden="true">
          <span class="t-initial">{teach.name.charAt(0)}</span>
          <svg class="t-cutlery" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 4v4a2 2 0 0 0 4 0V4" />
            <path d="M9 10v10" />
            <path d="M15.5 4c2.6 2.4 2.6 6.6 0 9v7" />
          </svg>
          <span class="t-noimg-label">photo coming</span>
        </div>
      {/if}
    </div>

    <div class="t-body">
      <header class="t-head">
        <h3 class="t-name" tabindex="-1" bind:this={hEl}>{teach.name}</h3>
        <span class="t-leader" aria-hidden="true"></span>
        <span class="t-price">${teach.price}</span>
      </header>
      <p class="t-menuline">{teach.menu}</p>
      <p class="t-cat"><span class="pill">{teach.category}</span></p>

      {#if teach.description}<p class="t-desc">{teach.description}</p>{/if}

      <div class="t-sec">
        <p class="t-label">components</p>
        <div class="t-chunks" style:--chunks={teach.ingredients.length}>
          {#each teach.ingredients as chunk, ci (ci)}
            <ul class="t-chunk">
              {#each chunk as ing (ing)}<li>{ing}</li>{/each}
            </ul>
          {/each}
        </div>
        <!-- the service guide's romance formula, kept in view at every teach -->
        <p class="t-sayit">say it: “This is our {teach.name}…” + {sayCount} component{sayCount === 1 ? '' : 's'}</p>
        {#if teach.memoryHook}
          <p class="t-hook"><span class="t-hook-label">the hook</span>{teach.memoryHook}</p>
        {/if}
        {#if termsFor(teach.photoId).length > 0}
          <div class="t-terms">
            <p class="t-label">say it right</p>
            <div class="t-chips">
              {#each termsFor(teach.photoId) as t (t.slug)}<TermSay term={t} />{/each}
            </div>
          </div>
        {/if}
      </div>

      {#if teach.allergens.length > 0}
        <div class="t-sec">
          <p class="t-label">allergens</p>
          <div class="t-chips">
            {#each teach.allergens as a (a)}<span class="pill alt">{a}</span>{/each}
          </div>
          {#if teach.allergenNote}<p class="t-anote">{teach.allergenNote}</p>{/if}
          <!-- safety framing: always visible wherever allergens show -->
          <p class="t-confirm">{teach.confirmLine}</p>
        </div>
      {/if}

      <div class="t-actions">
        <button type="button" class="btn" onclick={oncontinue}>{continueLabel}</button>
      </div>
    </div>
  {:else if teach.kind === 'build'}
    <div class="t-body">
      <header class="t-head">
        <h3 class="t-name" tabindex="-1" bind:this={hEl}>{teach.name}</h3>
        <span class="t-leader" aria-hidden="true"></span>
        <span class="t-price">${teach.price}</span>
      </header>
      <p class="t-cat"><span class="pill">{teach.category}</span></p>

      {#if teach.description}<p class="t-desc">{teach.description}</p>{/if}

      <div class="t-sec">
        <p class="t-label">the build</p>
        <ol class="t-build">
          {#each teach.build as part (part)}<li>{part}</li>{/each}
        </ol>
        {#if teach.flavorTags.length > 0}
          <div class="t-chips t-flavours">
            {#each teach.flavorTags as t (t)}<span class="pill">{t}</span>{/each}
          </div>
        {/if}
      </div>

      <div class="t-sec">
        <p class="t-label">what to say</p>
        <p class="t-rule t-say">{teach.say}</p>
        <p class="t-pairs">pairs with: {teach.pair}</p>
      </div>

      {#if teach.allergens.length > 0}
        <div class="t-sec">
          <p class="t-label">allergens</p>
          <div class="t-chips">
            {#each teach.allergens as a (a)}<span class="pill alt">{a}</span>{/each}
          </div>
          {#if teach.allergenNote}<p class="t-anote">{teach.allergenNote}</p>{/if}
          <p class="t-confirm">{teach.confirmLine}</p>
        </div>
      {:else}
        <p class="t-confirm t-confirm-solo">{teach.confirmLine}</p>
      {/if}

      <div class="t-actions">
        <button type="button" class="btn" onclick={oncontinue}>{continueLabel}</button>
      </div>
    </div>
  {:else if teach.kind === 'wine'}
    <div class="t-body">
      <header class="t-head">
        <h3 class="t-name" tabindex="-1" bind:this={hEl}>{teach.name}</h3>
      </header>
      <p class="t-priceladder">{formatGlassPrice(teach.price)}</p>
      <p class="t-cat">
        <span class="pill">{teach.family}</span>
        <span class="pill alt">{teach.climate} climate</span>
      </p>
      <div class="t-winesay"><WineSay name={teach.name} respell={teach.respell} audioId={teach.audioId} say={teach.say} /></div>

      <div class="t-sec">
        <p class="t-label">identity</p>
        <dl class="t-facts">
          <div><dt>grape</dt><dd>{teach.grape}</dd></div>
          <div><dt>region</dt><dd>{teach.region}</dd></div>
        </dl>
      </div>

      <div class="t-sec">
        <p class="t-label">structure</p>
        <div class="t-meters">
          {#each [['acidity', teach.structure.acidity], ['body', teach.structure.body], ['tannin', teach.structure.tannin]] as [label, level] (label)}
            <div class="t-meter">
              <span class="m-label">{label}</span>
              <span class="m-bar" role="img" aria-label="{label}: {level}">
                {#each [1, 2, 3] as seg (seg)}<span class="m-seg" class:on={seg <= LMH[level]}></span>{/each}
              </span>
              <span class="m-val">{level}</span>
            </div>
          {/each}
        </div>
        <p class="t-sweet">sweetness: <b>{teach.structure.sweetness}</b></p>
      </div>

      <div class="t-sec">
        <p class="t-label">the ten-second story</p>
        <p class="t-rule t-say">{teach.tenSecond}</p>
        {#if teach.mnemonic}<p class="t-anote">{teach.mnemonic}</p>{/if}
        {#if teach.pair.length > 0}<p class="t-pairs">pours with: {teach.pair.join(', ')}</p>{/if}
      </div>

      <div class="t-actions">
        <button type="button" class="btn" onclick={oncontinue}>{continueLabel}</button>
      </div>
    </div>
  {:else if teach.kind === 'pairing'}
    <div class="t-body">
      <header class="t-head">
        <h3 class="t-name" tabindex="-1" bind:this={hEl}>{teach.name}</h3>
      </header>
      <p class="t-cat"><span class="pill">{teach.category}</span></p>

      <div class="t-sec">
        <p class="t-label">the pour</p>
        <p class="t-rule">{teach.wine}</p>
        {#if teach.leverLabel}
          <p class="t-why"><b>{teach.leverLabel}.</b> {teach.leverScript}</p>
        {/if}
        {#if teach.why}<p class="t-pairs">{teach.why}</p>{/if}
      </div>

      {#if teach.cocktail}
        <div class="t-sec">
          <p class="t-label">not drinking wine?</p>
          <p class="t-pairs">{teach.cocktail}{teach.zero ? ` · zero-proof: ${teach.zero}` : ''}</p>
        </div>
      {/if}

      <div class="t-actions">
        <button type="button" class="btn" onclick={oncontinue}>{continueLabel}</button>
      </div>
    </div>
  {:else}
    <div class="t-body t-service">
      <p class="t-kicker">service call</p>
      <h3 class="t-name" tabindex="-1" bind:this={hEl}>{teach.name}</h3>
      <p class="t-rule">{teach.body}</p>
      <p class="t-why">{teach.why}</p>
      <div class="t-actions">
        <button type="button" class="btn" onclick={oncontinue}>{continueLabel}</button>
      </div>
    </div>
  {/if}
</article>

<style>
  /* the menu page: cream paper, terracotta top rule (coral belongs to the
     question face), floating at the top of the elevation scale */
  .tcard {
    max-width: 560px;
    margin: 0 auto;
    background: var(--surface-paper);
    color: var(--text-body);
    border-radius: var(--radius-flash);
    border-top: 3px solid var(--bb-terracotta);
    box-shadow: var(--shadow-flash);
    overflow: hidden;
    animation: card-in 0.22s ease;
  }
  @keyframes card-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .t-eyebrow {
    margin: 0;
    padding: 7px 24px;
    background: color-mix(in srgb, var(--highlight) 14%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--highlight) 30%, transparent);
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--highlight);
  }

  /* ---- photo band + branded placeholder ---- */
  /* Square band: the dish photos are overhead shots of round, centred plates —
     a 1:1 frame shows the whole plate (a 16:9 letterbox sliced it in half). */
  .t-photo {
    position: relative;
    aspect-ratio: 1 / 1;
    background: color-mix(in srgb, var(--bb-ink) 6%, var(--bb-paper));
  }
  .t-photo img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .t-photo img.show {
    opacity: 1;
  }
  .t-noimg {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 2px;
    color: var(--bb-stone);
  }
  .t-initial {
    font-family: var(--font-display);
    font-size: 56px;
    font-weight: 300;
    line-height: 1;
    color: color-mix(in srgb, var(--bb-ochre) 55%, transparent);
  }
  .t-cutlery {
    width: 22px;
    height: 22px;
    color: color-mix(in srgb, var(--bb-stone) 70%, transparent);
  }
  .t-noimg-label {
    font-family: var(--font-display);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: color-mix(in srgb, var(--bb-stone) 75%, transparent);
  }

  /* ---- body ---- */
  .t-body {
    padding: 20px 24px 24px;
  }
  .t-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .t-name {
    margin: 0;
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text-strong);
  }
  .t-name:focus {
    outline: none;
  }
  .t-leader {
    flex: 1 0 16px;
    border-bottom: 2px dotted color-mix(in srgb, var(--bb-ink) 30%, transparent);
    transform: translateY(-4px);
  }
  .t-price {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    color: var(--text-strong);
    white-space: nowrap;
  }
  .t-menuline {
    margin: 2px 0 0;
    font-size: 14px;
    font-style: italic;
    color: var(--text-muted);
  }
  .t-cat {
    margin: 10px 0 0;
  }
  .t-desc {
    margin: 14px 0 0;
    font-size: 14.5px;
    line-height: 1.55;
  }

  .t-sec {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--highlight-line) 45%, transparent);
  }
  .t-label {
    margin: 0 0 8px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-label);
  }
  .t-chunks {
    display: grid;
    grid-template-columns: repeat(var(--chunks, 4), 1fr);
    gap: 4px 14px;
  }
  @media (max-width: 480px) {
    .t-chunks {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .t-chunk {
    list-style: none;
    margin: 0;
    padding: 0 0 0 10px;
    border-left: 2px solid color-mix(in srgb, var(--highlight-line) 55%, transparent);
    display: grid;
    gap: 3px;
    align-content: start;
  }
  .t-chunk li {
    font-size: 13.5px;
    line-height: 1.35;
  }
  .t-terms { margin-top: 10px; }
  .t-sayit {
    margin: 11px 0 0;
    font-size: 12px;
    font-style: italic;
    color: var(--text-muted);
  }
  .t-hook {
    margin: 9px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-body);
  }
  .t-hook-label {
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--highlight);
    margin-right: 8px;
  }
  .t-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .t-anote {
    margin: 9px 0 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--accent-text);
  }
  .t-confirm {
    margin: 8px 0 0;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }

  /* ---- build (cocktail) variant ---- */
  .t-build {
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: build;
    display: grid;
    gap: 5px;
  }
  .t-build li {
    counter-increment: build;
    position: relative;
    padding-left: 26px;
    font-size: 14.5px;
    line-height: 1.4;
  }
  .t-build li::before {
    content: counter(build);
    position: absolute;
    left: 0;
    top: 0;
    width: 18px;
    height: 18px;
    display: grid;
    place-content: center;
    border-radius: 50%;
    background: color-mix(in srgb, var(--highlight-line) 30%, transparent);
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-label);
  }
  .t-flavours {
    margin-top: 12px;
  }
  .t-say {
    font-style: italic;
  }
  .t-pairs {
    margin: 11px 0 0;
    font-size: 13px;
    color: var(--text-muted);
  }
  .t-confirm-solo {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--highlight-line) 45%, transparent);
  }

  /* ---- wine variant ---- */
  .t-priceladder {
    margin: 2px 0 0;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text-muted);
  }
  .t-winesay {
    margin-top: 12px;
  }
  .t-facts {
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .t-facts div {
    display: flex;
    gap: 10px;
    align-items: baseline;
  }
  .t-facts dt {
    flex: 0 0 64px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-label);
  }
  .t-facts dd {
    margin: 0;
    font-size: 14px;
  }
  .t-meters {
    display: grid;
    gap: 7px;
  }
  .t-meter {
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
    letter-spacing: 0.1em;
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
    background: var(--info); /* the wine track's teal identity */
  }
  .m-val {
    font-size: 12.5px;
    color: var(--text-muted);
    min-width: 6ch;
    text-align: right;
  }
  .t-sweet {
    margin: 9px 0 0;
    font-size: 13px;
    color: var(--text-muted);
  }
  .t-sweet b {
    color: var(--text-body);
  }

  /* ---- service variant ---- */
  .t-service {
    padding-top: 24px;
  }
  .t-kicker {
    margin: 0 0 4px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-label);
  }
  .t-rule {
    margin: 12px 0 0;
    font-size: 17.5px;
    font-weight: 600;
    line-height: 1.45;
  }
  .t-why {
    margin: 14px 0 0;
    padding-left: 12px;
    border-left: 3px solid color-mix(in srgb, var(--highlight-line) 65%, transparent);
    font-size: 13px;
    font-style: italic;
    line-height: 1.5;
    color: var(--text-muted);
  }

  .t-actions {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
  .t-actions .btn {
    min-width: 200px;
    justify-content: center;
  }
</style>
