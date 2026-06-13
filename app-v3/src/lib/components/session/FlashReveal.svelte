<script lang="ts">
  // Task H — the cued/free face of the flash card. Contract (session/types.ts):
  // reveal is pure UI state; selfGrade(gotIt) (via ongrade) resolves AND
  // advances in one call — reveal-before-grade, always.
  import { tick } from 'svelte';

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
    /** small honesty line under the grade buttons (surface-specific copy) */
    note?: string;
    ongrade: (gotIt: boolean) => void;
  } = $props();

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

<article class="flash frv">
  {#if kicker}<p class="kicker">{kicker}</p>{/if}
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
      <div class="gradebar">
        <button type="button" class="btn" onclick={() => ongrade(true)}>Got it</button>
        <button type="button" class="btn ghost" onclick={() => ongrade(false)}>Missed it</button>
      </div>
      {#if note}<p class="note-line">{note}</p>{/if}
    </div>
  {/if}

  <!-- persistent live region: mounted before its text changes (SR announce) -->
  <p class="visually-hidden" aria-live="polite" aria-atomic="true">
    {revealed ? 'Answer: ' + answer + '.' : ''}
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
</style>
