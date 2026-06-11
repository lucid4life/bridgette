// Task 2 — two new drill decks over the official menu syllabus (Task 1 data):
// "Dish Components" (components:<foodId>:pick) and "Allergen Flags"
// (allergens:<foodId>:flag). Written TDD-first: these specs define the decks.
// Extension: the allergens deck ALSO mints one card per allergen-flagged
// COCKTAIL (allergens:<cocktailId>:flag) — bar-confirm sentence, know-the-build
// learnLink, distractors from the UNION (food + cocktail) allergen vocabulary.
import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { FLOOR_BASICS, basicsIdSet } from './basics.js';
import { EXAM_BLUEPRINT } from './exam.js';
import { data } from '../data/index';

const KITCHEN_CONFIRM = 'Always confirm allergens with the kitchen before promising a guest.';
const BAR_CONFIRM = 'Always confirm allergens with the bar before promising a guest.';
const lc = (s: any) => String(s).toLowerCase();
const words = (s: any) => lc(s).split(/[^a-z0-9]+/).filter(Boolean);

const foodById = new Map(data.foods.map((f: any) => [f.id, f]));
const cocktailById = new Map(data.cocktails.map((c: any) => [c.id, c]));
const withIngredients = data.foods.filter((f: any) => f.ingredients && f.ingredients.length >= 1);
const withAllergens = data.foods.filter((f: any) => f.allergens && f.allergens.length >= 1);
const cocktailsWithAllergens = data.cocktails.filter((c: any) => c.allergens && c.allergens.length >= 1);

describe('Dish Components deck', () => {
  const cards = T.generateDeck('components', data);

  it('is registered in DECKS with the know-the-dish learnLink', () => {
    expect((T.DECKS as any).components).toBeTruthy();
    expect((T.DECKS as any).components.label).toBe('Dish Components');
    expect((T.DECKS as any).components.learnLink).toBe('know-the-dish');
  });

  it('mints one card per food with official ingredients (derived count, 41 today)', () => {
    expect(withIngredients.length).toBeGreaterThanOrEqual(1);
    expect(cards.length).toBe(withIngredients.length);
  });

  it('every id mints ONLY the new components:<foodId>:pick namespace', () => {
    for (const c of cards) {
      expect(c.id, c.id).toMatch(/^components:[a-z0-9-]+:pick$/);
      expect(c.id).toBe('components:' + c.sourceId + ':pick');
      expect(c.deck).toBe('components');
      expect(c.kind).toBe('recall');
      expect(c.sourceKind).toBe('food');
      expect(c.learnLink).toBe('know-the-dish');
      expect(foodById.get(c.sourceId), 'unknown food: ' + c.sourceId).toBeTruthy();
    }
  });

  it('answer is genuinely IN the dish; NO distractor is; 4 unique choices', () => {
    for (const c of cards) {
      const f: any = foodById.get(c.sourceId);
      const mine = new Set(f.ingredients.map(lc));
      expect(mine.has(lc(c.answer)), c.id + ' answer not in dish: ' + c.answer).toBe(true);
      expect(c.choices.length, c.id).toBe(4);
      expect(new Set(c.choices).size, c.id + ' dup choices').toBe(4);
      expect(c.choices).toContain(c.answer);
      for (const ch of c.choices) {
        if (ch === c.answer) continue;
        expect(mine.has(lc(ch)), c.id + ' distractor IS in the dish: ' + ch).toBe(false);
      }
    }
  });

  it('answer drills the NON-OBVIOUS component: first ingredient sharing no word with the dish name (fallback = first ingredient)', () => {
    for (const c of cards) {
      const f: any = foodById.get(c.sourceId);
      const nameWords = new Set(words(f.name));
      const sharesNone = (ing: string) => !words(ing).some((w) => nameWords.has(w));
      const expected = f.ingredients.find(sharesNone) || f.ingredients[0];
      expect(c.answer, c.id).toBe(expected);
    }
  });

  it('why teaches the full official components list; aliases accept any ingredient; tags carry components + food', () => {
    for (const c of cards) {
      const f: any = foodById.get(c.sourceId);
      expect(c.why, c.id).toContain('Official components: ' + f.ingredients.join(', '));
      expect(c.aliases, c.id).toEqual(f.ingredients);
      expect(c.tags, c.id).toContain('components');
      expect(c.tags, c.id).toContain('food');
    }
  });

  it('is enrolled in the produce-at-higher-boxes mechanism (REASON_DECKS)', () => {
    expect(T.REASON_DECKS.has('components')).toBe(true);
    expect(T.modeForBox({ kind: 'recall', deck: 'components' } as any, 1)).toBe('mc');
    expect(T.modeForBox({ kind: 'recall', deck: 'components' } as any, 2)).toBe('mc');
    expect(T.modeForBox({ kind: 'recall', deck: 'components' } as any, 3)).toBe('produce');
    expect(T.modeForBox({ kind: 'recall', deck: 'components' } as any, 5)).toBe('produce');
  });

  it('produce grading accepts ANY genuine component via gradeTyped', () => {
    const c: any = cards.find((x: any) => x.sourceId === 'tuna-crudo');
    expect(c).toBeTruthy();
    const f: any = foodById.get('tuna-crudo');
    for (const ing of f.ingredients) expect(T.gradeTyped(c, ing), ing).toBe(true);
  });

  it('is deterministic: two generations are byte-identical', () => {
    expect(JSON.stringify(T.generateDeck('components', data)))
      .toBe(JSON.stringify(T.generateDeck('components', data)));
  });
});

describe('Allergen Flags deck', () => {
  const cards = T.generateDeck('allergens', data);
  const foodCards = cards.filter((c: any) => c.sourceKind === 'food');
  const cocktailCards = cards.filter((c: any) => c.sourceKind === 'cocktail');
  // Food-only vocabulary: the 41 frozen food cards draw their foils from HERE only.
  const vocab = new Set<string>();
  data.foods.forEach((f: any) => (f.allergens || []).forEach((a: string) => vocab.add(a)));
  // Union vocabulary (food tokens first, then cocktail-only tokens): the foil pool
  // for the cocktail cards.
  const unionVocab = new Set<string>(vocab);
  data.cocktails.forEach((c: any) => (c.allergens || []).forEach((a: string) => unionVocab.add(a)));

  it('is registered in DECKS with the know-the-dish learnLink', () => {
    expect((T.DECKS as any).allergens).toBeTruthy();
    expect((T.DECKS as any).allergens.label).toBe('Allergen Flags');
    expect((T.DECKS as any).allergens.learnLink).toBe('know-the-dish');
  });

  it('mints one card per food AND one per cocktail with allergen flags (derived counts, 41 + 6 today)', () => {
    expect(withAllergens.length).toBeGreaterThanOrEqual(1);
    expect(cocktailsWithAllergens.length).toBeGreaterThanOrEqual(1);
    expect(foodCards.length).toBe(withAllergens.length);
    expect(cocktailCards.length).toBe(cocktailsWithAllergens.length);
    expect(cards.length).toBe(withAllergens.length + cocktailsWithAllergens.length);
  });

  it('cocktail cards exist for EXACTLY the cocktails carrying flags', () => {
    const minted = cocktailCards.map((c: any) => c.sourceId).sort();
    const flagged = cocktailsWithAllergens.map((c: any) => c.id).sort();
    expect(minted).toEqual(flagged);
  });

  it('every id mints ONLY the allergens:<itemId>:flag namespace; food cards keep know-the-dish, cocktail cards link know-the-build', () => {
    for (const c of cards) {
      expect(c.id, c.id).toMatch(/^allergens:[a-z0-9-]+:flag$/);
      expect(c.id).toBe('allergens:' + c.sourceId + ':flag');
      expect(c.deck).toBe('allergens');
      expect(c.kind).toBe('recall');
    }
    for (const c of foodCards) {
      expect(c.sourceKind).toBe('food');
      expect(c.learnLink, c.id).toBe('know-the-dish');
      expect(foodById.get(c.sourceId), 'unknown food: ' + c.sourceId).toBeTruthy();
    }
    for (const c of cocktailCards) {
      expect(c.sourceKind).toBe('cocktail');
      expect(c.learnLink, c.id).toBe('know-the-build');
      expect(cocktailById.get(c.sourceId), 'unknown cocktail: ' + c.sourceId).toBeTruthy();
    }
  });

  it('answer is the dish\'s FIRST allergen; NO other choice is on the dish; food distractors stay within the FOOD vocabulary (frozen cards)', () => {
    for (const c of foodCards) {
      const f: any = foodById.get(c.sourceId);
      expect(c.answer, c.id).toBe(f.allergens[0]);
      expect(c.choices.length, c.id).toBe(4);
      expect(new Set(c.choices).size, c.id + ' dup choices').toBe(4);
      expect(c.choices).toContain(c.answer);
      const mine = new Set(f.allergens.map(lc));
      for (const ch of c.choices) {
        if (ch === c.answer) continue;
        // CRITICAL: a second-listed flag is still a CORRECT answer — never a foil.
        expect(mine.has(lc(ch)), c.id + ' distractor is a real flag on the dish: ' + ch).toBe(false);
        expect(vocab.has(ch), c.id + ' distractor outside the FOOD allergen vocabulary: ' + ch).toBe(true);
      }
    }
  });

  it('cocktail cards: answer is the drink\'s FIRST allergen; prompt mirrors the food prompt; aliases carry the remaining flags', () => {
    for (const c of cocktailCards) {
      const ck: any = cocktailById.get(c.sourceId);
      expect(c.answer, c.id).toBe(ck.allergens[0]);
      expect(c.prompt, c.id).toBe('Which allergen flag does the ' + ck.name + ' carry?');
      expect(c.aliases, c.id).toEqual(ck.allergens.slice(1));
      expect(c.tags, c.id).toContain('allergens');
      expect(c.tags, c.id).toContain('cocktail');
    }
  });

  it('union-vocab safety: NO distractor on ANY card (food or cocktail) is a true flag of its item; cocktail foils come from the union vocabulary', () => {
    for (const c of cards) {
      const item: any = c.sourceKind === 'food' ? foodById.get(c.sourceId) : cocktailById.get(c.sourceId);
      const mine = new Set(item.allergens.map(lc));
      expect(c.choices.length, c.id).toBe(4);
      expect(new Set(c.choices).size, c.id + ' dup choices').toBe(4);
      expect(c.choices).toContain(c.answer);
      for (const ch of c.choices) {
        if (ch === c.answer) continue;
        expect(mine.has(lc(ch)), c.id + ' distractor is a real flag of the item: ' + ch).toBe(false);
        expect(unionVocab.has(ch), c.id + ' distractor outside the union vocabulary: ' + ch).toBe(true);
      }
    }
  });

  it('cocktail foils draw on the UNION pool, not the cocktail-only tokens: some cocktail card carries a FOOD-ONLY foil', () => {
    // The cocktail vocabulary (6 tokens) could fill 3 foils by itself — this proves
    // the pool is genuinely food + cocktail by demanding a foil that exists ONLY in
    // the food vocabulary (e.g. gluten, shellfish), never on any cocktail.
    const cocktailVocab = new Set<string>();
    data.cocktails.forEach((c: any) => (c.allergens || []).forEach((a: string) => cocktailVocab.add(a)));
    const foodOnlyFoil = cocktailCards.some((c: any) =>
      c.choices.some((ch: string) => ch !== c.answer && vocab.has(ch) && !cocktailVocab.has(ch)));
    expect(foodOnlyFoil).toBe(true);
  });

  it('food why carries flags + allergenNote and ALWAYS ends with the kitchen-confirm sentence, byte-exact', () => {
    for (const c of foodCards) {
      const f: any = foodById.get(c.sourceId);
      expect(c.why, c.id).toContain(f.allergens.join(', '));
      if (f.allergenNote) expect(c.why, c.id).toContain(f.allergenNote);
      expect(c.why.endsWith(KITCHEN_CONFIRM), c.id + ' why must end with the compliance sentence').toBe(true);
      expect(c.tags, c.id).toContain('allergens');
      expect(c.tags, c.id).toContain('food');
    }
  });

  it('cocktail why carries flags + allergenNote, ends with the EXACT bar-confirm sentence, and never says "kitchen"', () => {
    for (const c of cocktailCards) {
      const ck: any = cocktailById.get(c.sourceId);
      expect(c.why, c.id).toContain(ck.allergens.join(', '));
      if (ck.allergenNote) expect(c.why, c.id).toContain(ck.allergenNote);
      expect(c.why.endsWith(BAR_CONFIRM), c.id + ' why must end with the BAR compliance sentence').toBe(true);
      expect(lc(c.why), c.id + ' drinks are confirmed with the bar, never the kitchen').not.toContain('kitchen');
    }
  });

  it('is deterministic: two generations are byte-identical', () => {
    expect(JSON.stringify(T.generateDeck('allergens', data)))
      .toBe(JSON.stringify(T.generateDeck('allergens', data)));
  });
});

describe('wiring — allCards, expandFor, Floor Basics, exam decoupling', () => {
  it('allCards picks up both new decks (allergens = flagged foods + flagged cocktails)', () => {
    const all = T.allCards(data).map((c: any) => c.id);
    expect(all.filter((id: string) => id.startsWith('components:')).length).toBe(withIngredients.length);
    expect(all.filter((id: string) => id.startsWith('allergens:')).length)
      .toBe(withAllergens.length + cocktailsWithAllergens.length);
  });

  it('expandFor on a components card surfaces the official description, components, and allergen flags', () => {
    const c = T.generateDeck('components', data).find((x: any) => x.sourceId === 'tuna-crudo');
    const f: any = foodById.get('tuna-crudo');
    const sections = T.expandFor(c, data).sections;
    const byLabel: Record<string, any> = {};
    sections.forEach((s: any) => { byLabel[s.label] = s; });
    expect(byLabel['The official description']?.text).toBe(f.description);
    expect(byLabel['Official components']?.text).toContain(f.ingredients.join(', '));
    expect(byLabel['Allergen flags']?.text).toContain(f.allergens.join(', '));
    expect(byLabel['Allergen flags']?.text).toContain(f.allergenNote); // tuna-crudo has a note
    expect(byLabel['Allergen flags']?.text).toContain(KITCHEN_CONFIRM);
  });

  it('expandFor keeps the existing food sections (additive: new ones appended after)', () => {
    const c = T.generateDeck('pairing', data).find((x: any) => x.sourceId === 'tuna-crudo');
    const labels = T.expandFor(c, data).sections.map((s: any) => s.label);
    expect(labels).toContain('The dish');
    expect(labels).toContain('The picks');
    expect(labels.indexOf('The official description')).toBeGreaterThan(labels.indexOf('The picks'));
  });

  it('FLOOR_BASICS food-runner picks resolve to >0 card ids in each new deck', () => {
    expect(FLOOR_BASICS.componentsFoodIds.length).toBeGreaterThan(0);
    expect(FLOOR_BASICS.allergensFoodIds.length).toBeGreaterThan(0);
    const ids = basicsIdSet(data);
    const comp = [...ids].filter((id) => id.startsWith('components:'));
    const alg = [...ids].filter((id) => id.startsWith('allergens:'));
    expect(comp.length, 'every componentsFoodId resolves').toBe(FLOOR_BASICS.componentsFoodIds.length);
    expect(alg.length, 'every allergensFoodId resolves').toBe(FLOOR_BASICS.allergensFoodIds.length);
  });

  it('the 6 cocktail allergen cards do NOT leak into Floor Basics — resolution stays exactly 60', () => {
    const ids = basicsIdSet(data);
    expect(ids.size, 'Floor Basics resolved size').toBe(60);
    const alg = [...ids].filter((id) => id.startsWith('allergens:'));
    // allergensFoodIds resolves by deck+sourceId over FOOD ids only (8 picks).
    expect(alg.length).toBe(FLOOR_BASICS.allergensFoodIds.length);
    for (const id of alg) {
      const sourceId = id.split(':')[1];
      expect(cocktailById.has(sourceId), id + ' resolved from a cocktail — basics leak').toBe(false);
      expect(FLOOR_BASICS.allergensFoodIds, id).toContain(sourceId);
    }
  });

  it('mock exams are NOT coupled to the new decks (planned follow-up, not tonight)', () => {
    expect(EXAM_BLUEPRINT).not.toHaveProperty('components');
    expect(EXAM_BLUEPRINT).not.toHaveProperty('allergens');
    expect(EXAM_BLUEPRINT).not.toHaveProperty('builds'); // Task D2: same decoupling
  });
});
