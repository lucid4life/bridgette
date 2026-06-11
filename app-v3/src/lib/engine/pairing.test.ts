import { describe, it, expect } from 'vitest';
import { LEVERS, leversFor } from './pairing.js';
import * as T from './training.js';
import { data } from '../data/index';

describe('pairing levers (LEVERS + leversFor)', () => {
  const paired = data.foods.filter((f) => f.wine && f.lever);

  it('LEVERS covers every lever id used in data.foods', () => {
    for (const f of data.foods) {
      if (f.lever) expect(LEVERS, `${f.id} uses unknown lever ${f.lever}`).toHaveProperty(f.lever);
    }
  });

  it('every authored lever ranks top-2 in leversFor (the heuristics stay honest)', () => {
    expect(paired.length).toBeGreaterThan(0);
    for (const f of paired) {
      const wine = data.wines.find((w) => w.name === f.wine); // may be undefined (dessert pours)
      const ranked = leversFor(f, wine);
      expect(ranked.slice(0, 2), `${f.id}: authored ${f.lever}, ranked ${ranked.join(' > ')}`).toContain(f.lever);
    }
  });

  it('leversFor handles a missing wine gracefully', () => {
    const ranked = leversFor(paired[0], undefined);
    expect(Array.isArray(ranked)).toBe(true);
    expect(ranked).toContain('match-intensity');
  });
});

describe('pairing-principle deck', () => {
  const cards = T.generateDeck('pairing-principle', data);
  const expected = data.foods.filter((f) => f.wine && f.lever && f.id !== 'matinee-snack-menu');

  it('one card per wine+lever food, matinee excluded, ids in the new namespace', () => {
    expect(cards.length).toBe(expected.length);
    for (const c of cards) expect(c.id).toMatch(/^pairing-principle:[a-z0-9-]+:lever$/);
    expect(cards.some((c: any) => c.sourceId === 'matinee-snack-menu')).toBe(false);
  });

  it('answer is the lever label, distractors are 3 other lever labels', () => {
    const labels = new Set(Object.keys(LEVERS).map((k) => (LEVERS as any)[k].label));
    for (const c of cards) {
      expect(labels.has(c.answer), c.id).toBe(true);
      expect(c.choices?.length).toBe(4);
      expect(new Set(c.choices).size).toBe(4);
      for (const ch of c.choices ?? []) expect(labels.has(ch), `${c.id}: ${ch}`).toBe(true);
    }
  });
});
