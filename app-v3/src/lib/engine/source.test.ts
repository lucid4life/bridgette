import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { data } from '../data/index';

describe('card source linkage (powers the Expand drawer)', () => {
  const cards = T.allCards(data);

  it('every card carries a sourceKind + sourceId', () => {
    for (const c of cards) {
      expect(c.sourceKind, c.id).toBeTruthy();
      expect(c.sourceId, c.id).toBeTruthy();
    }
  });

  it('sourceForCard resolves a real record for every card', () => {
    for (const c of cards) {
      const src = T.sourceForCard(c, data);
      expect(src, `unresolved source for ${c.id} (${c.sourceKind}:${c.sourceId})`).toBeTruthy();
    }
  });

  it('does not change card ids — the frozen slug scheme is intact', () => {
    // sourceKind/sourceId are additive fields, NOT part of the id.
    for (const c of cards) expect(c.id.split(':').length).toBe(3);
  });

  it('wine-dish cards bridge to both a wine and a food', () => {
    const wd = T.generateDeck('wine-dish', data);
    expect(wd.length).toBeGreaterThan(0);
    for (const c of wd) {
      expect(c.sourceKind).toBe('wine');
      expect(data.wines.find((w) => w.id === c.sourceId), c.id).toBeTruthy();
      expect(data.foods.find((f) => f.id === c.sourceFoodId), c.id).toBeTruthy();
    }
  });
});
