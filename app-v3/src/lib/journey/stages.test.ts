// Task D — journey path data: Stage 1 "Food Runner" unit table + locked stages 2-5.
// Spec: docs/handoffs/2026-06-11-v3-phase1-spec.md (unit ids/titles locked).
import { describe, expect, it } from 'vitest';
import { data } from '$lib/data';
import { CHECKPOINT_UNIT_ID, STAGES, UNIT_BUILD_IDS, UNIT_FOOD_IDS, UNIT_WINE_IDS, stageById, unitById } from './stages';

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
      'day-one': 'Seats & service',
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
  it('declares allergen-guardian + behind-the-bar + wine (built), then pairings (locked)', () => {
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

    // Stage 3 is built: arc-of-service module + 4 build modules + a checkpoint.
    const stage3 = STAGES[2];
    expect(stage3.locked).not.toBe(true);
    expect(stage3.units.map((u) => u.id)).toEqual([
      'bar-arc',
      'bar-bright',
      'bar-floral',
      'bar-spirit',
      'bar-zero',
      'checkpoint-bar'
    ]);
    expect(stage3.units.filter((u) => u.kind === 'checkpoint')).toHaveLength(1);
    expect(stage3.units.every((u) => !u.blurb.includes('\n'))).toBe(true);

    // Stage 4 is built: 5 family modules + a checkpoint.
    const stage4 = STAGES[3];
    expect(stage4.locked).not.toBe(true);
    expect(stage4.units.map((u) => u.id)).toEqual([
      'wine-bubbles',
      'wine-bright',
      'wine-round',
      'wine-light',
      'wine-structured',
      'checkpoint-wine'
    ]);
    expect(stage4.units.filter((u) => u.kind === 'checkpoint')).toHaveLength(1);

    // Stage 5 (pairings) stays declared-but-locked (no content yet).
    for (const s of STAGES.slice(4)) {
      expect(s.locked, s.id).toBe(true);
      expect(s.units, s.id).toEqual([]);
    }
  });
});

describe('wine roster (UNIT_WINE_IDS)', () => {
  it('covers all 17 by-the-glass pours exactly once across the 5 family modules', () => {
    const all = Object.values(UNIT_WINE_IDS).flat();
    expect(all.length).toBe(17);
    expect(new Set(all).size).toBe(17);
  });

  it('covers EXACTLY data.wines (every glass pour placed, none dropped)', () => {
    const wines = data.wines.map((w) => w.id).sort();
    const rostered = Object.values(UNIT_WINE_IDS).flat().sort();
    expect(rostered).toEqual(wines);
  });

  it('the checkpoint mints no wine rows', () => {
    expect(UNIT_WINE_IDS['checkpoint-wine']).toBeUndefined();
  });

  it('every listed wineId exists in data.wines and is in its declared family', () => {
    const FAMILY_OF_UNIT: Record<string, string> = {
      'wine-bubbles': 'Bubbles & Rosé',
      'wine-bright': 'Bright & Crisp Whites',
      'wine-round': 'Round Whites',
      'wine-light': 'Light Reds',
      'wine-structured': 'Structured Reds'
    };
    for (const [unit, ids] of Object.entries(UNIT_WINE_IDS)) {
      for (const id of ids) {
        const w = data.wines.find((x) => x.id === id);
        expect(w, id).toBeDefined();
        expect(w!.family, id).toBe(FAMILY_OF_UNIT[unit]);
      }
    }
  });
});

describe('build roster (UNIT_BUILD_IDS)', () => {
  it('covers the 13 cocktails with official builds exactly once across 4 modules', () => {
    const all = Object.values(UNIT_BUILD_IDS).flat();
    expect(all.length).toBe(13);
    expect(new Set(all).size).toBe(13);
  });

  it('covers EXACTLY the cocktails that carry an official build (no drink dropped)', () => {
    const built = data.cocktails
      .filter((c) => c.build && c.build.length > 0)
      .map((c) => c.id)
      .sort();
    const rostered = Object.values(UNIT_BUILD_IDS).flat().sort();
    expect(rostered).toEqual(built);
  });

  it('the arc-of-service module and the checkpoint mint no build rows', () => {
    expect(UNIT_BUILD_IDS['bar-arc']).toBeUndefined();
    expect(UNIT_BUILD_IDS['checkpoint-bar']).toBeUndefined();
  });

  it('every listed cocktailId exists in data.cocktails WITH an official build', () => {
    for (const cocktailId of Object.values(UNIT_BUILD_IDS).flat()) {
      const c = data.cocktails.find((x) => x.id === cocktailId);
      expect(c, cocktailId).toBeDefined();
      expect(c!.build && c!.build.length, cocktailId).toBeGreaterThan(0);
    }
  });

  it('excludes the build-less cocktails (Spicy Sandia, Lovers Mountain)', () => {
    const all = Object.values(UNIT_BUILD_IDS).flat();
    expect(all).not.toContain('spicy-sandia');
    expect(all).not.toContain('lovers-mountain');
  });

  it('pins the module rosters by flavour family', () => {
    expect(UNIT_BUILD_IDS['bar-bright']).toEqual([
      'jr-stargazer',
      'eat-apres-love',
      'cruel-summer',
      'paradise-city'
    ]);
    // Order follows the data.cocktails array (floral + bitter categories interleave).
    expect(UNIT_BUILD_IDS['bar-floral']).toEqual([
      'heartbreak-mountain',
      'doctor-jones',
      'french-export',
      'white-peach-negroni',
      'cloud-9'
    ]);
    expect(UNIT_BUILD_IDS['bar-spirit']).toEqual(['spaghetti-western', 'rolling-canoe']);
    expect(UNIT_BUILD_IDS['bar-zero']).toEqual(['short-film', 'sunrise-spritz']);
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
