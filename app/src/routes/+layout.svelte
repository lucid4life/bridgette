<script lang="ts">
  import '../app.css';
  // Self-hosted Oswald (offline-safe; precached by the SW) — the brand display face.
  // Import ONLY the Latin subsets we use (drops cyrillic/cyrillic-ext/greek/vietnamese,
  // which the SW would otherwise precache despite the browser never fetching them).
  // latin-ext is required: the menu carries Löss / Grüner / Dürkheimer / Niederösterreich.
  import '@fontsource/oswald/latin-400.css';
  import '@fontsource/oswald/latin-ext-400.css';
  import '@fontsource/oswald/latin-500.css';
  import '@fontsource/oswald/latin-ext-500.css';
  import '@fontsource/oswald/latin-600.css';
  import '@fontsource/oswald/latin-ext-600.css';
  import '@fontsource/oswald/latin-700.css';
  import '@fontsource/oswald/latin-ext-700.css';
  import { page } from '$app/state';
  import PwaToast from '$lib/components/PwaToast.svelte';

  let { children } = $props();

  const NAV = [
    { href: '/today', label: 'Today', paths: ['M3 12l9-9 9 9', 'M5 10v10h14V10'] },
    { href: '/', label: 'Practice', paths: ['M5 4h14v16l-7-4-7 4z'] },
    { href: '/school', label: 'Wine School', short: 'School', paths: ['M3 7l9-4 9 4-9 4z', 'M7 10v5c0 1 2 3 5 3s5-2 5-3v-5'] },
    { href: '/reference', label: 'Reference', paths: ['M5 4h12a2 2 0 012 2v14H7a2 2 0 01-2-2z', 'M9 4v16'] },
    { href: '/progress', label: 'Progress', paths: ['M4 20V10M10 20V4M16 20v-7M22 20H2'] }
  ];
  const current = $derived(page.url.pathname);
  const navHrefs = NAV.map((n) => n.href);
  const isSub = $derived(!navHrefs.includes(current)); // a non-top-level route (e.g. the simulator)
  function isActive(href: string): boolean {
    return href === '/' ? current === '/' : current === href || current.startsWith(href + '/');
  }
  function back() {
    if (typeof history !== 'undefined' && history.length > 1) history.back();
    else location.href = '/';
  }
</script>

<a class="skip-link" href="#main">Skip to content</a>
<div class="app">
  <aside class="sidebar">
    <div class="brand">Bridgette<br />Training<small>Calgary</small></div>
    <nav aria-label="Primary">
      {#each NAV as item (item.href)}
        <a class="nav-item" href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            {#each item.paths as d}<path {d} />{/each}
          </svg>
          <span class="nav-label">{item.label}</span>
        </a>
      {/each}
    </nav>
    <div class="spacer"></div>
    <div class="foot">v2 · offline-ready PWA</div>
  </aside>

  <div class="main">
    <header class="topbar" class:show={isSub}>
      {#if isSub}
        <button class="topbar-back" type="button" aria-label="Back" onclick={back}>
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          <span>Back</span>
        </button>
      {/if}
      <span class="topbar-brand">Bridgette Training</span>
    </header>
    <main id="main" class="screen-wrap">
      {@render children()}
    </main>
    <nav class="tabbar" aria-label="Bottom navigation">
      {#each NAV as item (item.href)}
        <a class="tab" href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} aria-label={item.label}>
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            {#each item.paths as d}<path {d} />{/each}
          </svg>
          <span aria-hidden="true">{item.short ?? item.label}</span>
        </a>
      {/each}
    </nav>
  </div>
</div>
<PwaToast />

<style>
  /* Topbar: always present on a sub-route (installed PWA has no browser chrome,
     so we provide an in-app Back), plus the mobile bar via app.css media query. */
  .topbar.show { display: flex; }
  .topbar-back {
    display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 6px 10px;
    background: none; border: 1px solid var(--line); border-radius: var(--radius-nav); color: var(--cream);
    font-family: var(--font-display); text-transform: uppercase; font-size: 13px; letter-spacing: .04em;
  }
  .topbar-back .ico { width: 18px; height: 18px; }
  .topbar-back:hover { background: rgba(255, 238, 215, .06); }
  .topbar-brand { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .02em; font-size: 18px; color: var(--cream); }
</style>
