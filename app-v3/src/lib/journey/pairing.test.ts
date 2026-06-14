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

describe('pairingMcFor: native dish→pour MC (one true pour, distractors varied by round)', () => {
  const allPours = [...new Set(data.foods.map((f) => f.wine).filter((w): w is string => !!w))];

  it.each(PAIR_ITEMS.map((i) => [i.foodId!, i] as const))(
    '%s — answer is THIS dish\'s pour; the distractors are OTHER pours, never this one',
    (foodId, item) => {
      const card = pairCardOf.get(foodId)!;
      const others = new Set(allPours.filter((p) => p !== card.answer));
      for (let r = 0; r < 3; r++) {
        const mc = pairingMcFor(item, r);
        expect(mc.prompt).toBe(card.prompt);
        expect(mc.choices.length).toBeGreaterThanOrEqual(2);
        expect(mc.choices.length).toBeLessThanOrEqual(5);
        expect(new Set(mc.choices).size).toBe(mc.choices.length); // distinct
        expect(mc.choices[mc.answerIndex]).toBe(card.answer); // the dish's by-the-glass pour
        mc.choices.forEach((c, i) => {
          if (i !== mc.answerIndex) expect(others.has(c), `${foodId} r${r} distractor "${c}"`).toBe(true);
        });
      }
    }
  );

  it('offers 5 options (more than before)', () => {
    expect(pairingMcFor(PAIR_ITEMS[0], 0).choices.length).toBe(5);
  });

  it('a different round keeps the one right pour but shows different wrong pours', () => {
    const item = PAIR_ITEMS[0];
    const wrongs = (r: number) => {
      const m = pairingMcFor(item, r);
      return m.choices.filter((_, i) => i !== m.answerIndex).slice().sort().join('|');
    };
    const ans = (r: number) => {
      const m = pairingMcFor(item, r);
      return m.choices[m.answerIndex];
    };
    expect(ans(0)).toBe(ans(1)); // one true pour — can't rotate
    expect(wrongs(0)).not.toBe(wrongs(1)); // distractors do
  });

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

  it('mcFor dispatches pairing items to pairingMcFor; deterministic per (item,round); no first-tell', () => {
    for (const item of PAIR_ITEMS) {
      expect(mcFor(item)).toEqual(pairingMcFor(item)); // round 0
      expect(pairingMcFor(item, 2)).toEqual(pairingMcFor(item, 2));
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
