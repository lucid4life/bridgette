// The by-the-bottle full menu (38 bottles + 20 beers + 25 fortifieds) lives as a
// static JSON asset (static/fullmenu.json) fetched on demand — it is Reference-/
// prep-only depth and must stay OFF the shared data chunk that every route loads
// (PERF: ~100KB). Module-scoped promise cache; a failed fetch nulls the cache so
// a later call can retry.
import type { Bottle, Beer, Fortified } from './types';

export interface FullMenu {
  bottles: Bottle[];
  beers: Beer[];
  fortifieds: Fortified[];
}

let cache: Promise<FullMenu> | null = null;

export function loadFullMenu(): Promise<FullMenu> {
  if (!cache) {
    cache = fetch('/fullmenu.json')
      .then((r) => {
        if (!r.ok) throw new Error(`fullmenu: HTTP ${r.status}`);
        return r.json() as Promise<FullMenu>;
      })
      .then((fm) => {
        // Validate the shape so a truncated/renamed asset rejects cleanly here
        // (→ glass-only fallback) instead of throwing deep in a consumer's .map.
        if (!fm || !Array.isArray(fm.bottles) || !Array.isArray(fm.beers) || !Array.isArray(fm.fortifieds))
          throw new Error('fullmenu: malformed asset (expected bottles/beers/fortifieds arrays)');
        return fm;
      })
      .catch((e) => {
        cache = null; // allow a retry on the next call
        throw e;
      });
  }
  return cache;
}
