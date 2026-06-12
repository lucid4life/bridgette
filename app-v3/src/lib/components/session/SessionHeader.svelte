<script lang="ts">
  // Task H — slim session chrome: quiet exit, step count, unit title, phase
  // label + progress meter. The card below is the star; this stays out of the way.
  let {
    title,
    phase,
    position,
    total,
    sub,
    exitHref = '/',
    exitLabel = 'the path'
  }: {
    title: string;
    phase: string;
    position: number;
    total: number;
    sub?: string;
    exitHref?: string;
    exitLabel?: string;
  } = $props();

  // position = steps resolved; while a step exists we're ON step position+1.
  const shown = $derived(Math.min(position + 1, total));
  const pct = $derived(total > 0 ? Math.round((position / total) * 100) : 0);
</script>

<header class="s-head">
  <div class="s-top">
    <a class="s-exit" href={exitHref}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      {exitLabel}
    </a>
    <span class="s-count">{shown}<span class="s-of"> of </span>{total}</span>
  </div>
  <h1 class="s-title">{title}</h1>
  {#if sub}<p class="s-sub">{sub}</p>{/if}
  <div class="s-meter">
    <span class="s-phase">{phase}</span>
    <span
      class="s-bar"
      role="progressbar"
      aria-valuenow={position}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label="Session progress: step {shown} of {total}"
    >
      <span class="s-fill" style:width="{pct}%"></span>
    </span>
  </div>
</header>

<style>
  .s-head {
    max-width: 560px;
    margin: 0 auto 22px;
  }
  .s-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .s-exit {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    font-size: 13px;
    font-weight: 700;
    text-transform: lowercase;
    color: var(--text-muted);
    text-decoration: none;
  }
  .s-exit svg {
    width: 15px;
    height: 15px;
  }
  .s-exit:hover {
    color: var(--accent-text);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .s-count {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .s-of {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 4px;
  }
  /* smaller than a screen title — the card owns the room */
  .s-title {
    font-size: clamp(24px, 3.4vw, 32px);
    font-weight: 300;
    letter-spacing: 0.03em;
    margin: 0;
    color: var(--text-strong);
  }
  .s-sub {
    margin: 4px 0 0;
    font-size: 13.5px;
    color: var(--text-muted);
  }
  .s-meter {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
  }
  .s-phase {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--highlight);
    white-space: nowrap;
  }
  .s-bar {
    flex: 1;
    height: 5px;
    border-radius: 999px;
    background: var(--surface-track);
    overflow: hidden;
  }
  .s-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--accent-bright);
    transition: width 0.4s ease;
  }
</style>
