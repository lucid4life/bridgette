// Task G — ProgressView adapter: the journey gating's minimal read-interface
// built over the store's state. No Svelte in here; reads are LAZY (rankOf and
// unitDone touch state at call time) so $derived consumers that call gating
// functions track exactly the items/meta they read.
import type { ProgressView } from '../journey/types';
import { rankOf, type Rank } from '../srs/scheduler';
import type { ProgressState } from './store';

export function progressView(state: ProgressState): ProgressView {
  return {
    rankOf(itemId: string): Rank {
      const rec = state.items[itemId];
      // For path gating, an item never once recalled correctly is still new:
      // an all-'again' pass (reps > 0, so srs rank moves) must not count the
      // item toward a unit's criterion. Gating-only semantics — rank pills,
      // rankCounts, shakyItems and review-rung selection read the srs directly.
      if (!rec || rec.correct === 0) return 'new';
      return rankOf(rec.srs);
    },
    get unitDone() {
      return state.meta.unitDone;
    }
  };
}
