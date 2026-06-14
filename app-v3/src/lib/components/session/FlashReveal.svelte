<script lang="ts">
  // Task H — the cued/free face of the flash card. Contract (session/types.ts):
  // reveal is pure UI state; selfGrade(gotIt) (via ongrade) resolves AND
  // advances in one call — reveal-before-grade, always.
  import { tick } from 'svelte';
  import DishPhoto from './DishPhoto.svelte';

  let {
    prompt,
    hint,
    answer,
    detail,
    allergens,
    allergenNote,
    confirmLine,
    kicker,
    note,
    photoId,
    photoName,
    romance,
    confidence = false,
    ongrade
  }: {
    prompt: string;
    hint?: string;
    answer: string;
    detail?: string;
    /** allergen chips shown with the revealed answer (dish items) */
    allergens?: string[];
    allergenNote?: string;
    /** safety framing — non-negotiable wherever allergens show */
    confirmLine?: string;
    kicker?: string;
    /** dish plate on the prompt (food-anchored practice cards) — the route opts
     * in by passing it; the graded mock test omits it so it stays unseen (D5) */
    photoId?: string;
    photoName?: string;
    /** the say-it-like-this romance recital, shown on the reveal (dish cards) */
    romance?: string;
    /** small honesty line under the grade buttons (surface-specific copy) */
    note?: string;
    /** §0c: offer the optional "I wasn't sure" tap (the daily-review surfaces).
     * When set, ongrade reports 'sure' (default) or 'shaky' alongside the grade. */
    confidence?: boolean;
    ongrade: (gotIt: boolean, confidence?: 'sure' | 'shaky') => void;
  } = $props();

  let revealed = $state(false);
  let shaky = $state(false);
  let qEl: HTMLElement | null = null;
  let rvEl = $state<HTMLElement | null>(null);

  $effect(() => {
    qEl?.focus();
  });

  function reveal(): void {
    revealed = true;
    void tick().then(() => rvEl?.focus());
  }

  // The grade carries confidence only when this surface opted in; an untapped
  // "shaky" defaults to 'sure' — so a plain miss reads as a confident miss.
  const grade = (gotIt: boolean): void => ongrade(gotIt, confidence ? (shaky ? 'shaky' : 'sure') : undefined);

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
      grade(true);
    } else if (k === 'm') {
      e.preventDefault();
      grade(false);
    } else if (k === 's' && confidence && !interactive) {
      e.preventDefault();
      shaky = !shaky; // toggle the "I wasn't sure" flag (not while a control is focused)
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<article class="flash frv">
  {#if kicker}<p class="kicker">{kicker}</p>{/if}
  {#if photoId}
    <div class="q-photo"><DishPhoto thumb photoId={photoId} name={photoName ?? ''} /></div>
  {/if}
  <p class="q" tabindex="-1" bind:this={qEl}>{prompt}</p>
  {#if hint}
    <p class="hint"><span class="hint-k">hint</span> {hint}</p>
  {/if}

  {#if !revealed}
    <div class="act">
      <button type="button" class="btn" onclick={reveal}>Show answer</button>
    </div>
    <p class="think">say it out loud first — then check</p>
  {:else}
    <div class="rv" tabindex="-1" bind:this={rvEl}>
      <p class="ans">{answer}</p>
      {#if romance}
        <p class="say"><span class="say-k">say it like this</span>{romance}</p>
      {/if}
      {#if detail}<p class="detail">{detail}</p>{/if}
      {#if allergens && allergens.length > 0}
        <div class="allerg">
          <div class="al-chips">
            {#each allergens as a (a)}<span class="pill alt">{a}</span>{/each}
          </div>
          {#if allergenNote}<p class="al-note">{allergenNote}</p>{/if}
          <!-- safety framing: always visible wherever allergens show -->
          {#if confirmLine}<p class="al-confirm">{confirmLine}</p>{/if}
        </div>
      {:else if confirmLine}
        <!-- safety framing rides EVERY reveal that carries it (e.g. an unflagged
             cocktail still gets the bar-confirm line) — never gated behind flags -->
        <p class="al-confirm solo">{confirmLine}</p>
      {/if}
      {#if confidence}
        <button
          type="button"
          class="shaky-tog"
          class:on={shaky}
          aria-pressed={shaky}
          onclick={() => (shaky = !shaky)}
        >
          <span class="st-tick" aria-hidden="true"></span>
          <span class="st-t">{shaky ? 'I wasn’t sure on this one' : 'I wasn’t sure?'}</span>
        </button>
      {/if}
      <div class="gradebar">
        <button type="button" class="btn" onclick={() => grade(true)}>Got it</button>
        <button type="button" class="btn ghost" onclick={() => grade(false)}>Missed it</button>
      </div>
      {#if note}<p class="note-line">{note}</p>{/if}
    </div>
  {/if}

  <!-- persistent live region: mounted before its text changes (SR announce) -->
  <p class="visually-hidden" aria-live="polite" aria-atomic="true">
    {revealed ? 'Answer: ' + answer + '.' + (romance ? ' Say it like this: ' + romance : '') : ''}
  </p>
</article>

<style>
  .frv {
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
  .q:focus,
  .rv:focus {
    outline: none;
  }
  .hint {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
  }
  .hint-k {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--highlight);
    margin-right: 6px;
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
  .rv {
    display: grid;
    gap: 10px;
    animation: card-in 0.2s ease;
  }
  .ans {
    margin: 0;
    color: var(--accent);
    font-weight: 800;
    font-size: 17px;
    line-height: 1.4;
  }
  .detail {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--text-muted);
  }
  .q-photo {
    margin: 0 0 2px;
  }
  /* the say-it-like-this romance recital — the line to memorize and say at the
     drop (the model, distinct from the literal component answer above it) */
  .say {
    margin: 0;
    text-align: left;
    padding: 9px 13px;
    border-left: 3px solid var(--highlight-line);
    background: color-mix(in srgb, var(--highlight) 8%, transparent);
    border-radius: 0 10px 10px 0;
    font-size: 14px;
    font-style: italic;
    line-height: 1.5;
    color: var(--text-body);
  }
  .say-k {
    display: block;
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--highlight);
    margin-bottom: 3px;
  }
  /* compact allergen framing under the answer (chips are the global .pill.alt) */
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
  .al-confirm.solo {
    text-align: center;
    margin-top: 4px;
  }
  .note-line {
    margin: 2px 0 0;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }
  /* §0c: the optional "I wasn't sure" confidence flag (daily-review reveals) */
  .shaky-tog {
    justify-self: center;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 11px;
    border-radius: var(--radius-chip, 999px);
    border: 1.5px solid color-mix(in srgb, var(--text-label) 40%, transparent);
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  }
  .shaky-tog:hover {
    border-color: var(--accent-text);
    color: var(--text-body);
  }
  .st-tick {
    width: 13px;
    height: 13px;
    border-radius: 4px;
    /* a clearly-visible empty box in the OFF state (the label + aria-pressed
       carry the state too — this is reinforcement, not the only signal) */
    border: 1.5px solid color-mix(in srgb, var(--text-label) 80%, transparent);
    position: relative;
    flex: none;
  }
  .shaky-tog.on {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    border-color: var(--accent-text);
    color: var(--text-strong);
  }
  .shaky-tog.on .st-tick {
    background: var(--accent-text);
    border-color: var(--accent-text);
  }
  .shaky-tog.on .st-tick::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 1px;
    width: 3.5px;
    height: 7px;
    border: solid var(--bb-paper);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
</style>
