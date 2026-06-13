import { describe, expect, it } from 'vitest';
import { formatGlassPrice } from './price';

describe('formatGlassPrice (§4 shared glass-price formatter)', () => {
  it('decodes a 3-part 5oz|8oz|bottle ladder', () => {
    expect(formatGlassPrice('15 | 24 | 75')).toBe('5oz $15 · 8oz $24 · bottle $75');
    expect(formatGlassPrice('15|24|75')).toBe('5oz $15 · 8oz $24 · bottle $75'); // tolerates no spaces
  });
  it('falls back to "$<raw>" when it is not a 3-part ladder', () => {
    expect(formatGlassPrice('18')).toBe('$18');
    expect(formatGlassPrice('14 | 70')).toBe('$14 | 70');
  });
});
