// "The allergen sweep" — romance-session mechanics (single forced rung,
// first-attempt grade, miss → 'again' + reteach next + recycle ~3, always
// finishable) where the one rung is the allergen MC, answered via answerMc +
// advance() — NOT selfGrade. Grades feed the SAME dish:<foodId> items.
import { describe, expect, it } from 'vitest';
import { allergenMcFor } from '$lib/journey/items';
import { itemsForUnit } from '$lib/journey/items';
import type { JourneyItem } from '$lib/journey/types';
import { createAllergenSession, type AllergenSession } from './index';

function logging() {
  const calls: string[] = [];
  const deps = {
    onResult: (id: string, grade: string) => calls.push(`result:${id}:${grade}`)
  };
  return { calls, deps };
}

/** Answer the current MC right or wrong, then advance through the feedback. */
function answer(s: AllergenSession, item: JourneyItem, right: boolean): void {
  const mc = allergenMcFor(item);
  const i = right ? mc.answerIndex : (mc.answerIndex + 1) % mc.choices.length;
  const res = s.answerMc(i);
  expect(res.correct).toBe(right);
  expect(res.answerIndex).toBe(mc.answerIndex);
  s.advance();
}

describe('allergen sweep: one forced MC rung, caller order', () => {
  it("asks every item once at rung 'mc' variant 'allergen', in the given order", () => {
    const items = itemsForUnit('snacks'); // 4 dish items, all flagged
    const { calls, deps } = logging();
    const s = createAllergenSession(items, deps);
    for (const item of items) {
      expect(s.current()).toEqual({ type: 'quiz', item, rung: 'mc', variant: 'allergen' });
      answer(s, item, true);
    }
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(calls).toEqual(items.map((i) => `result:${i.id}:good`));
  });

  it('rejects service items — only dishes carry flags', () => {
    const [svc] = itemsForUnit('day-one');
    expect(() => createAllergenSession([svc], logging().deps)).toThrow(/dish/);
  });

  it('rejects flagless dishes — the caller excludes them via hasAllergenMc', () => {
    // the one real flagless food (off-path, so never minted by the journey)
    const flagless: JourneyItem = {
      id: 'dish:matinee-snack-menu',
      kind: 'dish',
      unitId: 'snacks',
      foodId: 'matinee-snack-menu'
    };
    expect(() => createAllergenSession([flagless], logging().deps)).toThrow(/allergens card/);
  });

  it('answerMc feedback keeps the step current; double-answer and blind advance throw', () => {
    const items = itemsForUnit('snacks');
    const s = createAllergenSession(items, logging().deps);
    expect(() => s.advance()).toThrow(/answer the MC/);
    const mc = allergenMcFor(items[0]);
    expect(() => s.answerMc(99)).toThrow(/out of range/);
    s.answerMc(mc.answerIndex);
    expect(s.current()).toEqual({ type: 'quiz', item: items[0], rung: 'mc', variant: 'allergen' });
    expect(() => s.answerMc(mc.answerIndex)).toThrow(/already answered/);
    s.advance();
    expect(s.progress().position).toBe(1);
  });

  it('selfGrade never applies — the sweep is button-graded, not self-graded', () => {
    const items = itemsForUnit('snacks');
    const s = createAllergenSession(items, logging().deps);
    expect(() => s.selfGrade(true)).toThrow(/answerMc/);
  });
});

describe('allergen sweep: miss → again → reteach → retry → clear', () => {
  it("emits 'again' on the missed advance, reteaches next, retries at the same rung, clears silently", () => {
    const items = itemsForUnit('snacks'); // 4 items
    const { calls, deps } = logging();
    const s = createAllergenSession(items, deps);

    answer(s, items[0], false); // miss the first item
    expect(calls).toEqual([`result:${items[0].id}:again`]); // emitted at resolution

    // reteach injected NEXT
    expect(s.current()).toEqual({ type: 'reteach', item: items[0] });
    s.advance();

    // the other three items come before the retry
    for (const it of items.slice(1)) {
      expect(s.current()).toEqual({ type: 'quiz', item: it, rung: 'mc', variant: 'allergen' });
      answer(s, it, true);
    }

    // retry at the SAME allergen-mc rung; clearing emits nothing further
    expect(s.current()).toEqual({ type: 'quiz', item: items[0], rung: 'mc', variant: 'allergen' });
    answer(s, items[0], true);
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
    const s = createAllergenSession([a], deps);

    answer(s, a, false); // first miss → 'again'
    expect(calls).toEqual([`result:${a.id}:again`]);
    s.advance(); // reteach
    expect(s.current()).toEqual({ type: 'quiz', item: a, rung: 'mc', variant: 'allergen' });

    answer(s, a, false); // second miss → NO new event, but reteach again
    expect(calls).toEqual([`result:${a.id}:again`]);
    expect(s.current()).toEqual({ type: 'reteach', item: a });
    s.advance();

    answer(s, a, true); // clears
    expect(s.isComplete()).toBe(true);
    expect(calls).toEqual([`result:${a.id}:again`]);
    expect(s.summary()).toEqual({
      perItem: [{ itemId: a.id, missed: true }],
      cleared: 1,
      misses: 2 // miss EVENTS; the 'again' grade still fired once
    });
  });

  it('reteach steps resolve via advance(); answerMc on them throws', () => {
    const [a, b] = itemsForUnit('snacks');
    const s = createAllergenSession([a, b], logging().deps);
    answer(s, a, false);
    expect(s.current()).toEqual({ type: 'reteach', item: a });
    expect(() => s.answerMc(0)).toThrow(/reteach/);
    s.advance();
    expect(s.current()!.item.id).toBe(b.id);
  });

  it('progress counts steps + grows with misses; summary throws before completion', () => {
    const items = itemsForUnit('snacks');
    const { deps } = logging();
    const s = createAllergenSession(items, deps);
    expect(s.progress()).toEqual({ position: 0, total: 4, cleared: 0, misses: 0 });
    answer(s, items[0], false);
    // +2 steps queued: the reteach and the retry
    expect(s.progress()).toEqual({ position: 1, total: 6, cleared: 0, misses: 1 });
    expect(() => s.summary()).toThrow();
    s.advance(); // reteach
    for (const it of items.slice(1)) answer(s, it, true);
    answer(s, items[0], true);
    expect(s.isComplete()).toBe(true);
    expect(s.progress()).toEqual({ position: 6, total: 6, cleared: 4, misses: 1 });
    expect(() => s.answerMc(0)).toThrow(/complete/);
    expect(() => s.advance()).toThrow(/complete/);
  });
});
