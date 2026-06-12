<script lang="ts">
  // Task G — a locked future stage (2–5): a page of the workbook not written
  // yet. Dashed, faint, clearly NOT clickable — a preview, not a teaser trap.
  import Icon from '$lib/components/Icon.svelte';
  import type { Stage } from '$lib/journey/types';

  let { stage, n }: { stage: Stage; n: number } = $props();
</script>

<article class="preview">
  <header class="p-head">
    <span class="p-n">stage {n} · {stage.track}</span>
    <span class="p-lock"><Icon name="lock" size={15} /><span class="visually-hidden">locked — opens after the stage before it</span></span>
  </header>
  <h3>{stage.title}</h3>
  <p class="p-blurb">{stage.blurb}</p>
</article>

<style>
  .preview {
    border: 1px dashed var(--line);
    border-radius: var(--radius-card);
    padding: 16px 18px;
    background: var(--surface-card-faint);
  }
  .p-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
    color: var(--text-muted);
  }
  .p-n {
    font-family: var(--font-display);
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
  }
  .p-lock {
    display: inline-grid;
    place-items: center;
  }
  h3 {
    margin: 0 0 4px;
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text-muted);
  }
  .p-blurb {
    margin: 0;
    font-size: 13.5px;
    color: var(--text-muted);
    max-width: 48ch;
  }
</style>
