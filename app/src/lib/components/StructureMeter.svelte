<script lang="ts">
  // Dual-coding structure meter (spec §1/§8): graphic 3-segment bar + the level
  // word + an aria-label. Level is conveyed by the FILLED COUNT and the text — never
  // colour alone (WCAG 1.4.1). Tuned for light (cream) surfaces.
  type Level = 'low' | 'medium' | 'high';
  let { label, level }: { label: string; level: Level } = $props();
  const idx = $derived({ low: 1, medium: 2, high: 3 }[level]);
</script>

<div class="meter" role="img" aria-label={`${label}: ${level}`}>
  <span class="meter-label" aria-hidden="true">{label}</span>
  <span class="segs" aria-hidden="true">
    {#each [1, 2, 3] as s}<span class="seg" class:on={s <= idx}></span>{/each}
  </span>
  <span class="meter-val" aria-hidden="true">{level}</span>
</div>

<style>
  .meter { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 8px; }
  .meter-label { font-size: 12px; color: var(--muted-paper); }
  .meter-val { grid-column: 2; font-size: 12px; font-weight: 800; color: var(--ink); text-transform: capitalize; }
  .segs { grid-column: 1; display: flex; gap: 3px; }
  .seg { width: 22px; height: 7px; border-radius: 3px; background: rgba(30, 56, 75, .14); }
  .seg.on { background: var(--accent-dark); }
</style>
