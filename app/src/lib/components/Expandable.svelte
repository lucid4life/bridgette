<script lang="ts">
  // The house-style progressive-disclosure accordion (spec §3). A thin wrapper over
  // the native <details>/<summary> so keyboard + screen-reader + no-JS all work for
  // free. The summary swaps label↔openLabel and rotates a chevron. Tuned for the
  // cream/light surfaces it lives on (.flash, .card.light); reduced-motion safe.
  import type { Snippet } from 'svelte';
  let {
    label = 'Expand',
    openLabel = 'Less',
    children
  }: { label?: string; openLabel?: string; children?: Snippet } = $props();
  let open = $state(false);
</script>

<details class="expandable" bind:open>
  <summary>
    <svg class="chev" class:open viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
    <span>{open ? openLabel : label}</span>
  </summary>
  <div class="exp-body">
    {@render children?.()}
  </div>
</details>

<style>
  .expandable { border: 1px solid var(--line-dark); border-radius: var(--radius-nav); margin: 10px 0 0; background: rgba(30, 56, 75, .03); }
  summary {
    display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 10px 12px;
    cursor: pointer; list-style: none; user-select: none;
    font-family: var(--font-display); text-transform: uppercase; letter-spacing: .04em;
    font-size: 12px; font-weight: 700; color: var(--accent-dark);
  }
  summary::-webkit-details-marker { display: none; }
  summary::marker { content: ''; }
  summary:focus-visible { outline: 2px solid var(--accent-dark); outline-offset: 2px; border-radius: var(--radius-nav); }
  summary:hover { background: rgba(30, 56, 75, .05); border-radius: var(--radius-nav); }
  .chev { width: 16px; height: 16px; flex: none; transition: transform .18s ease; }
  .chev.open { transform: rotate(90deg); }
  .exp-body { padding: 2px 12px 12px; }
  @media (prefers-reduced-motion: reduce) { .chev { transition: none; } }
</style>
