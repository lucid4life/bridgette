// Task C — thin Svelte 5 runes singleton over store.ts. ALL logic lives in
// store.ts; this file only wires $state reactivity + persistence calls.
// Mutations edit the $state proxy in place (deep reactivity), so views built
// on $derived(progress.dueItems(...)) etc. update automatically.
import { browser } from '$app/environment';
import type { Grade, Rank } from '../srs/scheduler';
import {
  completeUnit,
  defaultState,
  dueItems,
  introduceItem,
  loadProgress,
  newToday,
  persistMeta,
  rankCounts,
  recordReview,
  shakyItems,
  tickStreak,
  type ProgressState,
  type UnitDoneVia
} from './store';

let state = $state<ProgressState>(defaultState());
let ready = $state(false);

async function init(): Promise<void> {
  state = await loadProgress();
  ready = true;
}

if (browser) void init();

export const progress = {
  /** False until the persisted state has loaded (idb → mirror → default). */
  get ready(): boolean {
    return ready;
  },
  get state(): ProgressState {
    return state;
  },
  get streak() {
    return state.meta.streak;
  },
  get settings() {
    return state.meta.settings;
  },
  get unitDone() {
    return state.meta.unitDone;
  },

  // --- mutations (each persists through store.ts) ---------------------------
  introduceItem: (itemId: string, now: Date = new Date()) => introduceItem(state, itemId, now),
  recordReview: (itemId: string, grade: Grade, now: Date = new Date()) =>
    recordReview(state, itemId, grade, now),
  completeUnit: (unitId: string, via: UnitDoneVia) => completeUnit(state, unitId, via),
  /** Re-evaluate the streak (e.g. on app foreground after midnight) and persist. */
  tickStreak(now: Date = new Date()): Promise<void> {
    tickStreak(state, now);
    return persistMeta(state);
  },

  // --- derived selectors ($derived-friendly: plain synchronous reads) -------
  dueItems: (now: Date = new Date()) => dueItems(state, now),
  newToday: (now: Date = new Date()) => newToday(state, now),
  rankCounts: (): Record<Rank, number> => rankCounts(state),
  shakyItems: (n?: number) => shakyItems(state, n)
};
