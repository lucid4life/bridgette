// Task E — review session: retrieval ONLY, rung by rank (learning → cued,
// solid/locked-in → free). First attempt decides the grade: correct → 'good';
// miss → 'again' immediately, reteach next, retry at cued ~3 later; an item
// clears on its first correct answer and clearing emits nothing further.
import { describe, expect, it } from 'vitest';
import type { Rank } from '$lib/srs/scheduler';
import type { JourneyItem } from '$lib/journey/types';
import { itemsForUnit } from '$lib/journey/items';
import { createReviewSession, type ReviewEntry } from './index';

const entry = (item: JourneyItem, rank: Rank): ReviewEntry => ({ item, rank });

function logging() {
  const calls: string[] = [];
  const deps = {
    onResult: (id: string, grade: string) => calls.push(`result:${id}:${grade}`)
  };
  return { calls, deps };
}

describe('review session: rungs by rank', () => {
  it("'learning' reviews at cued, 'solid' and 'locked-in' at free, in caller order", () => {
    const [a, b, c] = itemsForUnit('snacks');
    const { calls, deps } = logging();
    const s = createReviewSession(
      [entry(a, 'learning'), entry(b, 'solid'), entry(c, 'locked-in')],
      deps
    );
    expect(s.current()).toEqual({ type: 'quiz', item: a, rung: 'cued' });
    s.selfGrade(true);
    expect(s.current()).toEqual({ type: 'quiz', item: b, rung: 'free' });
    s.selfGrade(true);
    expect(s.current()).toEqual({ type: 'quiz', item: c, rung: 'free' });
    s.selfGrade(true);
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(calls).toEqual([
      `result:${a.id}:good`,
      `result:${b.id}:good`,
      `result:${c.id}:good`
    ]);
  });

  it("rejects rank 'new' — reviews are for introduced items only", () => {
    const [a] = itemsForUnit('snacks');
    expect(() => createReviewSession([entry(a, 'new')], logging().deps)).toThrow(/new/);
  });
});

describe('review session: miss → again → reteach → retry → clear', () => {
  it("emits 'again' immediately, reteaches next, retries at cued after ~3 steps, clears silently", () => {
    const items = itemsForUnit('snacks'); // 4 items
    const { calls, deps } = logging();
    const s = createReviewSession(
      items.map((i) => entry(i, 'learning')),
      deps
    );

    s.selfGrade(false); // miss the first item
    expect(calls).toEqual([`result:${items[0].id}:again`]); // emitted synchronously

    // reteach injected NEXT
    expect(s.current()).toEqual({ type: 'reteach', item: items[0] });
    s.advance();

    // the other three items come before the retry
    for (const it of items.slice(1)) {
      expect(s.current()).toEqual({ type: 'quiz', item: it, rung: 'cued' });
      s.selfGrade(true);
    }

    // retry at cued; clearing emits nothing further
    expect(s.current()).toEqual({ type: 'quiz', item: items[0], rung: 'cued' });
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

  it('a missed free-rung item retries at CUED', () => {
    const [a] = itemsForUnit('snacks');
    const s = createReviewSession([entry(a, 'solid')], logging().deps);
    expect(s.current()).toEqual({ type: 'quiz', item: a, rung: 'free' });
    s.selfGrade(false);
    s.advance(); // reteach
    expect(s.current()).toEqual({ type: 'quiz', item: a, rung: 'cued' });
  });

  it("repeat misses reteach + recycle again but emit only ONE 'again' per item", () => {
    const [a] = itemsForUnit('snacks');
    const { calls, deps } = logging();
    const s = createReviewSession([entry(a, 'learning')], deps);

    s.selfGrade(false); // first miss → 'again'
    expect(calls).toEqual([`result:${a.id}:again`]);
    s.advance(); // reteach
    expect(s.current()).toEqual({ type: 'quiz', item: a, rung: 'cued' }); // empty rest → retry immediately

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

  it("two missed items each emit exactly one 'again'", () => {
    const [a, b] = itemsForUnit('snacks');
    const { calls, deps } = logging();
    const s = createReviewSession([entry(a, 'learning'), entry(b, 'learning')], deps);
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

describe('review session: service items review like dish items', () => {
  it('uses the same rung mapping for service items', () => {
    const [svc] = itemsForUnit('day-one');
    const s = createReviewSession([entry(svc, 'learning')], logging().deps);
    expect(s.current()).toEqual({ type: 'quiz', item: svc, rung: 'cued' });
    s.selfGrade(true);
    expect(s.isComplete()).toBe(true);
  });
});

describe('review session: progress + API misuse', () => {
  it('progress counts position, growing total, cleared, miss events', () => {
    const [a, b] = itemsForUnit('snacks');
    const s = createReviewSession([entry(a, 'learning'), entry(b, 'learning')], logging().deps);
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
    const s = createReviewSession([entry(a, 'learning')], logging().deps);
    expect(() => s.answerMc(0)).toThrow(); // reviews have no MC steps
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

  it('an empty review is complete immediately', () => {
    const s = createReviewSession([], logging().deps);
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(s.progress()).toEqual({ position: 0, total: 0, cleared: 0, misses: 0 });
    expect(s.summary()).toEqual({ perItem: [], cleared: 0, misses: 0 });
  });
});
