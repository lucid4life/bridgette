<script lang="ts">
  // PWA prompts (spec §13): a "new version — refresh" toast (registerType:'prompt',
  // never auto-reload mid-session) + a quiet install prompt shown AFTER the first
  // completed session (not on load), with dismissal remembered. Periodic SW update check.
  import { useRegisterSW } from 'virtual:pwa-register/svelte';
  import { onMount } from 'svelte';

  let updateTimer: ReturnType<typeof setInterval> | null = null;
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl: string, r: ServiceWorkerRegistration | undefined) {
      // Hourly update check, only while the tab is visible; cleared on teardown (A11Y-05).
      if (r) updateTimer = setInterval(() => { if (document.visibilityState === 'visible') r.update(); }, 60 * 60 * 1000);
    }
  });

  let deferredPrompt = $state<any>(null);
  let showInstall = $state(false);
  let sessionDone = $state(false);

  function installDismissed(): boolean {
    try { return localStorage.getItem('bb_install_dismissed') === '1'; } catch { return false; }
  }
  function maybeShow() {
    if (deferredPrompt && sessionDone && !installDismissed()) showInstall = true;
  }
  onMount(() => {
    const onBip = (e: Event) => { e.preventDefault(); deferredPrompt = e; maybeShow(); };
    const onDone = () => { sessionDone = true; maybeShow(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && showInstall) dismissInstall(); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('bb:session-complete', onDone);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('bb:session-complete', onDone);
      window.removeEventListener('keydown', onKey);
      if (updateTimer) clearInterval(updateTimer);
    };
  });
  async function install() {
    showInstall = false;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch { /* noop */ }
      deferredPrompt = null;
    }
  }
  function dismissInstall() {
    showInstall = false;
    try { localStorage.setItem('bb_install_dismissed', '1'); } catch { /* noop */ }
  }
</script>

{#if $needRefresh || showInstall}
  <div class="toast-stack">
    {#if $needRefresh}
      <div class="toast" role="alert">
        <span>A new version is ready.</span>
        <button class="btn gold" type="button" onclick={() => updateServiceWorker(true)}>Refresh</button>
      </div>
    {/if}
    {#if showInstall}
      <div class="toast" role="alert">
        <span>Install Bridgette Training for offline practice?</span>
        <button class="btn gold" type="button" onclick={install}>Install</button>
        <button class="btn ghost" type="button" onclick={dismissInstall}>Not now</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .toast-stack {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: 20px; z-index: 60;
    display: flex; flex-direction: column; gap: 10px; align-items: center; max-width: 92vw;
  }
  .toast {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center;
    background: var(--surface-raised); border: 1px solid var(--highlight); border-radius: var(--radius-card);
    padding: 12px 16px; box-shadow: var(--shadow-flash);
  }
  .toast span { font-size: 14px; }
  @media (max-width: 680px) { .toast-stack { bottom: 72px; } } /* clear the mobile tab bar */
</style>
