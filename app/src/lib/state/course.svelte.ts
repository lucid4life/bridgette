// app/src/lib/state/course.svelte.ts — mastery-gated course progress store.
// Persisted to localStorage['bb_course_v1']. SSR-safe: guards typeof localStorage
// throughout, never imports $app/environment so it can be tested in Vitest node env.
// Do NOT touch the frozen bb_progress_v1 store — this is entirely separate state.

import { curriculum } from '$lib/data/curriculum';
import type { CourseModule } from '$lib/data/curriculum';

const STORAGE_KEY = 'bb_course_v1';

interface CourseState {
  v: 1;
  completed: Record<string, true>;
}

function defaultState(): CourseState {
  return { v: 1, completed: {} };
}

function load(): CourseState {
  if (typeof localStorage === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.v === 1 &&
      parsed.completed &&
      typeof parsed.completed === 'object'
    ) {
      // Sanitise: only keep string keys mapped to true
      const completed: Record<string, true> = {};
      for (const k of Object.keys(parsed.completed)) {
        if (parsed.completed[k] === true) completed[k] = true;
      }
      return { v: 1, completed };
    }
  } catch {
    // Corrupted or unavailable storage — fall through to default
  }
  return defaultState();
}

// Sorted by num ascending (curriculum already is, but sort defensively)
const sorted: CourseModule[] = [...curriculum].sort((a, b) => a.num - b.num);

let state = $state<CourseState>(load());

function save(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private-browsing restriction — ignore
  }
}

export const courseStore = {
  /** Total number of modules in the curriculum. */
  total: sorted.length,

  /** True if the module with the given id has been completed. */
  isCompleted(id: string): boolean {
    return state.completed[id] === true;
  },

  /**
   * True if the module is auto-unlocked: either it is the first module by num,
   * or the immediately preceding module (by num) is completed.
   * The UI may additionally allow a manual "jump ahead" — this is only the
   * sequential-unlock signal used for progress indicators and next-up targeting.
   */
  isUnlocked(id: string): boolean {
    const idx = sorted.findIndex((m) => m.id === id);
    if (idx < 0) return false;
    if (idx === 0) return true;
    const prev = sorted[idx - 1];
    return state.completed[prev.id] === true;
  },

  /** Mark a module complete and persist. */
  complete(id: string): void {
    if (!state.completed[id]) {
      state = { v: 1, completed: { ...state.completed, [id]: true } };
      save();
    }
  },

  /** Remove a module's completion (for testing / reset flows). */
  uncomplete(id: string): void {
    if (state.completed[id]) {
      const next: Record<string, true> = { ...state.completed };
      delete next[id];
      state = { v: 1, completed: next };
      save();
    }
  },

  /** Number of completed modules. */
  completedCount(): number {
    return Object.keys(state.completed).length;
  },

  /**
   * The lowest-num module not yet completed — the "continue" target.
   * Returns null when all modules are done.
   */
  nextModule(): CourseModule | null {
    for (const m of sorted) {
      if (!state.completed[m.id]) return m;
    }
    return null;
  },

  /**
   * Force-reload state from localStorage (useful after a simulated page refresh
   * in tests or after an external write).
   */
  reload(): void {
    state = load();
  }
};
