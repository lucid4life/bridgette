<!-- Task H — subtle keyboard legend, desktop only (>1000px: the layouts with a
     physical keyboard). Phones never see it. -->
<p class="keys">
  <kbd>1</kbd>–<kbd>4</kbd> pick · <kbd>enter</kbd>/<kbd>space</kbd> continue or reveal ·
  <kbd>g</kbd> got it · <kbd>m</kbd> missed it
</p>

<style>
  .keys {
    display: none;
  }
  @media (min-width: 1001px) {
    .keys {
      display: block;
      max-width: 560px;
      margin: 26px auto 0;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }
  }
  kbd {
    font-family: var(--font-display);
    font-size: 11px;
    padding: 1px 5px;
    border: 1px solid var(--line);
    border-bottom-width: 2px;
    border-radius: 5px;
    background: var(--surface-card);
  }
</style>
