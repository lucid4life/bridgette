// Romance drill session: review-session mechanics at ONE forced rung
// 'romance'. First attempt decides the grade: correct → 'good'; miss →
// 'again' immediately, reteach next, retry at romance ~3 later; an item
// clears on its first correct answer and clearing emits nothing further.
import { describe, expect, it } from 'vitest';
import type { JourneyItem } from '$lib/journey/types';
import { itemsForUnit } from '$lib/journey/items';
import { createRomanceSession } from './index';

function logging() {
  const calls: string[] = [];
  const deps = {
    onResult: (id: string, grade: string) => calls.push(`result:${id}:${grade}`)
  };
  return { calls, deps };
}

describe('romance session: one forced rung, caller order', () => {
  it("asks every item once at rung 'romance', in the given order", () => {
    const items = itemsForUnit('snacks'); // 4 dish items
    const { calls, deps } = logging();
    const s = createRomanceSession(items, deps);
    for (const item of items) {
      expect(s.current()).toEqual({ type: 'quiz', item, rung: 'romance' });
      s.selfGrade(true);
    }
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(calls).toEqual(items.map((i) => `result:${i.id}:good`));
  });

  it('rejects service items — only dishes get romanced', () => {
    const [svc] = itemsForUnit('day-one');
    expect(() => createRomanceSession([svc], logging().deps)).toThrow(/dish/);
  });
});

describe('romance session: miss → again → reteach → retry → clear', () => {
  it("emits 'again' immediately, reteaches next, retries at romance after ~3 steps, clears silently", () => {
    const items = itemsForUnit('snacks'); // 4 items
    const { calls, deps } = logging();
    const s = createRomanceSession(items, deps);

    s.selfGrade(false); // miss the first item
    expect(calls).toEqual([`result:${items[0].id}:again`]); // emitted synchronously

    // reteach injected NEXT
    expect(s.current()).toEqual({ type: 'reteach', item: items[0] });
    s.advance();

    // the other three items come before the retry
    for (const it of items.slice(1)) {
      expect(s.current()).toEqual({ type: 'quiz', item: it, rung: 'romance' });
      s.selfGrade(true);
    }

    // retry at the SAME romance rung; clearing emits nothing further
    expect(s.current()).toEqual({ type: 'quiz', item: items[0], rung: 'romance' });
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
    const [a] = itemsForUnit('snacks');
    const { calls, deps } = logging();
    const s = createRomanceSession([a], deps);

    s.selfGrade(false); // first miss → 'again'
    expect(calls).toEqual([`result:${a.id}:again`]);
    s.advance(); // reteach
    expect(s.current()).toEqual({ type: 'quiz', item: a, rung: 'romance' }); // empty rest → retry immediately

    s.selfGrade(false); // second miss → NO new event, but reteach again
    expect(calls).toEqual([`result:${a.id}:again`]);
    expect(s.current()).toEqual({ type: 'reteach', item: a });
    s.advance();

    s.selfGrade(true); // clears
    expect(s.isComplete()).toBe(true);
    expect(calls).toEqual([`result:${a.id}:again`]);
    expect(s.summary()).toEqual({
      perItem: [{ itemId: a.id, missed: true }],
      cleared: 1,
      misses: 2 // miss EVENTS; the 'again' grade still fired once
    });
  });

  it("two missed items each emit exactly one 'again' and the drill still finishes", () => {
    const [a, b] = itemsForUnit('snacks');
    const { calls, deps } = logging();
    const s = createRomanceSession([a, b], deps);
    let guard = 0;
    let missed = 0;
    while (!s.isComplete()) {
      if (++guard > 50) throw new Error('test: runaway session');
      const step = s.current()!;
      if (step.type === 'reteach') {
        s.advance();
        continue;
      }
      if (missed < 2) {
        missed++;
        s.selfGrade(false); // miss each item's first attempt
      } else {
        s.selfGrade(true);
      }
    }
    expect(calls.sort()).toEqual([`result:${a.id}:again`, `result:${b.id}:again`].sort());
  });
});

describe('romance session: progress + API misuse', () => {
  it('progress counts position, growing total, cleared, miss events', () => {
    const [a, b] = itemsForUnit('snacks');
    const s = createRomanceSession([a, b], logging().deps);
    expect(s.progress()).toEqual({ position: 0, total: 2, cleared: 0, misses: 0 });
    s.selfGrade(false); // +reteach +retry
    expect(s.progress()).toEqual({ position: 1, total: 4, cleared: 0, misses: 1 });
    s.advance(); // reteach consumed
    expect(s.progress()).toEqual({ position: 2, total: 4, cleared: 0, misses: 1 });
    s.selfGrade(true); // b clears
    expect(s.progress()).toEqual({ position: 3, total: 4, cleared: 1, misses: 1 });
    s.selfGrade(true); // a retry clears
    expect(s.progress()).toEqual({ position: 4, total: 4, cleared: 2, misses: 1 });
    expect(s.isComplete()).toBe(true);
  });

  it('guards wrong calls', () => {
    const [a] = itemsForUnit('snacks');
    const s = createRomanceSession([a], logging().deps);
    expect(() => s.answerMc(0)).toThrow(); // romance has no MC steps
    expect(() => s.advance()).toThrow(); // retrieval resolves via selfGrade
    expect(() => s.summary()).toThrow(); // not complete
    s.selfGrade(false);
    expect(() => s.selfGrade(true)).toThrow(); // reteach resolves via advance
    s.advance();
    s.selfGrade(true);
    expect(s.isComplete()).toBe(true);
    expect(() => s.advance()).toThrow();
    expect(() => s.selfGrade(true)).toThrow();
  });

  it('an empty drill is complete immediately', () => {
    const s = createRomanceSession([], logging().deps);
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(s.progress()).toEqual({ position: 0, total: 0, cleared: 0, misses: 0 });
    expect(s.summary()).toEqual({ perItem: [], cleared: 0, misses: 0 });
  });
});

describe('romance session: the drill covers all 41 path dishes', () => {
  it('finishes a clean full-menu run with one good per dish', () => {
    const dishes: JourneyItem[] = itemsForUnit('checkpoint-food').filter((i) => i.kind === 'dish');
    expect(dishes.length).toBe(41);
    const { calls, deps } = logging();
    const s = createRomanceSession(dishes, deps);
    while (!s.isComplete()) s.selfGrade(true);
    expect(calls.length).toBe(41);
    expect(s.summary().cleared).toBe(41);
  });
});
