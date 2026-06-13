// Task C — thin Svelte 5 runes singleton over store.ts. ALL logic lives in
// store.ts; this file only wires $state reactivity + persistence calls.
// Mutations edit the $state proxy in place (deep reactivity), so views built
// on $derived(progress.dueItems(...)) etc. update automatically.
import { browser } from '$app/environment';
import type { Grade, Rank } from '../srs/scheduler';
import {
  completeUnit,
  confidentMisses,
  defaultState,
  dueItems,
  freezeAvailable,
  introduceItem,
  loadProgress,
  newToday,
  persistMeta,
  rankCounts,
  recentActivity,
  recordReview,
  setExamTarget,
  shakyItems,
  tickStreak,
  type Confidence,
  type ProgressState,
  type UnitDoneVia
} from './store';

let state = $state<ProgressState>(defaultState());
let ready = $state(false);
// The wall clock as reactive state: time-dependent reads (dueItems/newToday/
// the streak-freeze week) touch `clock`, so $derived consumers re-run when it
// bumps — without it, a PWA left open overnight keeps showing yesterday's
// truth until the next state mutation. `wake()` bumps it (layout wires it to
// visibilitychange/focus + a 60s visible-only interval).
let clock = $state(0);

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
    void clock; // freeze/streak displays depend on "today" — re-read on wake
    return state.meta.streak;
  },
  get settings() {
    return state.meta.settings;
  },
  get unitDone() {
    return state.meta.unitDone;
  },
  /** §0c cram-to-a-date: the dayNumber of the set test, or undefined. Touches
   * `clock` so the countdown re-derives when the day rolls over. */
  get examTarget(): number | undefined {
    void clock;
    return state.meta.examTarget;
  },

  // --- mutations (each persists through store.ts) ---------------------------
  introduceItem: (itemId: string, now: Date = new Date()) => introduceItem(state, itemId, now),
  recordReview: (itemId: string, grade: Grade, confidence?: Confidence, now: Date = new Date()) =>
    recordReview(state, itemId, grade, now, confidence),
  completeUnit: (unitId: string, via: UnitDoneVia) => completeUnit(state, unitId, via),
  setExamTarget: (day: number | null) => setExamTarget(state, day),
  /** Re-evaluate the streak (e.g. on app foreground after midnight) and persist. */
  tickStreak(now: Date = new Date()): Promise<void> {
    tickStreak(state, now);
    return persistMeta(state);
  },
  /** The clock tick: re-evaluate the streak and re-run every time-reading
   * $derived. Persists only when the streak actually moved (no write storms
   * from the 60s interval). */
  wake(now: Date = new Date()): void {
    clock += 1;
    const before = JSON.stringify(state.meta.streak);
    tickStreak(state, now);
    if (JSON.stringify(state.meta.streak) !== before) void persistMeta(state);
  },

  // --- derived selectors ($derived-friendly: plain synchronous reads) -------
  /** This week's free streak freeze is still unspent. */
  freezeAvailable: (now: Date = new Date()) => {
    void clock;
    return freezeAvailable(state, now);
  },
  dueItems: (now: Date = new Date()) => {
    void clock;
    return dueItems(state, now);
  },
  newToday: (now: Date = new Date()) => {
    void clock;
    return newToday(state, now);
  },
  rankCounts: (): Record<Rank, number> => rankCounts(state),
  shakyItems: (n?: number) => {
    void clock;
    return shakyItems(state, n);
  },
  /** Confident misses (hypercorrection targets) — surfaced first in the warm-up. */
  confidentMisses: (n?: number) => confidentMisses(state, n),
  /** §1c: the last `days` days of activity for the history heat-strip. */
  recentActivity: (days: number, now: Date = new Date()) => {
    void clock;
    return recentActivity(state, days, now);
  }
};
