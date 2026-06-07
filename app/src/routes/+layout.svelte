<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';

  let { children } = $props();

  // Nav in mockup order. Practice is the default landing → href '/'.
  const NAV = [
    { href: '/today', label: 'Today', paths: ['M3 12l9-9 9 9', 'M5 10v10h14V10'] },
    { href: '/', label: 'Practice', paths: ['M5 4h14v16l-7-4-7 4z'] },
    { href: '/school', label: 'Wine School', paths: ['M3 7l9-4 9 4-9 4z', 'M7 10v5c0 1 2 3 5 3s5-2 5-3v-5'] },
    { href: '/reference', label: 'Reference', paths: ['M5 4h12a2 2 0 012 2v14H7a2 2 0 01-2-2z', 'M9 4v16'] },
    { href: '/progress', label: 'Progress', paths: ['M4 20V10M10 20V4M16 20v-7M22 20H2'] }
  ];

  const current = $derived(page.url.pathname);
  function isActive(href: string): boolean {
    return href === '/' ? current === '/' : current === href || current.startsWith(href + '/');
  }
</script>

<a class="skip-link" href="#main">Skip to content</a>
<div class="app">
  <aside class="sidebar" aria-label="Primary">
    <div class="brand">Bridgette<br />Training<small>Calgary</small></div>
    <nav aria-label="Sections">
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
    <header class="topbar">
      <div class="brand"></div>
    </header>
    <main id="main" class="screen-wrap">
      {@render children()}
    </main>
    <nav class="tabbar" aria-label="Sections">
      {#each NAV as item (item.href)}
        <a class="tab" href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            {#each item.paths as d}<path {d} />{/each}
          </svg>
          {item.label === 'Wine School' ? 'School' : item.label}
        </a>
      {/each}
    </nav>
  </div>
</div>
