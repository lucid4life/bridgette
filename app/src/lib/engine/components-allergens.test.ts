// Task 2 — two new drill decks over the official menu syllabus (Task 1 data):
// "Dish Components" (components:<foodId>:pick) and "Allergen Flags"
// (allergens:<foodId>:flag). Written TDD-first: these specs define the decks.
import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { FLOOR_BASICS, basicsIdSet } from './basics.js';
import { EXAM_BLUEPRINT } from './exam.js';
import { data } from '../data/index';

const KITCHEN_CONFIRM = 'Always confirm allergens with the kitchen before promising a guest.';
const lc = (s: any) => String(s).toLowerCase();
const words = (s: any) => lc(s).split(/[^a-z0-9]+/).filter(Boolean);

const foodById = new Map(data.foods.map((f: any) => [f.id, f]));
const withIngredients = data.foods.filter((f: any) => f.ingredients && f.ingredients.length >= 1);
const withAllergens = data.foods.filter((f: any) => f.allergens && f.allergens.length >= 1);

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
  const vocab = new Set<string>();
  data.foods.forEach((f: any) => (f.allergens || []).forEach((a: string) => vocab.add(a)));

  it('is registered in DECKS with the know-the-dish learnLink', () => {
    expect((T.DECKS as any).allergens).toBeTruthy();
    expect((T.DECKS as any).allergens.label).toBe('Allergen Flags');
    expect((T.DECKS as any).allergens.learnLink).toBe('know-the-dish');
  });

  it('mints one card per food with allergen flags (derived count, 41 today)', () => {
    expect(withAllergens.length).toBeGreaterThanOrEqual(1);
    expect(cards.length).toBe(withAllergens.length);
  });

  it('every id mints ONLY the new allergens:<foodId>:flag namespace', () => {
    for (const c of cards) {
      expect(c.id, c.id).toMatch(/^allergens:[a-z0-9-]+:flag$/);
      expect(c.id).toBe('allergens:' + c.sourceId + ':flag');
      expect(c.deck).toBe('allergens');
      expect(c.kind).toBe('recall');
      expect(c.sourceKind).toBe('food');
      expect(c.learnLink).toBe('know-the-dish');
    }
  });

  it('answer is the dish\'s FIRST allergen; NO other choice is on the dish; distractors come from the global vocabulary', () => {
    for (const c of cards) {
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
        expect(vocab.has(ch), c.id + ' distractor outside the allergen vocabulary: ' + ch).toBe(true);
      }
    }
  });

  it('why carries the full flag list, the allergenNote when present, and ALWAYS ends with the kitchen-confirm sentence', () => {
    for (const c of cards) {
      const f: any = foodById.get(c.sourceId);
      expect(c.why, c.id).toContain(f.allergens.join(', '));
      if (f.allergenNote) expect(c.why, c.id).toContain(f.allergenNote);
      expect(c.why.endsWith(KITCHEN_CONFIRM), c.id + ' why must end with the compliance sentence').toBe(true);
      expect(c.tags, c.id).toContain('allergens');
      expect(c.tags, c.id).toContain('food');
    }
  });

  it('is deterministic: two generations are byte-identical', () => {
    expect(JSON.stringify(T.generateDeck('allergens', data)))
      .toBe(JSON.stringify(T.generateDeck('allergens', data)));
  });
});

describe('wiring — allCards, expandFor, Floor Basics, exam decoupling', () => {
  it('allCards picks up both new decks', () => {
    const all = T.allCards(data).map((c: any) => c.id);
    expect(all.filter((id: string) => id.startsWith('components:')).length).toBe(withIngredients.length);
    expect(all.filter((id: string) => id.startsWith('allergens:')).length).toBe(withAllergens.length);
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

  it('mock exams are NOT coupled to the new decks (planned follow-up, not tonight)', () => {
    expect(EXAM_BLUEPRINT).not.toHaveProperty('components');
    expect(EXAM_BLUEPRINT).not.toHaveProperty('allergens');
  });
});
