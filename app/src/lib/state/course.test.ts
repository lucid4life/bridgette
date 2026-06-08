// app/src/lib/state/course.test.ts — unit tests for the mastery-gated course store.
// Tests cover gating logic, completion mutations, nextModule(), completedCount(),
// and a round-trip persistence check (serialize → reload).
//
// The store reads localStorage at import time; we install a simple in-memory shim
// before importing so the module boots into a known-clean state.

import { describe, it, expect, beforeEach } from 'vitest';

// ---- minimal localStorage shim (node env has none) ----
function makeLocalStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; }
  } as Storage;
}

const fakeStorage = makeLocalStorage();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).localStorage = fakeStorage;

// ---- import store + curriculum AFTER shim is in place ----
import { courseStore } from './course.svelte';
import { curriculum } from '../data/curriculum';

const TOTAL = curriculum.length; // should be 10

// Reset between tests: clear storage, then reload the store into a clean state.
beforeEach(() => {
  fakeStorage.clear();
  courseStore.reload();
});

// ─── Fresh store ───────────────────────────────────────────────────────────────

describe('fresh store (no completions)', () => {
  it('has the correct total', () => {
    expect(courseStore.total).toBe(TOTAL);
    expect(TOTAL).toBe(10);
  });

  it('module 1 (how-wine-works) is unlocked', () => {
    expect(courseStore.isUnlocked('how-wine-works')).toBe(true);
  });

  it('module 2 (how-to-taste) is locked', () => {
    expect(courseStore.isUnlocked('how-to-taste')).toBe(false);
  });

  it('no module is completed', () => {
    expect(courseStore.isCompleted('how-wine-works')).toBe(false);
  });

  it('completedCount() is 0', () => {
    expect(courseStore.completedCount()).toBe(0);
  });

  it('nextModule() returns the first module', () => {
    const next = courseStore.nextModule();
    expect(next).not.toBeNull();
    expect(next!.id).toBe('how-wine-works');
    expect(next!.num).toBe(1);
  });
});

// ─── After completing module 1 ────────────────────────────────────────────────

describe('after complete("how-wine-works")', () => {
  beforeEach(() => {
    courseStore.complete('how-wine-works');
  });

  it('module 1 is completed', () => {
    expect(courseStore.isCompleted('how-wine-works')).toBe(true);
  });

  it('module 2 (how-to-taste) is now unlocked', () => {
    expect(courseStore.isUnlocked('how-to-taste')).toBe(true);
  });

  it('module 3 (the-5-families) is still locked', () => {
    expect(courseStore.isUnlocked('the-5-families')).toBe(false);
  });

  it('completedCount() is 1', () => {
    expect(courseStore.completedCount()).toBe(1);
  });

  it('nextModule() returns module 2', () => {
    const next = courseStore.nextModule();
    expect(next).not.toBeNull();
    expect(next!.id).toBe('how-to-taste');
    expect(next!.num).toBe(2);
  });
});

// ─── Completing all 10 modules ────────────────────────────────────────────────

describe('after completing all modules', () => {
  beforeEach(() => {
    for (const m of curriculum) {
      courseStore.complete(m.id);
    }
  });

  it('completedCount() is 10', () => {
    expect(courseStore.completedCount()).toBe(10);
  });

  it('nextModule() returns null', () => {
    expect(courseStore.nextModule()).toBeNull();
  });

  it('every module reports isCompleted true', () => {
    for (const m of curriculum) {
      expect(courseStore.isCompleted(m.id)).toBe(true);
    }
  });
});

// ─── Uncomplete ───────────────────────────────────────────────────────────────

describe('uncomplete()', () => {
  it('removes a completion and re-locks the dependent module', () => {
    courseStore.complete('how-wine-works');
    expect(courseStore.isCompleted('how-wine-works')).toBe(true);
    expect(courseStore.isUnlocked('how-to-taste')).toBe(true);

    courseStore.uncomplete('how-wine-works');
    expect(courseStore.isCompleted('how-wine-works')).toBe(false);
    expect(courseStore.isUnlocked('how-to-taste')).toBe(false);
  });
});

// ─── Persistence round-trip ───────────────────────────────────────────────────

describe('persistence round-trip', () => {
  it('survives a reload() after completing a module', () => {
    courseStore.complete('how-wine-works');
    courseStore.complete('how-to-taste');

    // Simulate a page reload: re-read from localStorage
    courseStore.reload();

    expect(courseStore.isCompleted('how-wine-works')).toBe(true);
    expect(courseStore.isCompleted('how-to-taste')).toBe(true);
    expect(courseStore.completedCount()).toBe(2);
    expect(courseStore.nextModule()!.id).toBe('the-5-families');
  });

  it('reload() with empty storage produces a clean state', () => {
    courseStore.complete('how-wine-works');
    fakeStorage.clear();
    courseStore.reload();

    expect(courseStore.completedCount()).toBe(0);
    expect(courseStore.isCompleted('how-wine-works')).toBe(false);
  });

  it('serialised JSON has v:1 and the correct completed keys', () => {
    courseStore.complete('how-wine-works');
    const raw = fakeStorage.getItem('bb_course_v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.v).toBe(1);
    expect(parsed.completed).toEqual({ 'how-wine-works': true });
  });
});

// ─── isUnlocked: sequential gating contract ──────────────────────────────────

describe('isUnlocked — sequential gating', () => {
  it('module 1 is always unlocked (no predecessor)', () => {
    expect(courseStore.isUnlocked('how-wine-works')).toBe(true);
  });

  it('unknown id returns false (defensive)', () => {
    expect(courseStore.isUnlocked('non-existent-module')).toBe(false);
  });

  it('only the immediate predecessor needs to be completed to unlock next', () => {
    // Complete modules 1 and 2 but not 3; module 4 should still be locked
    courseStore.complete('how-wine-works');
    courseStore.complete('how-to-taste');

    expect(courseStore.isUnlocked('the-5-families')).toBe(true);   // predecessor (2) done
    expect(courseStore.isUnlocked('whites-and-bubbles')).toBe(false); // predecessor (3) not done
  });
});
