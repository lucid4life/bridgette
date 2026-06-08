import { describe, it, expect } from 'vitest';
import { data } from './data.js';

// The ONLY drinks the menu sells as non-alcoholic (verified against
// source_menus/calgary-drink.txt "no alcohol" section in the 2026-06-08 sweep).
// True 0.0% + the <0.5% de-alcoholized items the menu lists under "no alcohol".
const ALLOWED_ZERO = new Set([
  'Gallina de Piel Neverwine',
  'Peroni Pilsner 0.0',
  'Redbull',
  'Pop',
  'Lovers Mountain',
  'Short Film',
  'Sunrise Spritz',
  'Noughty Rouge',
  'Freixenet Sparkling Wine'
]);

// foods[].zero is a display string; multiple options are joined with " or ".
function tokens(zero: string): string[] {
  return zero.split(/\s+or\s+/i).map((s) => s.trim()).filter(Boolean);
}

describe('foods[].zero is only ever genuinely non-alcoholic', () => {
  for (const f of data.foods.filter((x: any) => x.zero)) {
    it(`${f.id}: every zero-proof option is on the verified N/A list`, () => {
      for (const t of tokens(f.zero)) {
        expect(ALLOWED_ZERO.has(t), `"${t}" in ${f.id}.zero is not a verified non-alcoholic item`).toBe(true);
      }
    });
  }
});
