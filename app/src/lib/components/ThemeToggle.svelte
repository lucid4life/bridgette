<script lang="ts">
  // Sun / moon / auto theme cycler. Follows the Icon.svelte convention: 24-grid,
  // fill=none, stroke=currentColor, aria-hidden svg + the button carries the label.
  import { theme, type ThemeMode } from '$lib/state/theme.svelte';

  let { compact = false }: { compact?: boolean } = $props();

  const LABEL: Record<ThemeMode, string> = { light: 'Light', dark: 'Dark', auto: 'Auto' };
  const NEXT: Record<ThemeMode, ThemeMode> = { auto: 'dark', dark: 'light', light: 'auto' };
  const aria = $derived(
    `Theme: ${LABEL[theme.mode]} — switch to ${LABEL[NEXT[theme.mode]]}`
  );
</script>

<button class="theme-toggle" class:compact type="button" aria-label={aria} title={aria} onclick={() => theme.cycle()}>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {#if theme.mode === 'light'}
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M18.2 5.8l-1.4 1.4M7.2 16.8l-1.4 1.4" />
    {:else if theme.mode === 'dark'}
      <path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z" />
    {:else}
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 010 16z" fill="currentColor" stroke="none" />
    {/if}
  </svg>
  {#if !compact}<span class="tt-label">{LABEL[theme.mode]} theme</span>{/if}
</button>

<style>
  .theme-toggle {
    display: inline-flex; align-items: center; gap: 8px;
    min-height: 44px; min-width: 44px; padding: 8px 12px;
    background: none; border: 1px solid var(--line); border-radius: var(--radius-nav);
    color: var(--text-body);
    font-family: var(--font-display); text-transform: uppercase;
    font-size: 12px; font-weight: 600; letter-spacing: .05em;
  }
  .theme-toggle:hover { background: var(--surface-hover); }
  .theme-toggle svg { width: 18px; height: 18px; flex: none; }
  .theme-toggle.compact { justify-content: center; padding: 8px; }
  /* tablet rail (icon-only sidebar): drop the label like the nav does */
  @media (max-width: 1000px) {
    .tt-label { display: none; }
    .theme-toggle { justify-content: center; padding: 8px; }
  }
</style>
