// Stage 4 — wine:* accessor validity over the REAL wine data. Mirrors
// build.test.ts: reuse-the-frozen-engine-card (wineMcFor ↔ wine-identity:<id>:grape),
// determinism, no answer-first tell, and the cued/free/teach recall shapes.
import { describe, expect, it } from 'vitest';
import { data, type Card } from '$lib/data';
import { generateDeck } from '$lib/engine/training.js';
import { UNIT_WINE_IDS } from './stages';
import { cuedFor, freeFor, itemsForUnit, mcFor, teachFor, wineMcFor } from './items';
import type { WineTeach } from './items';
import type { JourneyItem } from './types';

const WINE_MODULES = ['wine-bubbles', 'wine-bright', 'wine-round', 'wine-light', 'wine-structured'] as const;
const WINE_ITEMS: JourneyItem[] = WINE_MODULES.flatMap((u) => [...itemsForUnit(u)]);
const wineById = new Map(data.wines.map((w) => [w.id, w]));

const identityDeck = generateDeck('wine-identity', data) as Card[];
const grapeCardOf = new Map(identityDeck.filter((c) => c.id.endsWith(':grape')).map((c) => [c.sourceId!, c]));

describe('itemsForUnit: wine modules', () => {
  it('mints wine:<wineId> items in roster order, keyed to data.wines', () => {
    for (const u of WINE_MODULES) {
      const items = itemsForUnit(u);
      expect(items.map((i) => i.id)).toEqual(UNIT_WINE_IDS[u].map((id) => `wine:${id}`));
      for (const item of items) {
        expect(item.kind).toBe('wine');
        expect(item.unitId).toBe(u);
        expect(item.foodId).toBeUndefined();
        expect(wineById.has(item.wineId!), item.id).toBe(true);
      }
    }
  });

  it('checkpoint-wine is the union of the five wine modules', () => {
    const lessons = WINE_MODULES.flatMap((u) => [...itemsForUnit(u)]);
    expect(itemsForUnit('checkpoint-wine')).toEqual(lessons);
  });

  it('covers all 17 wine items, unique', () => {
    expect(WINE_ITEMS.length).toBe(17);
    expect(new Set(WINE_ITEMS.map((i) => i.id)).size).toBe(17);
  });
});

describe('wineMcFor: reuses the frozen wine-identity card', () => {
  it.each(WINE_ITEMS.map((i) => [i.wineId!, i] as const))(
    '%s — MC matches wine-identity:<id>:grape',
    (wineId, item) => {
      const card = grapeCardOf.get(wineId)!;
      expect(card, wineId).toBeDefined();
      const mc = wineMcFor(item);
      expect(mc.prompt).toBe(card.prompt);
      expect([...mc.choices].sort()).toEqual([...card.choices!].sort());
      expect(mc.choices[mc.answerIndex]).toBe(card.answer);
      expect(new Set(mc.choices).size).toBe(4);
    }
  );

  it('the reveal teaches the ten-second story', () => {
    for (const item of WINE_ITEMS) {
      const w = wineById.get(item.wineId!)!;
      expect(wineMcFor(item).why).toBe(w.tenSecond || w.profile || '');
      expect(wineMcFor(item).why.length).toBeGreaterThan(0);
    }
  });

  it('mcFor dispatches wine items to wineMcFor (the grading source of truth)', () => {
    for (const item of WINE_ITEMS) expect(mcFor(item)).toEqual(wineMcFor(item));
  });

  it('is deterministic and does not place the answer first on every card', () => {
    for (const item of WINE_ITEMS) expect(wineMcFor(item)).toEqual(wineMcFor(item));
    const positions = new Set(WINE_ITEMS.map((i) => wineMcFor(i).answerIndex));
    expect(positions.size).toBeGreaterThan(1);
  });

  it('rejects non-wine items', () => {
    const dish = itemsForUnit('snacks')[0];
    expect(() => wineMcFor(dish)).toThrow(/wine/);
  });
});

describe('cuedFor / freeFor: wine recall shapes', () => {
  it('cued asks grape + place + one-line read, hinting EVERY grape initial', () => {
    for (const item of WINE_ITEMS) {
      const w = wineById.get(item.wineId!)!;
      const cued = cuedFor(item);
      expect(cued.prompt).toBe(`The ${w.name}: grape, place, and the one-line read.`);
      expect(cued.answer).toContain(w.grape);
      expect(cued.answer).toContain(w.tenSecond);
      // every grape word's initial is in the hint (blends must not show one tell)
      for (const g of w.grape.split(/[^\p{L}]+/u).filter(Boolean)) {
        expect(cued.hint, `${item.id} hint missing ${g[0]}`).toContain(g[0].toUpperCase());
      }
      expect(cued.confirmLine).toBeUndefined(); // wine carries no allergen confirm
    }
  });

  it('free is the FULL identity cold — grape, region AND the pitch (never easier than cued)', () => {
    for (const item of WINE_ITEMS) {
      const w = wineById.get(item.wineId!)!;
      const free = freeFor(item);
      expect(free.prompt).toBe(`Cold — the ${w.name}: grape, region, and the ten-second pitch.`);
      expect(free.answer).toBe(`${w.grape} — ${w.region}. ${w.tenSecond}`);
      // the cold rung asks for at least as much as the cued rung
      expect(free.answer).toContain(w.grape);
      expect(free.answer).toContain(w.region);
      expect(free.answer).toContain(w.tenSecond);
      if (w.say) expect(free.detail).toBe(w.say);
    }
  });
});

describe('wine data shape the teach card depends on', () => {
  it('every glass pour price is a 3-part 5oz|8oz|bottle ladder', () => {
    for (const w of data.wines) {
      expect(w.price.split('|').length, w.id).toBe(3);
    }
  });
});

describe('teachFor: the wine teach surface', () => {
  it('returns a wine teach with identity, structure, pronunciation and pairings', () => {
    for (const item of WINE_ITEMS) {
      const w = wineById.get(item.wineId!)!;
      const teach = teachFor(item) as WineTeach;
      expect(teach.kind).toBe('wine');
      expect(teach.name).toBe(w.name);
      expect(teach.grape).toBe(w.grape);
      expect(teach.region).toBe(w.region);
      expect(teach.family).toBe(w.family);
      expect(teach.structure.acidity).toBe(w.structure.acidity);
      expect(teach.structure.sweetness).toBe(w.structure.sweetness);
      expect(teach.respell).toBe(w.pronunciation.respell);
      expect(teach.audioId).toBe(w.id);
      expect(teach.tenSecond).toBe(w.tenSecond);
      expect(teach.pair).toEqual(w.pair ?? []);
    }
  });
});
