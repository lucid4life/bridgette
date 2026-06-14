// The pronunciation pack — mapping validity + clip coverage on disk.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { data } from '$lib/data';
import { PRON_TERMS, termsFor } from './pronunciation';

const TERMS_DIR = fileURLToPath(new URL('../../../static/audio/terms/', import.meta.url));
const foodIds = new Set(data.foods.map((f) => f.id));

describe('pronunciation pack', () => {
  it('69 terms (39 must + 30 nice), unique slugs, every dish reference real', () => {
    expect(PRON_TERMS.length).toBe(69);
    expect(PRON_TERMS.filter((t) => t.priority === 'must').length).toBe(39);
    expect(PRON_TERMS.filter((t) => t.priority === 'nice').length).toBe(30);
    expect(new Set(PRON_TERMS.map((t) => t.slug)).size).toBe(PRON_TERMS.length);
    for (const t of PRON_TERMS) {
      expect(t.respell.length).toBeGreaterThan(2);
      for (const id of t.dishes) expect(foodIds.has(id), `${t.term} → '${id}'`).toBe(true);
    }
  });

  it('every term has its clip on disk (Sarah, /audio/terms/<slug>.mp3)', () => {
    for (const t of PRON_TERMS)
      expect(existsSync(`${TERMS_DIR}${t.slug}.mp3`), `${t.slug}.mp3`).toBe(true);
  });

  it('termsFor maps by dish (burrata-cheese hears burrata; fries hear aioli)', () => {
    expect(termsFor('burrata-cheese').map((t) => t.term)).toContain('burrata');
    expect(termsFor('french-fries').map((t) => t.term)).toContain('aioli');
    expect(termsFor('not-a-dish')).toEqual([]);
  });
});
