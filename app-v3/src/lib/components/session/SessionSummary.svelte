<script lang="ts">
  // Task H — the end-of-session card: marigold-ruled paper (gold = the
  // achievement moment), a score ring OR a check motif, stats, the miss list
  // (names, never ids), and THE next action via the children snippet.
  import type { Snippet } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';

  let {
    eyebrow,
    title,
    ringPct,
    ringText,
    stats = [],
    missesTitle = 'worth a second look',
    misses = [],
    note,
    extra,
    children
  }: {
    eyebrow: string;
    title: string;
    /** show the conic ring at this percentage (omit for the check motif) */
    ringPct?: number;
    ringText?: string;
    stats?: { label: string; value: string | number }[];
    missesTitle?: string;
    misses?: { label: string; href?: string }[];
    note?: string;
    /** surface-specific breakdowns rendered between the note and the misses
     * (markup is authored — and styled — by the caller) */
    extra?: Snippet;
    children?: Snippet;
  } = $props();

  let hEl: HTMLElement | null = null;
  $effect(() => {
    hEl?.focus();
  });

  // animate the ring up from 0 (the global reduced-motion rule stills it)
  let p = $state(0);
  $effect(() => {
    if (ringPct === undefined) return;
    const id = requestAnimationFrame(() => (p = ringPct));
    return () => cancelAnimationFrame(id);
  });
</script>

<section class="sum">
  <div class="sum-card on-cream">
    {#if ringPct !== undefined}
      <div class="ring" style:--p={p} role="img" aria-label={ringText ?? Math.round(ringPct) + '%'}>
        <span>{ringText ?? Math.round(ringPct) + '%'}</span>
      </div>
    {:else}
      <div class="check-motif" aria-hidden="true"><Icon name="check" size={34} /></div>
    {/if}

    <p class="sum-eyebrow">{eyebrow}</p>
    <h2 class="sum-title" tabindex="-1" bind:this={hEl}>{title}</h2>

    {#if stats.length > 0}
      <dl class="sum-stats">
        {#each stats as s (s.label)}
          <div class="stat-cell">
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        {/each}
      </dl>
    {/if}

    {#if note}<p class="sum-note">{note}</p>{/if}

    {#if extra}{@render extra()}{/if}

    {#if misses.length > 0}
      <div class="sum-misses">
        <p class="sum-mt">{missesTitle}</p>
        <ul>
          {#each misses as m (m.label)}
            <li>
              {#if m.href}<a href={m.href}>{m.label}</a>{:else}{m.label}{/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="sum-actions">{@render children?.()}</div>
  </div>
</section>

<style>
  .sum {
    animation: card-in 0.25s ease;
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
  .sum-card {
    max-width: 520px;
    margin: 0 auto;
    padding: 30px 28px;
    background: var(--surface-paper);
    color: var(--text-body);
    border-radius: var(--radius-flash);
    border-top: 3px solid var(--bb-marigold);
    box-shadow: var(--shadow-flash);
    text-align: center;
    /* the global .ring core uses --surface-raised; pin it paper-light so the
       dark theme's slate core can never land on this cream face */
    --surface-raised: var(--bb-paper);
  }
  .check-motif {
    width: 76px;
    height: 76px;
    margin: 0 auto 6px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: color-mix(in srgb, var(--ok) 70%, var(--text-strong));
    background: color-mix(in srgb, var(--ok) 12%, transparent);
    border: 2px solid color-mix(in srgb, var(--ok) 50%, transparent);
  }
  .sum-eyebrow {
    margin: 12px 0 2px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--highlight);
  }
  .sum-title {
    margin: 0;
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 300;
    letter-spacing: 0.02em;
    color: var(--text-strong);
  }
  .sum-title:focus {
    outline: none;
  }
  .sum-stats {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin: 18px 0 0;
  }
  .stat-cell dt {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }
  .stat-cell dd {
    margin: 2px 0 0;
    font-family: var(--font-display);
    font-size: 30px;
    font-weight: 600;
    line-height: 1;
    color: var(--text-strong);
  }
  .sum-note {
    margin: 14px auto 0;
    max-width: 38ch;
    font-size: 13.5px;
    color: var(--text-muted);
  }
  .sum-misses {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--highlight-line) 45%, transparent);
  }
  .sum-mt {
    margin: 0 0 6px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-label);
  }
  .sum-misses ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 5px;
  }
  .sum-misses li {
    font-size: 14px;
  }
  .sum-misses a {
    color: var(--accent-text);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .sum-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }
</style>
