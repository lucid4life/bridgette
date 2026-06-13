<script lang="ts">
  // Task G — one station on the Stage-1 trail. Status drives the whole
  // treatment: locked = muted + dashed, available = accent ring, started =
  // accent fill + per-unit progress, complete = ok tick + how-it-was-passed
  // badge. The checkpoint station is distinct: squared marker, flag, marigold
  // rule — and carries the stage-level test-out line while the stage is open.
  // The marigold spine segments are drawn HERE (::before/::after per node), so
  // the line meets every marker centre exactly whatever the card heights are.
  import Icon from '$lib/components/Icon.svelte';
  import type { UnitStatus } from '$lib/journey/gating';
  import type { Unit } from '$lib/journey/types';

  let {
    unit,
    status,
    number,
    total,
    studied,
    meta,
    href,
    current = false,
    doneVia,
    testOut = false
  }: {
    unit: Unit;
    status: UnitStatus;
    number: number | null; // 1-based lesson number; null for the checkpoint
    total: number;
    studied: number;
    meta: string;
    href: string;
    current?: boolean; // the continue target — gets the breathing halo
    doneVia?: 'gate' | 'test-out';
    testOut?: boolean; // stage-level test-out line (checkpoint node only)
  } = $props();

  const isCheckpoint = $derived(unit.kind === 'checkpoint');
  const pct = $derived(total === 0 ? 0 : Math.round((studied / total) * 100));
  const badgeLabel = $derived(
    doneVia === 'test-out' ? 'tested out' : doneVia === 'gate' ? 'gate passed' : 'complete'
  );
</script>

<li
  class="node"
  class:locked={status === 'locked'}
  class:available={status === 'available'}
  class:started={status === 'started'}
  class:complete={status === 'complete'}
  class:checkpoint={isCheckpoint}
  class:current
>
  <span class="marker" aria-hidden="true">
    {#if status === 'complete'}
      <Icon name="check" size={20} />
    {:else if status === 'locked'}
      <Icon name="lock" size={17} />
    {:else if isCheckpoint}
      <Icon name="flag" size={19} />
    {:else}
      <span class="num">{number}</span>
    {/if}
  </span>

  {#if status === 'locked'}
    <div class="body">
      {#if number !== null}<span class="modlabel">Module {number}</span>{/if}
      <span class="title">{unit.title}</span>
      <span class="blurb">{unit.blurb}</span>
      <span class="row"><span class="meta">{meta}</span></span>
      <span class="visually-hidden">Locked — finish every module to open the shift check.</span>
    </div>
  {:else}
    <a class="body" {href} aria-current={current ? 'step' : undefined}>
      {#if number !== null}<span class="modlabel">Module {number}</span>{/if}
      <span class="title">{unit.title}</span>
      <span class="blurb">{unit.blurb}</span>
      <span class="row">
        <span class="meta">{meta}</span>
        {#if status === 'started'}
          <span class="bar" aria-hidden="true"><span class="fill" style:width="{pct}%"></span></span>
          <span class="meta">{studied}/{total} studied</span>
        {:else if status === 'complete'}
          <span class="badge">{badgeLabel}</span>
        {/if}
      </span>
    </a>
  {/if}

  {#if isCheckpoint && testOut && status !== 'complete'}
    <a class="testout" {href}>think you know it? take the shift check cold →</a>
  {/if}
</li>

<style>
  .node {
    display: grid;
    grid-template-columns: 56px 1fr;
    align-items: start;
    position: relative;
    /* ok-green that holds on BOTH canvases: pulled toward the theme's strong ink */
    --ok-ink: color-mix(in srgb, var(--ok) 55%, var(--text-strong));
    /* §2: the spine takes the stage's track hue (inherited via [data-track] on
       the stage section); falls back to the marigold default off the Path. */
    --spine: color-mix(in srgb, var(--track-line, var(--highlight-line)) 60%, transparent);
  }
  /* the marigold spine: down from my marker centre to my bottom edge…
     (the 18px between stations is the .path-list flex gap, set by the page) */
  .node:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 21px;
    top: 26px;
    bottom: 0;
    width: 2px;
    background: var(--spine);
  }
  /* …and up through the gap to the previous station */
  .node:not(:first-child)::before {
    content: '';
    position: absolute;
    left: 21px;
    top: -18px;
    height: 44px;
    width: 2px;
    background: var(--spine);
  }

  /* ---- marker ---- */
  .marker {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    margin-top: 4px;
    position: relative;
    z-index: 1;
    background: var(--surface-raised);
    border: 2px solid var(--line);
    color: var(--text-muted);
    box-shadow: var(--shadow-1);
  }
  .num {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
  }
  .node.available .marker {
    border-color: var(--track-line, var(--accent-bright)); /* §2: per-track ring */
    color: var(--accent-text);
  }
  .node.started .marker {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-ink);
  }
  .node.checkpoint .marker {
    border-radius: 14px; /* the shift check is a station of a different shape */
  }
  .node.checkpoint:not(.locked) .marker {
    border-color: var(--track-line, var(--highlight-line)); /* §2: per-track flag ring */
    color: var(--highlight);
  }
  .node.complete .marker {
    background: var(--surface-raised);
    border-color: var(--ok-ink);
    color: var(--ok-ink);
  }
  /* the continue target breathes — a quiet "you are here" */
  .node.current .marker::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    animation: halo 2.8s ease-in-out infinite;
  }
  @keyframes halo {
    0%,
    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-bright) 30%, transparent);
    }
    55% {
      box-shadow: 0 0 0 11px color-mix(in srgb, var(--accent-bright) 0%, transparent);
    }
  }

  /* ---- body card ---- */
  .body {
    display: block;
    min-width: 0;
    padding: 14px 16px 13px;
    border-radius: var(--radius-card);
    border: 1px solid var(--line);
    background: var(--surface-card);
    box-shadow: var(--shadow-1);
    text-decoration: none;
    color: inherit;
  }
  a.body {
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      transform 0.15s ease;
  }
  a.body:hover {
    background: var(--surface-hover);
    transform: translateX(2px);
  }
  .node.available a.body,
  .node.started a.body {
    border-color: color-mix(in srgb, var(--accent-bright) 50%, transparent);
  }
  .node.current a.body {
    box-shadow: var(--shadow-2);
  }
  .node.checkpoint:not(.locked) .body {
    border-color: color-mix(in srgb, var(--highlight-line) 55%, transparent);
  }
  .node.locked .body {
    background: var(--surface-card-faint);
    border-style: dashed;
    box-shadow: none;
  }
  .node.locked .title,
  .node.locked .blurb,
  .node.locked .meta {
    color: var(--text-muted);
  }
  .node.locked .title {
    font-weight: 500;
  }

  .modlabel {
    display: block;
    margin-bottom: 1px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--accent-text);
  }
  .node.locked .modlabel {
    color: var(--text-muted);
  }
  .title {
    display: block;
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text-strong);
  }
  .blurb {
    display: block;
    margin-top: 2px;
    font-size: 13.5px;
    color: var(--text-muted);
    max-width: 58ch;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  .meta {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .bar {
    flex: 0 1 120px;
    height: 5px;
    border-radius: 999px;
    background: var(--surface-track);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--accent-bright);
  }
  .badge {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 3px 9px;
    border-radius: var(--radius-chip);
    color: var(--ok-ink);
    background: color-mix(in srgb, var(--ok) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--ok) 45%, transparent);
  }

  /* ---- stage-level test-out (checkpoint node only) — deliberately quiet ---- */
  .testout {
    grid-column: 2;
    justify-self: start;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 2px 2px 0;
    font-size: 13.5px;
    color: var(--text-muted);
    text-decoration: underline dotted;
    text-underline-offset: 3px;
    text-decoration-color: color-mix(in srgb, var(--highlight-line) 70%, transparent);
  }
  .testout:hover {
    color: var(--accent-text);
  }
</style>
