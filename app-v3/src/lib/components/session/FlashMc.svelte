<script lang="ts">
  // Task H — the MC face of the cream flash card. Contract (session/types.ts):
  // answerMc(i) returns {correct, answerIndex} and the step STAYS current —
  // feedback renders ON the card until the Continue calls oncontinue (advance).
  // `warm` = pretest framing: a miss is the point, never an alarm.
  import { tick } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import type { McContent } from '$lib/journey/items';
  import type { McAnswer } from '$lib/session';

  let {
    mc,
    warm = false,
    kicker,
    onanswer,
    oncontinue
  }: {
    mc: McContent;
    warm?: boolean;
    kicker?: string;
    onanswer: (choiceIndex: number) => McAnswer;
    oncontinue: () => void;
  } = $props();

  let chosen = $state<number | null>(null);
  let result = $state<McAnswer | null>(null);
  let qEl: HTMLElement | null = null;
  let fbEl = $state<HTMLElement | null>(null);

  // Land focus on the prompt when the card mounts (v2 a11y pattern).
  $effect(() => {
    qEl?.focus();
  });

  function choose(i: number): void {
    if (result) return;
    chosen = i;
    result = onanswer(i);
    void tick().then(() => fbEl?.focus());
  }

  const feedback = $derived(
    !result
      ? ''
      : result.correct
        ? warm
          ? 'nailed it — already on the board.'
          : 'nailed it.'
        : warm
          ? "good miss — that's the point of a warm-up. the right call is marked."
          : "not quite — the right call is marked. it'll come back around."
  );

  function onKey(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tgt = e.target;
    const interactive =
      tgt instanceof HTMLElement && !!tgt.closest('button, a, input, select, textarea');
    if (!result) {
      const i = parseInt(e.key, 10) - 1;
      if (i >= 0 && i < mc.choices.length) {
        e.preventDefault();
        choose(i);
      }
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && !interactive) {
      e.preventDefault();
      oncontinue();
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<article class="flash fmc">
  {#if kicker}<p class="kicker">{kicker}</p>{/if}
  <p class="q" tabindex="-1" bind:this={qEl}>{mc.prompt}</p>

  <div class="choices" role="group" aria-label="Answer choices">
    {#each mc.choices as choice, i (i)}
      <button
        type="button"
        class="choice"
        class:right={result !== null && i === result.answerIndex}
        class:missed={result !== null && chosen === i && !result.correct}
        disabled={result !== null}
        onclick={() => choose(i)}
      >
        <span class="n" aria-hidden="true">{i + 1}</span>
        <span class="t">{choice}</span>
        {#if result !== null && i === result.answerIndex}
          <span class="tick"><Icon name="check" size={16} /></span>
        {/if}
      </button>
    {/each}
  </div>

  {#if result}
    <div class="fb" tabindex="-1" bind:this={fbEl}>
      <p class="fb-line" class:good={result.correct} class:warm={!result.correct && warm} class:miss={!result.correct && !warm}>
        {feedback}
      </p>
      <button type="button" class="btn" onclick={oncontinue}>Continue</button>
    </div>
  {/if}

  <!-- persistent live region: mounted before its text changes (SR announce) -->
  <p class="visually-hidden" aria-live="polite" aria-atomic="true">
    {result
      ? (result.correct ? 'Correct. ' : 'Not quite. ') +
        'The answer is ' +
        mc.choices[result.answerIndex] +
        '.'
      : ''}
  </p>
</article>

<style>
  .fmc {
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
  .q:focus {
    outline: none; /* programmatic landing spot, not an interactive control */
  }
  .choices {
    display: grid;
    gap: 9px;
    text-align: left;
  }
  .choice {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    min-height: 48px;
    padding: 11px 13px;
    border: 1px solid var(--line);
    border-radius: var(--radius-btn);
    background: var(--surface-card-soft);
    text-align: left;
    font-size: 15px;
    line-height: 1.35;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .choice:not(:disabled):hover {
    background: var(--surface-hover-strong);
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  }
  .choice:disabled {
    cursor: default;
    opacity: 0.55;
  }
  .choice.right:disabled,
  .choice.missed:disabled {
    opacity: 1;
  }
  .choice.right {
    border-color: color-mix(in srgb, var(--ok) 65%, transparent);
    background: color-mix(in srgb, var(--ok) 12%, transparent);
    font-weight: 700;
  }
  /* the missed pick stays warm — ochre, never alarm-red */
  .choice.missed {
    border-color: color-mix(in srgb, var(--highlight) 60%, transparent);
    border-style: dashed;
    background: color-mix(in srgb, var(--highlight) 9%, transparent);
  }
  .n {
    flex: none;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    background: var(--surface-card);
  }
  .choice.right .n {
    color: var(--text-strong);
  }
  .t {
    flex: 1;
    min-width: 0;
  }
  .tick {
    flex: none;
    color: color-mix(in srgb, var(--ok) 70%, var(--text-strong));
  }
  .fb {
    display: grid;
    gap: 12px;
    justify-items: center;
  }
  .fb:focus {
    outline: none;
  }
  .fb-line {
    margin: 0;
    font-size: 14.5px;
    font-weight: 700;
  }
  .fb-line.good {
    color: color-mix(in srgb, var(--ok) 70%, var(--text-strong));
  }
  .fb-line.warm {
    color: var(--highlight);
  }
  .fb-line.miss {
    color: var(--accent-text);
  }
</style>
