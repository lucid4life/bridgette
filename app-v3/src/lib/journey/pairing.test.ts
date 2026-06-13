// Stage 5 — pairing:* accessor validity over the REAL food data. Mirrors
// wine.test.ts: reuse-the-frozen-engine-card (pairingMcFor ↔ pairing:<id>:match),
// determinism, no answer-first tell, and the cued/free/teach pour-recall shapes.
import { describe, expect, it } from 'vitest';
import { data, type Card } from '$lib/data';
import { generateDeck } from '$lib/engine/training.js';
import { LEVERS } from '$lib/engine/pairing.js';
import { UNIT_PAIRING_IDS } from './stages';
import { cuedFor, freeFor, itemsForUnit, mcFor, pairingMcFor, teachFor } from './items';
import type { PairingTeach } from './items';
import type { JourneyItem } from './types';

const PAIR_MODULES = ['pair-snacks', 'pair-veg-pizza', 'pair-pasta-mains', 'pair-dessert'] as const;
const PAIR_ITEMS: JourneyItem[] = PAIR_MODULES.flatMap((u) => [...itemsForUnit(u)]);
const foodById = new Map(data.foods.map((f) => [f.id, f]));
const LEVER_TABLE = LEVERS as Record<string, { label: string; script: string }>;

const pairingDeck = generateDeck('pairing', data) as Card[];
const pairCardOf = new Map(pairingDeck.filter((c) => c.sourceKind === 'food').map((c) => [c.sourceId!, c]));

describe('itemsForUnit: pairing modules', () => {
  it('mints pairing:<foodId> items in roster order, keyed to data.foods', () => {
    for (const u of PAIR_MODULES) {
      const items = itemsForUnit(u);
      expect(items.map((i) => i.id)).toEqual(UNIT_PAIRING_IDS[u].map((id) => `pairing:${id}`));
      for (const item of items) {
        expect(item.kind).toBe('pairing');
        expect(item.unitId).toBe(u);
        expect(foodById.has(item.foodId!), item.id).toBe(true);
      }
    }
  });

  it('checkpoint-pairings is the union of the four pairing modules', () => {
    const lessons = PAIR_MODULES.flatMap((u) => [...itemsForUnit(u)]);
    expect(itemsForUnit('checkpoint-pairings')).toEqual(lessons);
  });

  it('covers all 41 pairing items, unique', () => {
    expect(PAIR_ITEMS.length).toBe(41);
    expect(new Set(PAIR_ITEMS.map((i) => i.id)).size).toBe(41);
  });
});

describe('pairingMcFor: reuses the frozen pairing card', () => {
  it.each(PAIR_ITEMS.map((i) => [i.foodId!, i] as const))(
    '%s — MC matches pairing:<id>:match (dish → pour)',
    (foodId, item) => {
      const card = pairCardOf.get(foodId)!;
      expect(card, foodId).toBeDefined();
      const mc = pairingMcFor(item);
      expect(mc.prompt).toBe(card.prompt);
      expect([...mc.choices].sort()).toEqual([...card.choices!].sort());
      expect(mc.choices[mc.answerIndex]).toBe(card.answer); // the wine pour
      expect(new Set(mc.choices).size).toBe(4);
    }
  );

  it('the reveal teaches the lever that makes the pairing work', () => {
    for (const item of PAIR_ITEMS) {
      const f = foodById.get(item.foodId!)!;
      const mc = pairingMcFor(item);
      if (f.lever) {
        expect(mc.why).toContain(LEVER_TABLE[f.lever].label);
        expect(mc.why).toContain(LEVER_TABLE[f.lever].script);
      }
      expect(mc.why.length).toBeGreaterThan(0);
    }
  });

  it('mcFor dispatches pairing items to pairingMcFor; deterministic; no first-tell', () => {
    for (const item of PAIR_ITEMS) {
      expect(mcFor(item)).toEqual(pairingMcFor(item));
      expect(pairingMcFor(item)).toEqual(pairingMcFor(item));
    }
    const positions = new Set(PAIR_ITEMS.map((i) => pairingMcFor(i).answerIndex));
    expect(positions.size).toBeGreaterThan(1);
  });

  it('rejects non-pairing items', () => {
    const dish = itemsForUnit('snacks')[0];
    expect(() => pairingMcFor(dish)).toThrow(/pairing/);
  });
});

describe('cuedFor / freeFor: pairing recall shapes', () => {
  it('cued asks the pour + the lever, with a hint', () => {
    for (const item of PAIR_ITEMS) {
      const f = foodById.get(item.foodId!)!;
      const cued = cuedFor(item);
      expect(cued.prompt).toContain(f.name);
      expect(cued.answer).toContain(f.wine!);
      if (f.lever) expect(cued.answer).toContain(LEVER_TABLE[f.lever].label);
      expect(cued.hint.length).toBeGreaterThan(0);
    }
  });

  it('free calls the pour + why cold, with the non-drinker cocktail as detail', () => {
    for (const item of PAIR_ITEMS) {
      const f = foodById.get(item.foodId!)!;
      const free = freeFor(item);
      expect(free.prompt).toContain(f.name);
      expect(free.answer).toContain(f.wine!);
      if (f.cocktail) expect(free.detail).toContain(f.cocktail);
    }
  });
});

describe('teachFor: the pairing teach surface', () => {
  it('returns the dish → pour + lever + why + cocktail call', () => {
    for (const item of PAIR_ITEMS) {
      const f = foodById.get(item.foodId!)!;
      const teach = teachFor(item) as PairingTeach;
      expect(teach.kind).toBe('pairing');
      expect(teach.name).toBe(f.name);
      expect(teach.wine).toBe(f.wine);
      expect(teach.why).toBe(f.why ?? '');
      if (f.lever) {
        expect(teach.leverLabel).toBe(LEVER_TABLE[f.lever].label);
        expect(teach.leverScript).toBe(LEVER_TABLE[f.lever].script);
      }
      if (f.cocktail) expect(teach.cocktail).toBe(f.cocktail);
    }
  });
});
