// Task D — item derivation + content accessors (dish:* / service:* items).
// Dish MC content REUSES the frozen v2 engine card (components:<foodId>:pick);
// teach/cued/free derive only from official data.foods fields.
import { describe, expect, it } from 'vitest';
import { data, type Card } from '$lib/data';
import { generateDeck } from '$lib/engine/training.js';
import { CHECKPOINT_UNIT_ID, UNIT_FOOD_IDS, stageById } from './stages';
import { SERVICE_ITEMS } from './service-items';
import { allStage1Items, cuedFor, freeFor, itemsForUnit, mcFor, teachFor } from './items';
import type { JourneyItem } from './types';

const food = (id: string) => data.foods.find((f) => f.id === id)!;
const dishItem = (foodId: string): JourneyItem =>
  allStage1Items().find((i) => i.foodId === foodId)!;

describe('itemsForUnit', () => {
  it('day-one yields the 16 service items in authored order', () => {
    const items = itemsForUnit('day-one');
    expect(items.map((i) => i.id)).toEqual(SERVICE_ITEMS.map((s) => s.id));
    for (const i of items) {
      expect(i.kind).toBe('service');
      expect(i.unitId).toBe('day-one');
      expect(i.foodId).toBeUndefined();
    }
  });

  it('dish units yield one dish:<foodId> item per dish, in roster order', () => {
    const items = itemsForUnit('snacks');
    expect(items.map((i) => i.id)).toEqual([
      'dish:french-fries',
      'dish:hummus-chips',
      'dish:garlic-bread',
      'dish:cashews'
    ]);
    for (const i of items) {
      expect(i.kind).toBe('dish');
      expect(i.unitId).toBe('snacks');
      expect(i.foodId).toBe(i.id.slice('dish:'.length));
    }
  });

  it('checkpoint-food yields ALL 57 stage items (16 service + 41 dish)', () => {
    const items = itemsForUnit(CHECKPOINT_UNIT_ID);
    expect(items.length).toBe(57);
    expect(items.filter((i) => i.kind === 'service').length).toBe(16);
    expect(items.filter((i) => i.kind === 'dish').length).toBe(41);
    // exactly the union of the 9 lesson units, home unitIds preserved
    const lessons = stageById('food-runner')
      .units.filter((u) => u.kind === 'lesson')
      .flatMap((u) => itemsForUnit(u.id));
    expect(items).toEqual(lessons);
  });

  it('throws on an unknown unit id', () => {
    expect(() => itemsForUnit('nope')).toThrow();
  });
});

describe('allStage1Items', () => {
  it('returns 57 unique items', () => {
    const items = allStage1Items();
    expect(items.length).toBe(57);
    expect(new Set(items.map((i) => i.id)).size).toBe(57);
  });
});

describe('mcFor: dish items reuse the REAL engine card', () => {
  const deck = generateDeck('components', data) as Card[];

  it.each(Object.values(UNIT_FOOD_IDS).flat())('%s', (foodId) => {
    const card = deck.find((c) => c.sourceId === foodId)!;
    expect(card).toBeDefined();
    const mc = mcFor(dishItem(foodId));
    expect(mc.prompt).toBe(card.prompt);
    expect([...mc.choices].sort()).toEqual([...card.choices!].sort());
    expect(mc.choices[mc.answerIndex]).toBe(card.answer);
  });

  it('is deterministic per item (same choice order on every call)', () => {
    const a = mcFor(dishItem('tuna-crudo'));
    const b = mcFor(dishItem('tuna-crudo'));
    expect(a).toEqual(b);
  });
});

describe('mcFor: service items', () => {
  it('serves the authored choices with a correct answerIndex, deterministically', () => {
    for (const s of SERVICE_ITEMS) {
      const item = itemsForUnit('day-one').find((i) => i.id === s.id)!;
      const mc = mcFor(item);
      expect(mc.prompt).toBe(s.prompt);
      expect([...mc.choices].sort()).toEqual([...s.choices].sort());
      expect(mc.choices[mc.answerIndex]).toBe(s.answer);
      expect(mcFor(item)).toEqual(mc);
    }
  });

  it('answer position varies across items (no always-first tell)', () => {
    const positions = new Set(
      itemsForUnit('day-one').map((i) => mcFor(i).answerIndex)
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('cuedFor', () => {
  it('dish: "What\'s in the <Name>?" + count-and-first-letter hint + full answer', () => {
    const cued = cuedFor(dishItem('tuna-crudo'));
    const f = food('tuna-crudo');
    expect(cued.prompt).toBe("What's in the Tuna Crudo?");
    expect(cued.hint).toContain('4');
    for (const ing of f.ingredients!) expect(cued.hint).toContain(ing[0].toUpperCase());
    expect(cued.answer).toBe(f.ingredients!.join(', '));
  });

  it('dish: hint leads with the official component count for every dish', () => {
    for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
      const cued = cuedFor(dishItem(foodId));
      expect(cued.hint, foodId).toContain(String(food(foodId).ingredients!.length));
    }
  });

  it('service: authored prompt/hint/answer pass through', () => {
    const s = SERVICE_ITEMS[0];
    const item = itemsForUnit('day-one')[0];
    expect(cuedFor(item)).toEqual({ prompt: s.prompt, hint: s.hint, answer: s.answer });
  });
});

describe('freeFor', () => {
  it('dish: romance-style prompt, official ingredients answer, description detail', () => {
    const f = food('grilled-octopus-salad');
    const free = freeFor(dishItem('grilled-octopus-salad'));
    expect(free.prompt).toContain('Grilled Octopus Salad');
    expect(free.prompt.toLowerCase()).toContain('guest');
    expect(free.answer).toBe(f.ingredients!.join(', '));
    expect(free.detail).toBe(f.description);
  });

  it('service: authored prompt/answer, no detail', () => {
    const s = SERVICE_ITEMS[3];
    const item = itemsForUnit('day-one')[3];
    const free = freeFor(item);
    expect(free.prompt).toBe(s.prompt);
    expect(free.answer).toBe(s.answer);
    expect(free.detail).toBeUndefined();
  });
});

describe('teachFor', () => {
  it('dish: official fields + photoId + non-negotiable confirm line', () => {
    const f = food('grilled-octopus-salad');
    const teach = teachFor(dishItem('grilled-octopus-salad'));
    if (teach.kind !== 'dish') throw new Error('expected dish teach');
    expect(teach.name).toBe(f.name);
    expect(teach.price).toBe(f.price);
    expect(teach.category).toBe(f.category);
    expect(teach.description).toBe(f.description);
    expect(teach.menu).toBe(f.menu);
    expect(teach.allergens).toEqual(f.allergens);
    expect(teach.allergenNote).toBe(f.allergenNote);
    expect(teach.photoId).toBe('grilled-octopus-salad');
    expect(teach.confirmLine).toBe(data.confirm.allergens);
  });

  it('dish: ingredients grouped into <=4 chunks, order preserved, split evenly', () => {
    for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
      const teach = teachFor(dishItem(foodId));
      if (teach.kind !== 'dish') throw new Error('expected dish teach');
      const official = food(foodId).ingredients!;
      expect(teach.ingredients.length, foodId).toBeLessThanOrEqual(4);
      expect(teach.ingredients.flat(), foodId).toEqual(official);
      const sizes = teach.ingredients.map((c) => c.length);
      expect(Math.max(...sizes) - Math.min(...sizes), foodId).toBeLessThanOrEqual(1);
    }
    // 6 ingredients -> 4 chunks; 4 ingredients -> 4 singleton chunks
    const six = teachFor(dishItem('grilled-octopus-salad'));
    if (six.kind === 'dish') expect(six.ingredients.length).toBe(4);
    const four = teachFor(dishItem('tuna-crudo'));
    if (four.kind === 'dish') expect(four.ingredients.map((c) => c.length)).toEqual([1, 1, 1, 1]);
  });

  it('service: short title + answer body + the cited why', () => {
    const s = SERVICE_ITEMS[10]; // service:no-auction
    const item = itemsForUnit('day-one')[10];
    const teach = teachFor(item);
    if (teach.kind !== 'service') throw new Error('expected service teach');
    expect(teach.name).toBe(s.title);
    expect(teach.body).toBe(s.answer);
    expect(teach.why).toBe(s.why);
  });
});
