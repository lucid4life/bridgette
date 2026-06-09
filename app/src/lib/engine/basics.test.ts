import { describe, it, expect } from 'vitest';
import { basicsIdSet } from './basics.js';
import * as T from './training.js';
import { data } from '../data/index';

describe('Floor Basics on-ramp set', () => {
  const ids = basicsIdSet(data);
  const valid = new Set(T.allCards(data).map((c) => c.id));

  it('is a curated 30-40 card set', () => {
    expect(ids.size, `resolved ${ids.size} basics cards`).toBeGreaterThanOrEqual(30);
    expect(ids.size).toBeLessThanOrEqual(40);
  });

  it('every basics id resolves to a real card (no drift)', () => {
    for (const id of ids) expect(valid.has(id), id).toBe(true);
  });

  it('spans at least 5 decks', () => {
    const decks = new Set([...ids].map((id) => id.split(':')[0]));
    expect(decks.size).toBeGreaterThanOrEqual(5);
  });
});
