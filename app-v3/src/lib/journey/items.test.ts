// Task D — item derivation + content accessors (dish:* / service:* items).
// Dish MC content is MINTED NATIVELY (componentsMcFor + key-components.ts) —
// rotating the asked distinctive component by round, never a base/given like
// "Pizza Dough"; teach/cued/free derive only from official data.foods fields.
import { describe, expect, it } from 'vitest';
import { data, type Card, type Food } from '$lib/data';
import { generateDeck } from '$lib/engine/training.js';
import { CHECKPOINT_UNIT_ID, UNIT_FOOD_IDS, stageById } from './stages';
import { KEY_COMPONENTS } from './key-components';
import { SERVICE_ITEMS } from './service-items';
import {
  allStage1Items,
  allergenMcFor,
  cuedFor,
  distinctivePool,
  freeFor,
  hasAllergenMc,
  itemsForUnit,
  mcFor,
  normKey,
  normWords,
  reverseMcFor,
  romanceFor,
  teachFor
} from './items';
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

describe('mcFor: native dish components MC (variety + no base/given)', () => {
  const ALL_FOOD_IDS = Object.values(UNIT_FOOD_IDS).flat();
  const PIZZAS_WITH_DOUGH = ['margherita', 'chicken-sausage', 'five-cheese'];

  it('NEVER quizzes "Pizza Dough" — not as the answer, not even as a distractor (the bug)', () => {
    for (const id of PIZZAS_WITH_DOUGH) {
      for (let r = 0; r < 6; r++) {
        const mc = mcFor(dishItem(id), r);
        for (const c of mc.choices) expect(normKey(c), `${id} r${r}`).not.toBe(normKey('Pizza Dough'));
      }
    }
  });

  it.each(ALL_FOOD_IDS)('%s: 5 distinct options; answer is a real component; the 4 distractors are NOT in the dish', (foodId) => {
    const ingKeys = new Set(food(foodId).ingredients!.map(normKey));
    for (let r = 0; r < 4; r++) {
      const mc = mcFor(dishItem(foodId), r);
      expect(mc.prompt).toBe(`Which of these is IN the ${food(foodId).name}?`);
      expect(mc.choices).toHaveLength(5); // 1 answer + 4 distractors (more options)
      expect(new Set(mc.choices.map(normKey)).size).toBe(5); // all distinct
      const answer = mc.choices[mc.answerIndex];
      expect(ingKeys.has(normKey(answer)), `${foodId} r${r} answer "${answer}"`).toBe(true);
      mc.choices.forEach((c, i) => {
        if (i !== mc.answerIndex)
          expect(ingKeys.has(normKey(c)), `${foodId} r${r} distractor "${c}"`).toBe(false);
      });
    }
  });

  it('the answer is always one of the dish\'s authored distinctive components', () => {
    for (const foodId of ALL_FOOD_IDS) {
      const allowed = new Set((KEY_COMPONENTS[foodId] ?? []).map(normKey)); // pool ⊆ authored
      for (let r = 0; r < 4; r++) {
        const mc = mcFor(dishItem(foodId), r);
        expect(allowed.has(normKey(mc.choices[mc.answerIndex])), `${foodId} r${r}`).toBe(true);
      }
    }
  });

  it('rotates the asked component across rounds (a multi-distinctive dish)', () => {
    const asked = new Set<string>();
    for (let r = 0; r < 3; r++) {
      const mc = mcFor(dishItem('five-cheese'), r); // Oka / Fontina / Fior di Latte
      asked.add(normKey(mc.choices[mc.answerIndex]));
    }
    expect(asked.size).toBeGreaterThan(1); // not the same question every round
  });

  it('a different round shows a different question', () => {
    const sig = (m: { choices: string[]; answerIndex: number }) =>
      `${normKey(m.choices[m.answerIndex])}|${[...m.choices].map(normKey).sort().join(',')}`;
    expect(sig(mcFor(dishItem('margherita'), 0))).not.toBe(sig(mcFor(dishItem('margherita'), 1)));
  });

  it('a single-distinctive dish keeps its answer but varies the distractors by round', () => {
    const a0 = mcFor(dishItem('french-fries'), 0); // only "Garlic Aioli" is distinctive
    const a1 = mcFor(dishItem('french-fries'), 1);
    expect(normKey(a0.choices[a0.answerIndex])).toBe(normKey('Garlic Aioli'));
    expect(normKey(a1.choices[a1.answerIndex])).toBe(normKey('Garlic Aioli'));
    const distractors = (m: { choices: string[]; answerIndex: number }) =>
      m.choices.filter((_, i) => i !== m.answerIndex).map(normKey).sort().join(',');
    expect(distractors(a0)).not.toBe(distractors(a1));
  });

  it('is deterministic per (item, round)', () => {
    expect(mcFor(dishItem('tuna-crudo'), 2)).toEqual(mcFor(dishItem('tuna-crudo'), 2));
  });

  it('answer position varies across dishes (no always-first tell)', () => {
    const positions = new Set(ALL_FOOD_IDS.map((id) => mcFor(dishItem(id), 0).answerIndex));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('distinctivePool: the never-quiz-a-given invariant holds under drift (review §)', () => {
  // A synthetic, un-audited dish (NOT in KEY_COMPONENTS) forces the algorithmic
  // fallback. The fix: relax the name-leak rule before the given rule, so a base/
  // given is the answer ONLY when the dish is 100% givens.
  const fake = (name: string, ingredients: string[]): Food =>
    ({ id: 'zzz-not-on-path', name, ingredients } as Food);

  it('prefers a name-leaking NON-given over a base/given (the surviving finding)', () => {
    // every non-given ingredient name-leaks ("Cheddar Dough" shares "Dough");
    // the only non-leaks are givens. Old code returned the givens — now it must not.
    const pool = distinctivePool(fake('Dough', ['Pizza Dough', 'Crust', 'Cheddar Dough']));
    expect(pool).toContain('Cheddar Dough');
    expect(pool).not.toContain('Pizza Dough');
    expect(pool).not.toContain('Crust');
  });

  it('returns the givens ONLY when the dish has no non-given ingredient at all', () => {
    const pool = distinctivePool(fake('Plain', ['Pizza Dough', 'Crust']));
    expect(pool.length).toBeGreaterThan(0); // never empty (componentsMcFor must not crash)
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

  it('service: authored prompt/hint/answer pass through — NO allergen framing', () => {
    const s = SERVICE_ITEMS[0];
    const item = itemsForUnit('day-one')[0];
    expect(cuedFor(item)).toEqual({ prompt: s.prompt, hint: s.hint, answer: s.answer });
  });

  it('dish: carries allergen framing (chips + the non-negotiable confirm line)', () => {
    for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
      const cued = cuedFor(dishItem(foodId));
      const f = food(foodId);
      expect(cued.allergens, foodId).toEqual(f.allergens ?? []);
      expect(cued.allergenNote, foodId).toBe(f.allergenNote);
      expect(cued.confirmLine, foodId).toBe(data.confirm.allergens);
    }
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

  it('service: authored prompt/answer, no detail, NO allergen framing', () => {
    const s = SERVICE_ITEMS[3];
    const item = itemsForUnit('day-one')[3];
    const free = freeFor(item);
    expect(free.prompt).toBe(s.prompt);
    expect(free.answer).toBe(s.answer);
    expect(free.detail).toBeUndefined();
    expect(free.allergens).toBeUndefined();
    expect(free.confirmLine).toBeUndefined();
  });

  it('dish: carries allergen framing (chips + the non-negotiable confirm line)', () => {
    for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
      const free = freeFor(dishItem(foodId));
      const f = food(foodId);
      expect(free.allergens, foodId).toEqual(f.allergens ?? []);
      expect(free.allergenNote, foodId).toBe(f.allergenNote);
      expect(free.confirmLine, foodId).toBe(data.confirm.allergens);
    }
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

describe('romanceFor', () => {
  it('dish: official name/category/price, first-3 targets, description model line, full ingredients', () => {
    const f = food('tuna-crudo');
    const r = romanceFor(dishItem('tuna-crudo'));
    expect(r.name).toBe(f.name);
    expect(r.category).toBe(f.category);
    expect(r.price).toBe(f.price);
    expect(r.romanceTargets).toEqual(f.ingredients!.slice(0, 3)); // the Playbook bold-first-3 rule
    expect(r.modelLine).toBe(f.description);
    expect(r.ingredients).toEqual(f.ingredients);
    expect(r.photoId).toBe('tuna-crudo'); // the plate anchors the reveal (§0b dual-coding)
  });

  it('dish: photoId is the food id on every path dish — same id the teach card gates on', () => {
    for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
      const r = romanceFor(dishItem(foodId));
      expect(r.photoId, foodId).toBe(foodId);
      const teach = teachFor(dishItem(foodId));
      // one id, one gate: the romance reveal and the teach card show the SAME plate.
      expect(teach.kind === 'dish' && teach.photoId, foodId).toBe(r.photoId);
    }
  });

  it('every path dish romances: ≤3 targets (all of them on short dishes), a non-empty model line', () => {
    for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
      const f = food(foodId);
      const r = romanceFor(dishItem(foodId));
      expect(r.romanceTargets, foodId).toEqual(f.ingredients!.slice(0, 3));
      expect(r.romanceTargets.length, foodId).toBe(Math.min(3, f.ingredients!.length));
      expect(r.modelLine.length, foodId).toBeGreaterThan(0);
    }
  });

  it('a 2-component dish (Cashews) targets both components', () => {
    const r = romanceFor(dishItem('cashews'));
    expect(r.romanceTargets).toEqual(food('cashews').ingredients);
    expect(r.romanceTargets.length).toBe(2);
  });

  it('every path dish carries a memory hook, surfaced verbatim on romance + teach', () => {
    for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
      const f = food(foodId);
      expect(f.memoryHook, foodId).toBeTruthy();
      expect(typeof f.memoryHook, foodId).toBe('string');
      expect(romanceFor(dishItem(foodId)).memoryHook, foodId).toBe(f.memoryHook);
      const teach = teachFor(dishItem(foodId));
      expect(teach.kind === 'dish' && teach.memoryHook, foodId).toBe(f.memoryHook);
    }
  });

  it('dish: carries allergen framing (chips + the non-negotiable confirm line)', () => {
    for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
      const r = romanceFor(dishItem(foodId));
      const f = food(foodId);
      expect(r.allergens, foodId).toEqual(f.allergens ?? []);
      expect(r.allergenNote, foodId).toBe(f.allergenNote);
      expect(r.confirmLine, foodId).toBe(data.confirm.allergens);
    }
  });

  it('throws on service items — there is no plate to romance', () => {
    expect(() => romanceFor(itemsForUnit('day-one')[0])).toThrow(/dish/);
  });
});

// ---------------------------------------------------------------------------
// Test-Prep accessors (allergen MC reuses the frozen v2 allergens card;
// reverse MC is NEW minted runtime content — no frozen ids involved).
// ---------------------------------------------------------------------------

const PATH_FOOD_IDS = Object.values(UNIT_FOOD_IDS).flat();
// The frozen v2 sentence every food allergens card's why ends with (training.js
// KITCHEN_CONFIRM) — asserted here so a deck-shape drift fails loudly.
const ENGINE_KITCHEN_CONFIRM =
  'Always confirm allergens with the kitchen before promising a guest.';

describe('hasAllergenMc / allergenMcFor: the frozen allergens card, reused', () => {
  const deck = (generateDeck('allergens', data) as Card[]).filter((c) => c.sourceKind === 'food');

  it('the engine deck shape holds: 41 food cards, every why ends with the kitchen confirm', () => {
    expect(deck.length).toBe(41);
    for (const c of deck) {
      expect(c.why!, c.id).toMatch(/^Allergen flags: /);
      expect(c.why!.endsWith(ENGINE_KITCHEN_CONFIRM), c.id).toBe(true);
    }
  });

  it('every path dish has an allergens card today (the only flagless food is off-path)', () => {
    for (const foodId of PATH_FOOD_IDS) {
      expect(hasAllergenMc(dishItem(foodId)), foodId).toBe(true);
    }
  });

  it('hasAllergenMc is false for service items; allergenMcFor throws on them', () => {
    const svc = itemsForUnit('day-one')[0];
    expect(hasAllergenMc(svc)).toBe(false);
    expect(() => allergenMcFor(svc)).toThrow(/dish/);
  });

  it.each(PATH_FOOD_IDS)('%s reuses the engine card content', (foodId) => {
    const card = deck.find((c) => c.sourceId === foodId)!;
    const mc = allergenMcFor(dishItem(foodId));
    expect(mc.prompt).toBe(card.prompt);
    expect([...mc.choices].sort()).toEqual([...card.choices!].sort());
    expect(mc.choices[mc.answerIndex]).toBe(card.answer);
    // why = the card's flags + note VERBATIM; only the frozen v2 confirm tail is
    // lifted off (replaced by the app-wide confirmLine) — reconstruction proves
    // no content was lost or rewritten.
    expect(`${mc.why} ${ENGINE_KITCHEN_CONFIRM}`).toBe(card.why);
    expect(mc.why).toMatch(/^Allergen flags: /);
    for (const flag of food(foodId).allergens!) expect(mc.why, foodId).toContain(flag);
    // safety framing is non-negotiable — the ONE standard line, same as every
    // other allergen surface in v3
    expect(mc.confirmLine).toBe(data.confirm.allergens);
  });

  it('is deterministic per item (same choice order on every call)', () => {
    const a = allergenMcFor(dishItem('french-fries'));
    const b = allergenMcFor(dishItem('french-fries'));
    expect(a).toEqual(b);
  });

  it('answer position varies across items (no always-first tell)', () => {
    const positions = new Set(PATH_FOOD_IDS.map((id) => allergenMcFor(dishItem(id)).answerIndex));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('reverseMcFor: which dish carries the component', () => {
  const dishes = PATH_FOOD_IDS.map((id) => food(id));
  const byName = new Map(dishes.map((f) => [f.name, f]));
  // ingredient → how many path dishes carry it (normalized: lowercase words,
  // trailing-'s' folded — 'Chive' and 'Chives' are ONE token)
  const freq = new Map<string, number>();
  for (const f of dishes)
    for (const ing of f.ingredients!) {
      const k = normKey(ing);
      freq.set(k, (freq.get(k) ?? 0) + 1);
    }
  const GENERIC = new Set(['salt', 'sea salt', 'flaky salt', 'olive oil', 'extra virgin olive oil', 'evoo']);
  const wordOverlap = (a: string, b: string) => {
    const aw = new Set(normWords(a));
    return normWords(b).some((w) => aw.has(w));
  };

  it.each(PATH_FOOD_IDS)('%s yields a valid reverse MC', (foodId) => {
    const f = food(foodId);
    const mc = reverseMcFor(dishItem(foodId));
    // the prompt asks for the component; the answer is the dish name
    expect(mc.prompt).toBe(`Which dish comes with ${mc.component}?`);
    expect(mc.choices).toHaveLength(4);
    expect(new Set(mc.choices).size).toBe(4);
    expect(mc.choices[mc.answerIndex]).toBe(f.name);
    // no name leak: the component never shares a word with the answer dish's
    // own name (the documented all-share fallback exists but is UNUSED on
    // today's path data — this asserts exactly that)
    expect(
      wordOverlap(f.name, mc.component),
      `${foodId}: component '${mc.component}' leaks a word of '${f.name}'`
    ).toBe(false);
    // the component genuinely belongs to the answer dish…
    const key = normKey(mc.component);
    expect(f.ingredients!.some((i) => normKey(i) === key)).toBe(true);
    // …and to NONE of the distractors — by ingredient OR by name
    for (const choice of mc.choices) {
      if (choice === f.name) continue;
      const d = byName.get(choice)!;
      expect(d, `${foodId}: distractor '${choice}' is not a path dish`).toBeDefined();
      expect(
        d.ingredients!.some((i) => normKey(i) === key),
        `${foodId}: distractor '${choice}' also carries '${mc.component}'`
      ).toBe(false);
      expect(
        wordOverlap(choice, mc.component),
        `${foodId}: distractor '${choice}' is NAMED by a word of '${mc.component}'`
      ).toBe(false);
    }
  });

  it('picks the most DISTINCTIVE component: rarest across the other 40 dishes, first-in-list on ties, generics and name-leaks skipped', () => {
    for (const foodId of PATH_FOOD_IDS) {
      const f = food(foodId);
      const mc = reverseMcFor(dishItem(foodId));
      const candidates = f.ingredients!.filter(
        (i) => !GENERIC.has(i.toLowerCase()) && !wordOverlap(f.name, i)
      );
      expect(candidates.length, foodId).toBeGreaterThan(0); // fallback unused on real data
      expect(GENERIC.has(mc.component.toLowerCase()), foodId).toBe(false);
      const min = Math.min(...candidates.map((i) => freq.get(normKey(i))!));
      expect(freq.get(normKey(mc.component)), foodId).toBe(min);
      // deterministic tie-break: the FIRST list entry at that rarity wins
      expect(mc.component).toBe(candidates.find((i) => freq.get(normKey(i)) === min));
    }
  });

  it('prefers same-category distractors (look-alike discrimination), padded cross-category', () => {
    for (const foodId of PATH_FOOD_IDS) {
      const f = food(foodId);
      const mc = reverseMcFor(dishItem(foodId));
      const key = normKey(mc.component);
      const eligibleSameCat = dishes.filter(
        (d) =>
          d.id !== f.id &&
          d.category === f.category &&
          !d.ingredients!.some((i) => normKey(i) === key) &&
          !wordOverlap(d.name, mc.component)
      );
      const got = mc.choices.filter((c) => c !== f.name && byName.get(c)!.category === f.category);
      expect(got.length, foodId).toBe(Math.min(3, eligibleSameCat.length));
    }
  });

  // The two findings that motivated the name rules, pinned by name so a data
  // edit that re-introduces either fails loudly.
  it('Shrimp & Crab (component "Linguini", June-syllabus shape fix) never name-leaks a dish into the choices', () => {
    // 2026-06-12: ingredients[0] corrected "Bigoli" → "Linguini" per the dish's
    // own description + printed-menu line (the syllabus ingredients line carried
    // the error; "Bigoli" is a separate dish). The dish Bigoli is now a FAIR
    // distractor (no name collision), so the original pin moved to the rule
    // itself: no choice may be named by a word of the dealt component.
    const mc = reverseMcFor(dishItem('shrimp-crab'));
    expect(mc.component).toBe('Linguini'); // still the rarest tell, first-in-list
    for (const choice of mc.choices) expect(wordOverlap(choice, mc.component)).toBe(false);
  });

  it('Hummus Chips never asks about its own name ("Hummus Chips" is its first ingredient)', () => {
    const mc = reverseMcFor(dishItem('hummus-chips'));
    expect(mc.component).not.toBe('Hummus Chips');
    expect(wordOverlap(food('hummus-chips').name, mc.component)).toBe(false);
  });

  it('is deterministic per item (same choice order on every call)', () => {
    const a = reverseMcFor(dishItem('rigatoni'));
    const b = reverseMcFor(dishItem('rigatoni'));
    expect(a).toEqual(b);
  });

  it('throws on service items', () => {
    expect(() => reverseMcFor(itemsForUnit('day-one')[0])).toThrow(/dish/);
  });
});
