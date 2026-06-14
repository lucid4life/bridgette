// Stage 3 — build:* accessor validity over the REAL cocktail data. Mirrors
// items.test.ts: the dish components MC is minted natively (rotate the asked
// build component by round, never a name-leak, fresh distractors, 5 options),
// determinism per (item, round), no answer-first tell, and the cued/free/teach
// recall shapes.
import { describe, expect, it } from 'vitest';
import { data } from '$lib/data';
import { UNIT_BUILD_IDS } from './stages';
import {
  BAR_CONFIRM,
  buildMcFor,
  cuedFor,
  freeFor,
  hasBuildDeck,
  itemsForUnit,
  mcFor,
  normKey,
  normWords,
  teachFor
} from './items';
import type { BuildTeach } from './items';
import type { JourneyItem } from './types';

const BAR_MODULES = ['bar-bright', 'bar-floral', 'bar-spirit', 'bar-zero'] as const;
const BUILD_ITEMS: JourneyItem[] = BAR_MODULES.flatMap((u) => [...itemsForUnit(u)]);
const cocktailById = new Map(data.cocktails.map((c) => [c.id, c]));

describe('itemsForUnit: bar modules', () => {
  it('mints build:<cocktailId> items in roster order, keyed to data.cocktails', () => {
    for (const u of BAR_MODULES) {
      const items = itemsForUnit(u);
      expect(items.map((i) => i.id)).toEqual(UNIT_BUILD_IDS[u].map((id) => `build:${id}`));
      for (const item of items) {
        expect(item.kind).toBe('build');
        expect(item.unitId).toBe(u);
        expect(item.foodId).toBeUndefined();
        expect(cocktailById.has(item.cocktailId!), item.id).toBe(true);
      }
    }
  });

  it('bar-arc mints authored service items (no build rows)', () => {
    const arc = itemsForUnit('bar-arc');
    expect(arc.length).toBeGreaterThan(0);
    for (const item of arc) {
      expect(item.kind).toBe('service');
      expect(item.id.startsWith('service:bar-')).toBe(true);
    }
  });

  it('checkpoint-bar is the union of the five bar lesson units', () => {
    const lessons = ['bar-arc', ...BAR_MODULES].flatMap((u) => [...itemsForUnit(u)]);
    expect(itemsForUnit('checkpoint-bar')).toEqual(lessons);
  });

  it('covers all 13 build items, unique', () => {
    expect(BUILD_ITEMS.length).toBe(13);
    expect(new Set(BUILD_ITEMS.map((i) => i.id)).size).toBe(13);
  });
});

describe('buildMcFor: native build MC (variety)', () => {
  it.each(BUILD_ITEMS.map((i) => [i.cocktailId!, i] as const))(
    '%s — 5 distinct options; answer is a real build item; distractors are NOT in the build',
    (cocktailId, item) => {
      const c = cocktailById.get(cocktailId)!;
      const buildKeys = new Set(c.build!.map(normKey));
      const nameWords = new Set(normWords(c.name));
      for (let r = 0; r < 4; r++) {
        const mc = buildMcFor(item, r);
        expect(mc.prompt).toBe(`Which of these is IN the ${c.name}?`);
        expect(mc.choices).toHaveLength(5);
        expect(new Set(mc.choices.map(normKey)).size).toBe(5);
        const answer = mc.choices[mc.answerIndex];
        expect(buildKeys.has(normKey(answer)), `${cocktailId} r${r} answer "${answer}"`).toBe(true);
        // the answer never shares a word with the drink name (White Peach Negroni
        // never asks "Peach Liqueur") — unless the whole build name-leaks
        if (c.build!.some((b) => !normWords(b).some((w) => nameWords.has(w))))
          expect(normWords(answer).some((w) => nameWords.has(w)), `${cocktailId} r${r}`).toBe(false);
        mc.choices.forEach((choice, i) => {
          if (i !== mc.answerIndex)
            expect(buildKeys.has(normKey(choice)), `${cocktailId} r${r} distractor "${choice}"`).toBe(false);
        });
      }
    }
  );

  it('rotates the asked build item across rounds (a multi-item build)', () => {
    const item = BUILD_ITEMS.find((i) => cocktailById.get(i.cocktailId!)!.build!.length >= 3)!;
    const asked = new Set([0, 1, 2].map((r) => normKey(buildMcFor(item, r).choices[buildMcFor(item, r).answerIndex])));
    expect(asked.size).toBeGreaterThan(1);
  });

  it('a different round shows a different question', () => {
    const item = BUILD_ITEMS.find((i) => cocktailById.get(i.cocktailId!)!.build!.length >= 3)!;
    const sig = (m: { choices: string[]; answerIndex: number }) =>
      `${normKey(m.choices[m.answerIndex])}|${[...m.choices].map(normKey).sort().join(',')}`;
    expect(sig(buildMcFor(item, 0))).not.toBe(sig(buildMcFor(item, 1)));
  });

  it('the reveal teaches the full official build, and flags the drink when relevant', () => {
    for (const item of BUILD_ITEMS) {
      const c = cocktailById.get(item.cocktailId!)!;
      const mc = buildMcFor(item);
      expect(mc.why.startsWith(`Official build: ${c.build!.join(', ')}.`)).toBe(true);
      if ((c.allergens ?? []).length > 0) {
        expect(mc.why).toContain(`Contains ${c.allergens!.join(', ')}.`);
      }
      // every drink reveal carries the bar-confirm safety line
      expect(mc.confirmLine).toBe(BAR_CONFIRM);
      expect(mc.confirmLine).toContain('the bar');
    }
  });

  it('mcFor dispatches build items to buildMcFor (the grading source of truth)', () => {
    for (const item of BUILD_ITEMS) {
      expect(mcFor(item)).toEqual(buildMcFor(item));
    }
  });

  it('is deterministic per (item, round)', () => {
    for (const item of BUILD_ITEMS) {
      expect(buildMcFor(item)).toEqual(buildMcFor(item)); // round 0
      expect(buildMcFor(item, 2)).toEqual(buildMcFor(item, 2));
    }
  });

  it('does not place the answer first on every card (no positional tell)', () => {
    const positions = new Set(BUILD_ITEMS.map((i) => buildMcFor(i).answerIndex));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('hasBuildDeck', () => {
  it('true for every build item on the path', () => {
    for (const item of BUILD_ITEMS) expect(hasBuildDeck(item), item.id).toBe(true);
  });

  it('false for non-build items', () => {
    const service = itemsForUnit('bar-arc')[0];
    expect(hasBuildDeck(service)).toBe(false);
  });

  it('the build-less cocktails are not on any module (excluded upstream)', () => {
    const ids = BUILD_ITEMS.map((i) => i.cocktailId);
    expect(ids).not.toContain('spicy-sandia');
    expect(ids).not.toContain('lovers-mountain');
  });
});

describe('cuedFor / freeFor: build recall shapes', () => {
  it('cued names the build with a part-count + first-letter hint', () => {
    for (const item of BUILD_ITEMS) {
      const c = cocktailById.get(item.cocktailId!)!;
      const cued = cuedFor(item);
      expect(cued.prompt).toBe(`Name the build of the ${c.name}.`);
      expect(cued.answer).toBe(c.build!.join(', '));
      expect(cued.hint).toContain(`${c.build!.length} part`);
      expect(cued.confirmLine).toBe(BAR_CONFIRM);
      if ((c.allergens ?? []).length > 0) expect(cued.allergens).toEqual(c.allergens);
    }
  });

  it('free is cold build-from-memory with the description as the detail', () => {
    for (const item of BUILD_ITEMS) {
      const c = cocktailById.get(item.cocktailId!)!;
      const free = freeFor(item);
      expect(free.prompt).toBe(`Build the ${c.name} from memory.`);
      expect(free.answer).toBe(c.build!.join(', '));
      if (c.description) expect(free.detail).toBe(c.description);
      expect(free.confirmLine).toBe(BAR_CONFIRM);
    }
  });
});

describe('teachFor: the cocktail teach surface', () => {
  it('returns a build teach with the official build, flavour, pairing and safety line', () => {
    for (const item of BUILD_ITEMS) {
      const c = cocktailById.get(item.cocktailId!)!;
      const teach = teachFor(item) as BuildTeach;
      expect(teach.kind).toBe('build');
      expect(teach.name).toBe(c.name);
      expect(teach.price).toBe(c.price);
      expect(teach.category).toBe(c.category);
      expect(teach.build).toEqual(c.build);
      expect(teach.pair).toBe(c.pair);
      expect(teach.say).toBe(c.say);
      expect(teach.allergens).toEqual(c.allergens ?? []);
      expect(teach.confirmLine).toBe(BAR_CONFIRM);
    }
  });
});
