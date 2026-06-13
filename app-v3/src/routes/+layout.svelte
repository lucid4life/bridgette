<script lang="ts">
  import '../app.css';
  // Self-hosted Oswald (offline-safe; precached by the SW) — the brand display face.
  // Import ONLY the Latin subsets we use (drops cyrillic/cyrillic-ext/greek/vietnamese,
  // which the SW would otherwise precache despite the browser never fetching them).
  // latin-ext is required: the menu carries Löss / Grüner / Dürkheimer / Niederösterreich.
  // 300 + 700 are the two weights the brand site loads (light display titles / bold emphasis).
  import '@fontsource/oswald/latin-300.css';
  import '@fontsource/oswald/latin-ext-300.css';
  import '@fontsource/oswald/latin-400.css';
  import '@fontsource/oswald/latin-ext-400.css';
  import '@fontsource/oswald/latin-500.css';
  import '@fontsource/oswald/latin-ext-500.css';
  import '@fontsource/oswald/latin-600.css';
  import '@fontsource/oswald/latin-ext-600.css';
  import '@fontsource/oswald/latin-700.css';
  import '@fontsource/oswald/latin-ext-700.css';
  // Self-hosted Hanken Grotesk (offline-safe; precached by the SW) — the warm body face.
  // latin + latin-ext at the three weights the body uses (400/500/700); latin-ext carries
  // the accented wine names (Löss / Grüner / Dürkheimer / Niederösterreich).
  import '@fontsource/hanken-grotesk/latin-400.css';
  import '@fontsource/hanken-grotesk/latin-ext-400.css';
  import '@fontsource/hanken-grotesk/latin-500.css';
  import '@fontsource/hanken-grotesk/latin-ext-500.css';
  import '@fontsource/hanken-grotesk/latin-700.css';
  import '@fontsource/hanken-grotesk/latin-ext-700.css';
  import { onMount } from 'svelte';
  import { onNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import PwaToast from '$lib/components/PwaToast.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { progress } from '$lib/store/progress.svelte';

  let { children } = $props();

  // Phase-5 polish: a soft cross-fade between screens (Path → session and back).
  // Progressive — only browsers with the View Transition API (Safari 18+, Chrome);
  // everyone else navigates instantly. Reduced-motion users opt out entirely (the
  // global reduced-motion CSS would zero it anyway, but skipping the work is cleaner).
  onNavigate((navigation) => {
    if (typeof document === 'undefined' || !document.startViewTransition) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  // Keep the resident PWA's clock honest: a phone left open overnight must not
  // show yesterday's due counts / lesson allowance / freeze state. wake() ticks
  // the streak + bumps the store's reactive clock so time-reading $deriveds
  // re-run — on re-focus, on becoming visible, and every 60s while visible.
  onMount(() => {
    const wake = () => {
      if (document.visibilityState === 'visible') progress.wake();
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    const timer = setInterval(wake, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
      clearInterval(timer);
    };
  });

  // Task F — FOUR destinations, the SAME four everywhere: desktop sidebar,
  // tablet rail, mobile tab bar (app.css handles the collapse at 1000/680px).
  // v3's reason to exist: nothing job-critical hides behind desktop-only nav.
  const NAV = [
    {
      href: '/',
      label: 'The Path',
      short: 'Path',
      paths: [
        'M8.25 5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
        'M20.25 19a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
        'M6 7.25C6 12.5 18 11.5 18 16.75'
      ]
    },
    {
      href: '/today',
      label: 'Today',
      short: 'Today',
      paths: ['M4.5 5.5h15v14h-15z', 'M4.5 9.5h15', 'M8.5 3v4', 'M15.5 3v4', 'M8.5 12.5h3.5v3.5H8.5z']
    },
    {
      href: '/playbook',
      label: 'Playbook',
      short: 'Playbook',
      paths: ['M5 4h12a2 2 0 012 2v14H7a2 2 0 01-2-2z', 'M9 4v16']
    },
    {
      href: '/progress',
      label: 'Progress',
      short: 'Progress',
      paths: ['M5 20v-6', 'M11 20v-10', 'M17 20v-14', 'M3 20h18']
    }
  ];
  const current = $derived(page.url.pathname);
  // Exact match for the Path home; prefix match for the section roots so their
  // future sub-routes keep the tab lit.
  function isActive(href: string): boolean {
    return href === '/' ? current === '/' : current === href || current.startsWith(href + '/');
  }
</script>

<a class="skip-link" href="#main">Skip to content</a>
<div class="app">
  <aside class="sidebar">
    <div class="brand">bridgette<br />trainer<small>Bridgette Bar · Calgary</small></div>
    <nav aria-label="Primary">
      {#each NAV as item (item.href)}
        <a class="nav-item" href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            {#each item.paths as d}<path {d} />{/each}
          </svg>
          <span class="nav-label">{item.label}</span>
        </a>
      {/each}
    </nav>
    <div class="spacer"></div>
    <div class="side-theme"><ThemeToggle /></div>
    <div class="foot">v3 · offline-ready PWA</div>
  </aside>

  <div class="main">
    <header class="topbar">
      <!-- the brand text comes from app.css (.topbar .brand::before) -->
      <span class="brand"></span>
      <ThemeToggle compact />
    </header>
    <main id="main" class="screen-wrap" tabindex="-1">
      {@render children()}
    </main>
    <nav class="tabbar" aria-label="Bottom navigation">
      {#each NAV as item (item.href)}
        <a class="tab" href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            {#each item.paths as d}<path {d} />{/each}
          </svg>
          <span>{item.short}</span>
        </a>
      {/each}
    </nav>
  </div>
</div>
<PwaToast />

<style>
  /* A11Y: the skip link focuses <main> (tabindex -1); no ring on the whole region. */
  main:focus {
    outline: none;
  }
</style>
