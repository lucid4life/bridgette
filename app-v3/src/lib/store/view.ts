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
      return rec ? rankOf(rec.srs) : 'new'; // un-introduced items are 'new'
    },
    get unitDone() {
      return state.meta.unitDone;
    }
  };
}
