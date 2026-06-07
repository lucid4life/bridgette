import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { data } from '../data/index';
import frozen from './__fixtures__/card-ids.json';

describe('card-ID stability (Leitner state depends on these slugs)', () => {
  it('allCards ids match the frozen snapshot byte-for-byte', () => {
    const live = T.allCards(data).map((c: any) => c.id).sort();
    expect(live).toEqual(frozen);
  });

  it('every id follows <deck>:<item>:<type>', () => {
    for (const id of frozen as string[]) expect(id.split(':').length).toBe(3);
  });
});
