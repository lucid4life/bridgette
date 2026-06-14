<script lang="ts">
  // The Romance drill's face: a printed-menu question card. Name set BIG like
  // a menu headline; reveal shows the PASS BAR (the official first-3
  // components, numbered like courses), the official description as the model
  // line, the full component list compact, and the non-negotiable allergen
  // framing. Contract matches FlashReveal: reveal is pure UI state;
  // selfGrade(gotIt) (via ongrade) resolves AND advances in one call.
  import { tick } from 'svelte';
  import type { RomanceContent } from '$lib/journey/items';
  import DishPhoto from './DishPhoto.svelte';

  let {
    content,
    kicker = 'say it like you’re setting it down',
    ongrade
  }: {
    content: RomanceContent;
    kicker?: string;
    ongrade: (gotIt: boolean) => void;
  } = $props();

  // "9" → "$9"; "varies" stays as written (same rule as the Playbook).
  const price = $derived(/^\d/.test(content.price) ? '$' + content.price : content.price);
  const targetCount = $derived(content.romanceTargets.length);

  let revealed = $state(false);
  let qEl: HTMLElement | null = null;
  let rvEl = $state<HTMLElement | null>(null);

  $effect(() => {
    qEl?.focus();
  });

  function reveal(): void {
    revealed = true;
    void tick().then(() => rvEl?.focus());
  }

  function onKey(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tgt = e.target;
    const interactive =
      tgt instanceof HTMLElement && !!tgt.closest('button, a, input, select, textarea');
    if (!revealed) {
      if ((e.key === 'Enter' || e.key === ' ') && !interactive) {
        e.preventDefault();
        reveal();
      }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'g') {
      e.preventDefault();
      ongrade(true);
    } else if (k === 'm') {
      e.preventDefault();
      ongrade(false);
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<article class="flash rom">
  <p class="kicker">{kicker}</p>
  <p class="r-name" tabindex="-1" bind:this={qEl}>{content.name}</p>
  <p class="r-meta">{content.category}<span class="r-dot" aria-hidden="true"></span>{price}</p>
  <p class="r-prompt">“This is our {content.name}…” — plus the {targetCount === 3 ? 'three' : targetCount} things that matter.</p>

  {#if !revealed}
    <div class="act">
      <button type="button" class="btn" onclick={reveal}>Check yourself</button>
    </div>
    <p class="think">out loud — actually out loud. then check.</p>
  {:else}
    <div class="rv" tabindex="-1" bind:this={rvEl}>
      <!-- the plate, on the REVEAL only — seeing it before recall would give the
           answer away; here it anchors the line you just said (§0b dual coding) -->
      <div class="r-photo"><DishPhoto photoId={content.photoId} name={content.name} /></div>

      <div class="passbar">
        <p class="pb-label">the pass bar — say these {targetCount}</p>
        <ol class="targets" aria-label="The components your line must carry">
          {#each content.romanceTargets as t, i (t)}
            <li><span class="t-n" aria-hidden="true">{i + 1}</span><span class="t-t">{t}</span></li>
          {/each}
        </ol>
      </div>

      <blockquote class="model">
        <p class="m-label">say it like</p>
        <p class="m-line">“{content.modelLine}”</p>
      </blockquote>

      {#if content.memoryHook}
        <p class="hook"><span class="hook-label">the hook</span>{content.memoryHook}</p>
      {/if}

      <p class="all-comps"><span class="ac-label">all of it:</span> {content.ingredients.join(', ')}</p>

      {#if content.allergens && content.allergens.length > 0}
        <div class="allerg">
          <div class="al-chips">
            {#each content.allergens as a (a)}<span class="pill alt">{a}</span>{/each}
          </div>
          {#if content.allergenNote}<p class="al-note">{content.allergenNote}</p>{/if}
          <!-- safety framing: always visible wherever allergens show -->
          {#if content.confirmLine}<p class="al-confirm">{content.confirmLine}</p>{/if}
        </div>
      {/if}

      <div class="gradezone">
        <p class="g-ask">named it + {targetCount} components?</p>
        <div class="gradebar">
          <button type="button" class="btn" onclick={() => ongrade(true)}>Got it</button>
          <button type="button" class="btn ghost" onclick={() => ongrade(false)}>Missed it</button>
        </div>
        <p class="note-line">honest call — misses come back until they’re clean</p>
      </div>
    </div>
  {/if}

  <!-- persistent live region: mounted before its text changes (SR announce) -->
  <p class="visually-hidden" aria-live="polite" aria-atomic="true">
    {revealed ? 'Pass bar: ' + content.romanceTargets.join(', ') + '.' : ''}
  </p>
</article>

<style>
  .rom {
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
  .kicker {
    margin: 0;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-label);
  }
  /* the dish name owns the card — a menu headline, not a question line */
  .r-name {
    margin: 2px 0 0;
    font-family: var(--font-display);
    font-size: clamp(30px, 7vw, 42px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: 0.01em;
    color: var(--text-strong);
  }
  .r-name:focus,
  .rv:focus {
    outline: none;
  }
  .r-meta {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-family: var(--font-display);
    font-size: 12.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }
  .r-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--highlight-line);
  }
  .r-prompt {
    margin: 0;
    font-size: 14px;
    font-style: italic;
    color: var(--text-muted);
    max-width: 36ch;
    justify-self: center;
  }
  .act {
    display: flex;
    justify-content: center;
  }
  .think {
    margin: 0;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }

  /* ---- revealed ---- */
  .rv {
    display: grid;
    gap: 14px;
    animation: card-in 0.2s ease;
  }
  /* a contained, rounded plate (the teach band is full-bleed; on the reveal it's
     a centred square that reinforces without crowding the pass bar) */
  .r-photo {
    width: min(240px, 100%);
    margin: 0 auto;
    border-radius: var(--radius-card);
    overflow: hidden;
    box-shadow: var(--shadow-1);
  }
  .passbar {
    display: grid;
    gap: 8px;
  }
  .pb-label {
    margin: 0;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--highlight);
  }
  .targets {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
    justify-content: center;
  }
  .targets li {
    display: flex;
    align-items: baseline;
    gap: 10px;
    text-align: left;
  }
  .t-n {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    color: var(--highlight);
    border-bottom: 2px solid var(--highlight-line);
    padding: 0 2px 1px;
  }
  .t-t {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--accent);
  }

  /* the official description, quoted as the model sentence */
  .model {
    margin: 0;
    padding: 10px 14px;
    text-align: left;
    border-left: 3px solid var(--highlight-line);
    background: color-mix(in srgb, var(--highlight) 8%, transparent);
    border-radius: 0 10px 10px 0;
  }
  .m-label {
    margin: 0 0 3px;
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-label);
  }
  .m-line {
    margin: 0;
    font-size: 13px;
    font-style: italic;
    line-height: 1.55;
    color: var(--text-body);
  }

  .hook {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-body);
    text-align: left;
  }
  .hook-label {
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--highlight);
    margin-right: 8px;
  }
  .all-comps {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--text-muted);
  }
  .ac-label {
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-right: 4px;
  }

  /* compact allergen framing (chips are the global .pill.alt) */
  .allerg {
    display: grid;
    gap: 6px;
    justify-items: center;
  }
  .al-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  .al-note {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--accent-text);
  }
  .al-confirm {
    margin: 0;
    font-size: 12px;
    font-style: italic;
    color: var(--text-muted);
  }

  .gradezone {
    display: grid;
    gap: 2px;
  }
  .g-ask {
    margin: 0;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--text-strong);
  }
  .gradebar {
    margin-top: 10px;
  }
  .note-line {
    margin: 8px 0 0;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }
</style>
