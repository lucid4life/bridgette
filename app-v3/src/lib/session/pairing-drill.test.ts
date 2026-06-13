// Pairing "pour the room" drill: review-session mechanics at ONE forced rung
// 'pour'. First attempt decides the grade: correct → 'good'; miss → 'again'
// immediately, reteach next, retry at pour ~3 later; an item clears on its first
// correct answer and clearing emits nothing further. Mirrors build.test.ts.
import { describe, expect, it } from 'vitest';
import type { JourneyItem } from '$lib/journey/types';
import { itemsForUnit } from '$lib/journey/items';
import { createPairingDrillSession } from './index';

function logging() {
  const calls: string[] = [];
  const deps = { onResult: (id: string, grade: string) => calls.push(`result:${id}:${grade}`) };
  return { calls, deps };
}

const UNIT = 'pair-snacks';

describe('pour session: one forced rung, caller order', () => {
  it("asks every pairing once at rung 'pour', in the given order", () => {
    const items = itemsForUnit(UNIT);
    expect(items.length).toBeGreaterThan(1);
    expect(items.every((i) => i.kind === 'pairing')).toBe(true);
    const { calls, deps } = logging();
    const s = createPairingDrillSession(items, deps);
    for (const item of items) {
      expect(s.current()).toEqual({ type: 'quiz', item, rung: 'pour' });
      s.selfGrade(true);
    }
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(calls).toEqual(items.map((i) => `result:${i.id}:good`));
  });

  it('rejects non-pairing items — only pairing:* get poured', () => {
    const [dish] = itemsForUnit('snacks'); // a dish:* item
    expect(() => createPairingDrillSession([dish], logging().deps)).toThrow(/pairing/);
  });
});

describe('pour session: miss → again → reteach → retry → clear', () => {
  it("emits 'again' immediately + reteaches next, then the recycled item clears silently", () => {
    const items = itemsForUnit(UNIT);
    const { calls, deps } = logging();
    const s = createPairingDrillSession(items, deps);

    s.selfGrade(false); // miss the first item → immediate 'again' + reteach next
    expect(calls).toEqual([`result:${items[0].id}:again`]);
    expect(s.current()).toEqual({ type: 'reteach', item: items[0] });

    // drive to completion grading every retrieval 'good' (the recycled item lands
    // ~3 steps in for a longer unit, so don't assume it comes back last).
    let guard = 0;
    while (!s.isComplete()) {
      if (guard++ > 200) throw new Error('runaway');
      const step = s.current()!;
      if (step.type === 'reteach') s.advance();
      else {
        expect(step.rung).toBe('pour');
        s.selfGrade(true);
      }
    }
    // exactly one 'again' (item0) + one 'good' per OTHER item; the recycled item0
    // cleared silently (no second emit for it).
    expect(calls).toEqual([
      `result:${items[0].id}:again`,
      ...items.slice(1).map((i) => `result:${i.id}:good`)
    ]);
    const sum = s.summary();
    expect(sum.cleared).toBe(items.length);
    expect(sum.misses).toBe(1);
    expect(sum.perItem.find((r) => r.itemId === items[0].id)?.missed).toBe(true);
  });

  it("repeat misses reteach + recycle but emit only ONE 'again' per item", () => {
    const [a] = itemsForUnit(UNIT);
    const { calls, deps } = logging();
    const s = createPairingDrillSession([a], deps);

    s.selfGrade(false);
    expect(calls).toEqual([`result:${a.id}:again`]);
    s.advance();
    s.selfGrade(false); // miss again
    expect(calls).toEqual([`result:${a.id}:again`]); // still only one
    s.advance();
    s.selfGrade(true);
    expect(s.isComplete()).toBe(true);
    expect(s.summary()).toEqual({ perItem: [{ itemId: a.id, missed: true }], cleared: 1, misses: 2 });
  });
});

describe('pour session: progress + API misuse', () => {
  it('progress counts position, growing total, cleared, miss events', () => {
    const [a, b] = itemsForUnit(UNIT);
    const s = createPairingDrillSession([a, b], logging().deps);
    expect(s.progress()).toEqual({ position: 0, total: 2, cleared: 0, misses: 0 });
    s.selfGrade(false);
    expect(s.progress()).toEqual({ position: 1, total: 4, cleared: 0, misses: 1 });
    s.advance();
    s.selfGrade(true);
    s.selfGrade(true);
    expect(s.progress()).toEqual({ position: 4, total: 4, cleared: 2, misses: 1 });
    expect(s.isComplete()).toBe(true);
  });

  it('guards wrong calls + an empty drill is complete immediately', () => {
    const [a] = itemsForUnit(UNIT);
    const s = createPairingDrillSession([a], logging().deps);
    expect(() => s.answerMc(0)).toThrow();
    expect(() => s.advance()).toThrow();
    expect(() => s.summary()).toThrow();

    const empty = createPairingDrillSession([], logging().deps);
    expect(empty.isComplete()).toBe(true);
    expect(empty.current()).toBeNull();
    expect(empty.summary()).toEqual({ perItem: [], cleared: 0, misses: 0 });
  });
});

describe('pour session: the drill covers the full Stage-5 pairing roster', () => {
  it('finishes a clean run with one good per pairing', () => {
    const pours: JourneyItem[] = itemsForUnit('checkpoint-pairings').filter((i) => i.kind === 'pairing');
    expect(pours.length).toBeGreaterThan(10);
    const { calls, deps } = logging();
    const s = createPairingDrillSession(pours, deps);
    while (!s.isComplete()) s.selfGrade(true);
    expect(calls.length).toBe(pours.length);
    expect(s.summary().cleared).toBe(pours.length);
  });
});
