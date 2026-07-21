// Build drill session: review-session mechanics at ONE forced rung 'build'.
// First attempt decides the grade: correct → 'good'; miss → 'again' immediately,
// reteach next, retry at build ~3 later; an item clears on its first correct
// answer and clearing emits nothing further. Mirrors romance.test.ts.
import { describe, expect, it } from 'vitest';
import type { JourneyItem } from '$lib/journey/types';
import { itemsForUnit } from '$lib/journey/items';
import { createBuildSession } from './index';

function logging() {
  const calls: string[] = [];
  const deps = {
    onResult: (id: string, grade: string) => calls.push(`result:${id}:${grade}`)
  };
  return { calls, deps };
}

describe('build session: one forced rung, caller order', () => {
  it("asks every build once at rung 'build', in the given order", () => {
    const items = itemsForUnit('bar-bright'); // the bar-bright build items, in roster order
    const { calls, deps } = logging();
    const s = createBuildSession(items, deps);
    for (const item of items) {
      expect(s.current()).toEqual({ type: 'quiz', item, rung: 'build' });
      s.selfGrade(true);
    }
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(calls).toEqual(items.map((i) => `result:${i.id}:good`));
  });

  it('rejects non-build items — only build:* get built', () => {
    const [svc] = itemsForUnit('bar-arc'); // a service item
    expect(() => createBuildSession([svc], logging().deps)).toThrow(/build/);
  });
});

describe('build session: miss → again → reteach → retry → clear', () => {
  it("emits 'again' immediately, reteaches next, retries at build after ~3 steps, clears silently", () => {
    // A fixed 4-item slice: this exercises the miss→recycle mechanics (item0 comes
    // back after the other three), independent of how many drinks bar-bright holds.
    const items = itemsForUnit('bar-bright').slice(0, 4);
    const { calls, deps } = logging();
    const s = createBuildSession(items, deps);

    s.selfGrade(false); // miss the first item
    expect(calls).toEqual([`result:${items[0].id}:again`]);

    expect(s.current()).toEqual({ type: 'reteach', item: items[0] });
    s.advance();

    for (const it of items.slice(1)) {
      expect(s.current()).toEqual({ type: 'quiz', item: it, rung: 'build' });
      s.selfGrade(true);
    }

    expect(s.current()).toEqual({ type: 'quiz', item: items[0], rung: 'build' });
    s.selfGrade(true);
    expect(s.isComplete()).toBe(true);
    expect(calls).toEqual([
      `result:${items[0].id}:again`,
      `result:${items[1].id}:good`,
      `result:${items[2].id}:good`,
      `result:${items[3].id}:good`
    ]);
    expect(s.summary()).toEqual({
      perItem: [
        { itemId: items[1].id, missed: false },
        { itemId: items[2].id, missed: false },
        { itemId: items[3].id, missed: false },
        { itemId: items[0].id, missed: true }
      ],
      cleared: 4,
      misses: 1
    });
  });

  it("repeat misses reteach + recycle again but emit only ONE 'again' per item", () => {
    const [a] = itemsForUnit('bar-bright');
    const { calls, deps } = logging();
    const s = createBuildSession([a], deps);

    s.selfGrade(false);
    expect(calls).toEqual([`result:${a.id}:again`]);
    s.advance();
    expect(s.current()).toEqual({ type: 'quiz', item: a, rung: 'build' });

    s.selfGrade(false);
    expect(calls).toEqual([`result:${a.id}:again`]);
    expect(s.current()).toEqual({ type: 'reteach', item: a });
    s.advance();

    s.selfGrade(true);
    expect(s.isComplete()).toBe(true);
    expect(calls).toEqual([`result:${a.id}:again`]);
    expect(s.summary()).toEqual({
      perItem: [{ itemId: a.id, missed: true }],
      cleared: 1,
      misses: 2
    });
  });
});

describe('build session: progress + API misuse', () => {
  it('progress counts position, growing total, cleared, miss events', () => {
    const [a, b] = itemsForUnit('bar-bright');
    const s = createBuildSession([a, b], logging().deps);
    expect(s.progress()).toEqual({ position: 0, total: 2, cleared: 0, misses: 0 });
    s.selfGrade(false);
    expect(s.progress()).toEqual({ position: 1, total: 4, cleared: 0, misses: 1 });
    s.advance();
    expect(s.progress()).toEqual({ position: 2, total: 4, cleared: 0, misses: 1 });
    s.selfGrade(true);
    expect(s.progress()).toEqual({ position: 3, total: 4, cleared: 1, misses: 1 });
    s.selfGrade(true);
    expect(s.progress()).toEqual({ position: 4, total: 4, cleared: 2, misses: 1 });
    expect(s.isComplete()).toBe(true);
  });

  it('guards wrong calls', () => {
    const [a] = itemsForUnit('bar-bright');
    const s = createBuildSession([a], logging().deps);
    expect(() => s.answerMc(0)).toThrow();
    expect(() => s.advance()).toThrow();
    expect(() => s.summary()).toThrow();
    s.selfGrade(false);
    expect(() => s.selfGrade(true)).toThrow();
    s.advance();
    s.selfGrade(true);
    expect(s.isComplete()).toBe(true);
    expect(() => s.advance()).toThrow();
    expect(() => s.selfGrade(true)).toThrow();
  });

  it('an empty drill is complete immediately', () => {
    const s = createBuildSession([], logging().deps);
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(s.progress()).toEqual({ position: 0, total: 0, cleared: 0, misses: 0 });
    expect(s.summary()).toEqual({ perItem: [], cleared: 0, misses: 0 });
  });
});

describe('build session: the drill covers all 14 cocktails with builds', () => {
  it('finishes a clean full-bar run with one good per build', () => {
    const builds: JourneyItem[] = itemsForUnit('checkpoint-bar').filter((i) => i.kind === 'build');
    expect(builds.length).toBe(14);
    const { calls, deps } = logging();
    const s = createBuildSession(builds, deps);
    while (!s.isComplete()) s.selfGrade(true);
    expect(calls.length).toBe(14);
    expect(s.summary().cleared).toBe(14);
  });
});
