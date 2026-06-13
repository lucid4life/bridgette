<script lang="ts">
  // Drill-scope chips for the romance + allergen intros: "all" plus each menu
  // category, so a crammer can hammer just the pastas. Pure selection — the
  // parent filters its pool before start().
  let {
    categories,
    selected = $bindable(null)
  }: { categories: readonly string[]; selected?: string | null } = $props();

  const label = (c: string) => (c === 'Main' ? 'Mains' : c);
</script>

<div class="cat-chips" role="group" aria-label="Drill a category, or all">
  <button
    type="button"
    class="cat-chip"
    aria-pressed={selected === null}
    onclick={() => (selected = null)}>all</button
  >
  {#each categories as c (c)}
    <button
      type="button"
      class="cat-chip"
      aria-pressed={selected === c}
      onclick={() => (selected = c)}>{label(c)}</button
    >
  {/each}
</div>

<style>
  .cat-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    justify-content: center;
    margin: 16px auto 0;
    max-width: 42ch;
  }
  .cat-chip {
    padding: 6px 13px;
    border-radius: var(--radius-chip);
    border: 1px solid var(--line);
    background: var(--surface-card);
    color: var(--text-body);
    font-size: 12.5px;
    font-weight: 700;
    min-height: 32px;
    text-transform: lowercase;
  }
  .cat-chip:hover {
    background: var(--surface-hover);
  }
  .cat-chip[aria-pressed='true'] {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-ink);
  }
</style>
