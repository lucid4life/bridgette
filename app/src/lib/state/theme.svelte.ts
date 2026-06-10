// Theme state: light | dark | auto (auto = follow the OS). Persists the explicit
// choice to localStorage 'bb_theme' (NEVER touches bb_progress_v1); auto stores
// nothing so the prefers-color-scheme CSS block stays in charge. Mirrors the
// inline FOUC guard in app.html, and keeps the PWA theme-color meta in sync.
import { browser } from '$app/environment';

export type ThemeMode = 'light' | 'dark' | 'auto';

const KEY = 'bb_theme';
const BAR_LIGHT = '#fff8ec'; // --surface-bar (light)
const BAR_DARK = '#2a211a';  // --surface-bar (dark)
const ORDER: Record<ThemeMode, ThemeMode> = { auto: 'dark', dark: 'light', light: 'auto' };

function saved(): ThemeMode {
  if (!browser) return 'auto';
  const v = localStorage.getItem(KEY);
  return v === 'light' || v === 'dark' ? v : 'auto';
}

let mode = $state<ThemeMode>(saved());

function resolve(m: ThemeMode): 'light' | 'dark' {
  if (m !== 'auto') return m;
  return browser && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(m: ThemeMode): void {
  if (!browser) return;
  if (m === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = m;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolve(m) === 'dark' ? BAR_DARK : BAR_LIGHT);
}

if (browser) {
  apply(mode); // re-assert what the FOUC guard already painted
  // On auto, an OS flip changes the resolved theme — keep the meta honest.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (mode === 'auto') apply(mode);
  });
}

export const theme = {
  get mode(): ThemeMode {
    return mode;
  },
  get resolved(): 'light' | 'dark' {
    return resolve(mode);
  },
  set(m: ThemeMode): void {
    mode = m;
    if (browser) {
      if (m === 'auto') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, m);
    }
    apply(m);
  },
  cycle(): void {
    this.set(ORDER[mode]);
  }
};
