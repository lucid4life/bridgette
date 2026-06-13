// Task D — journey path data: Stage 1 "Food Runner" unit table + locked stages 2-5.
// Spec: docs/handoffs/2026-06-11-v3-phase1-spec.md (unit ids/titles locked).
import { describe, expect, it } from 'vitest';
import { data } from '$lib/data';
import { CHECKPOINT_UNIT_ID, STAGES, UNIT_FOOD_IDS, stageById, unitById } from './stages';

const LESSON_ORDER = [
  'day-one',
  'snacks',
  'snacks-2',
  'small-plates',
  'vegetables',
  'pizza',
  'pasta',
  'mains',
  'dessert'
] as const;

describe('stage 1: food-runner', () => {
  const stage = stageById('food-runner');

  it('declares id, title, track and a blurb', () => {
    expect(stage.id).toBe('food-runner');
    expect(stage.title).toBe('Food Runner');
    expect(stage.track).toBe('food');
    expect(stage.blurb.length).toBeGreaterThan(0);
    expect(stage.locked).not.toBe(true);
  });

  it('has the 10 units in locked path order', () => {
    expect(stage.units.map((u) => u.id)).toEqual([...LESSON_ORDER, CHECKPOINT_UNIT_ID]);
  });

  it('locks the unit titles', () => {
    const titles = Object.fromEntries(stage.units.map((u) => [u.id, u.title]));
    expect(titles).toEqual({
      'day-one': 'Day one',
      snacks: 'Snacks',
      'snacks-2': 'Snacks II',
      'small-plates': 'Small plates',
      vegetables: 'Vegetables',
      pizza: 'Pizza',
      pasta: 'Pasta',
      mains: 'Mains',
      dessert: 'Dessert',
      'checkpoint-food': 'Shift check: Food'
    });
  });

  it('marks exactly one checkpoint unit (the last one)', () => {
    const kinds = stage.units.map((u) => u.kind);
    expect(kinds.slice(0, -1).every((k) => k === 'lesson')).toBe(true);
    expect(kinds[kinds.length - 1]).toBe('checkpoint');
  });

  it('every unit carries a one-line guest-facing blurb', () => {
    for (const u of stage.units) {
      expect(u.blurb.length, u.id).toBeGreaterThan(0);
      expect(u.blurb, u.id).not.toMatch(/\n/);
    }
  });
});

describe('dish roster (UNIT_FOOD_IDS)', () => {
  it('covers the 41 syllabus dishes exactly once across the 8 dish units', () => {
    const all = Object.values(UNIT_FOOD_IDS).flat();
    expect(all.length).toBe(41);
    expect(new Set(all).size).toBe(41);
  });

  it('day-one and the checkpoint mint no dish rows', () => {
    expect(UNIT_FOOD_IDS['day-one']).toBeUndefined();
    expect(UNIT_FOOD_IDS[CHECKPOINT_UNIT_ID]).toBeUndefined();
  });

  it('every listed foodId exists in data.foods WITH official ingredients', () => {
    for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
      const food = data.foods.find((f) => f.id === foodId);
      expect(food, foodId).toBeDefined();
      expect(food!.ingredients && food!.ingredients.length, foodId).toBeGreaterThan(0);
    }
  });

  it('pins the locked unit rosters', () => {
    expect(UNIT_FOOD_IDS.snacks).toEqual(['french-fries', 'hummus-chips', 'garlic-bread', 'cashews']);
    expect(UNIT_FOOD_IDS['snacks-2']).toEqual(['eggplant-fries', 'roasted-olives', 'bread-butter']);
    expect(UNIT_FOOD_IDS.dessert).toEqual(['the-banana-pie', 'apple-tatin', 'chocolate-pot-de-creme']);
    expect(UNIT_FOOD_IDS.mains.length).toBe(7);
    expect(UNIT_FOOD_IDS['small-plates'].length).toBe(7);
    expect(UNIT_FOOD_IDS.vegetables.length).toBe(7);
    expect(UNIT_FOOD_IDS.pizza.length).toBe(5);
    expect(UNIT_FOOD_IDS.pasta.length).toBe(5);
  });
});

describe('stages 2-5', () => {
  it('declares allergen-guardian (Stage 2, built), then behind-the-bar/wine/pairings (locked)', () => {
    expect(STAGES.map((s) => s.id)).toEqual([
      'food-runner',
      'allergen-guardian',
      'behind-the-bar',
      'wine',
      'pairings'
    ]);
    const later = STAGES.slice(1);
    expect(later.map((s) => s.title)).toEqual(['Allergen Guardian', 'Behind the Bar', 'Wine', 'Pairings']);
    expect(later.map((s) => s.track)).toEqual(['allergens', 'bar', 'wine', 'pairings']);
    for (const s of later) expect(s.blurb.length, s.id).toBeGreaterThan(0);

    // Stage 2 is built: not statically locked (gating unlocks it sequentially),
    // 4 allergen-family lesson units + a checkpoint.
    const stage2 = STAGES[1];
    expect(stage2.locked).not.toBe(true);
    expect(stage2.units.map((u) => u.id)).toEqual([
      'allergens-seafood',
      'allergens-nuts',
      'allergens-diet',
      'allergens-common',
      'checkpoint-allergens'
    ]);
    expect(stage2.units.filter((u) => u.kind === 'checkpoint')).toHaveLength(1);

    // Stages 3-5 stay declared-but-locked (no content yet).
    for (const s of STAGES.slice(2)) {
      expect(s.locked, s.id).toBe(true);
      expect(s.units, s.id).toEqual([]);
    }
  });
});

describe('lookup helpers', () => {
  it('stageById / unitById resolve, and throw on unknown ids', () => {
    expect(stageById('wine').title).toBe('Wine');
    const { unit, stage, index } = unitById('snacks');
    expect(unit.title).toBe('Snacks');
    expect(stage.id).toBe('food-runner');
    expect(index).toBe(1);
    expect(() => stageById('nope')).toThrow();
    expect(() => unitById('nope')).toThrow();
  });
});
