import { describe, it, expect } from 'vitest';
import { data } from './index';

describe('v2 data module', () => {
  it('exports schemaVersion 2 and the confirm rules', () => {
    expect(data.schemaVersion).toBe(2);
    expect(data.confirm.vegan).toBeTruthy();
    expect(data.confirm.allergens).toBeTruthy();
  });

  it('has 17 wines with unique ids', () => {
    expect(data.wines).toHaveLength(17);
    const ids = data.wines.map((w) => w.id);
    expect(new Set(ids).size).toBe(17);
  });

  it('every wine has the v2 fields', () => {
    const fams = ['Bubbles & Rosé', 'Bright & Crisp Whites', 'Round Whites', 'Light Reds', 'Structured Reds'];
    for (const w of data.wines) {
      expect(['cool', 'moderate', 'warm']).toContain(w.climate);
      expect(fams).toContain(w.family);
      expect(typeof w.exclusive).toBe('boolean');
      expect(w.vegan === true || w.vegan === null).toBe(true);
      expect(Array.isArray(w.objections) && w.objections.length >= 1).toBe(true);
      for (const o of w.objections) {
        expect(o.cue).toBeTruthy();
        expect(o.reply).toBeTruthy();
      }
    }
  });

  it('exactly 5 wines are exclusive, 5 are confirmed vegan', () => {
    expect(data.wines.filter((w) => w.exclusive).length).toBe(5);
    expect(data.wines.filter((w) => w.vegan === true).length).toBe(5);
  });

  it('every family bucket is non-empty', () => {
    const fams = ['Bubbles & Rosé', 'Bright & Crisp Whites', 'Round Whites', 'Light Reds', 'Structured Reds'];
    for (const f of fams) expect(data.wines.some((w) => w.family === f)).toBe(true);
  });

  it('translator bestGlass values are all real wine names', () => {
    const names = new Set(data.wines.map((w) => w.name));
    for (const t of data.translator) expect(names.has(t.bestGlass)).toBe(true);
  });

  it('the ribeye leads with Claret and the Nebbiolo no longer pairs the 26oz ribeye', () => {
    const ribeye = data.foods.find((f) => f.id === '26oz-wood-grilled-beef-ribeye');
    expect(ribeye?.wine).toBe('St. John Claret');
    const neb = data.wines.find((w) => w.id === 'ca-del-baio-langhe');
    expect(neb?.pair.some((p) => /ribeye/i.test(p))).toBe(false);
  });
});
