// The Romance drill's asking order: shakiest → never-introduced → the rest,
// categories interleaved greedily (no two same-category dishes adjacent where
// avoidable), fully deterministic for a given store state.
import { describe, expect, it } from 'vitest';
import type { JourneyItem } from '$lib/journey/types';
import { allStage1Items, romanceFor } from '$lib/journey/items';
import { romanceOrder } from './index';

const mk = (id: string): JourneyItem => ({ id: `dish:${id}`, kind: 'dish', unitId: 'u', foodId: id });
const cats = (m: Record<string, string>) => (item: JourneyItem) => m[item.foodId!];

describe('romanceOrder: tiers', () => {
  const items = [mk('a'), mk('b'), mk('c'), mk('d')];
  // distinct categories everywhere → the interleave never reorders the tiers
  const cat = cats({ a: 'A', b: 'B', c: 'C', d: 'D' });

  it('shakiest first (in shaky rank), then never-introduced, then the rest', () => {
    const introduced = new Set(['dish:a', 'dish:b', 'dish:d']);
    const out = romanceOrder(items, ['dish:d', 'dish:b'], (id) => introduced.has(id), cat);
    expect(out.map((i) => i.foodId)).toEqual(['d', 'b', 'c', 'a']);
  });

  it('non-dish shaky ids are ignored; given order is kept within a tier', () => {
    const out = romanceOrder(items, ['service:hands-full'], () => false, cat);
    expect(out.map((i) => i.foodId)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('romanceOrder: category interleave', () => {
  it('breaks up same-category runs where avoidable', () => {
    const items = [mk('a1'), mk('a2'), mk('b1'), mk('b2')];
    const cat = cats({ a1: 'A', a2: 'A', b1: 'B', b2: 'B' });
    const out = romanceOrder(items, [], () => true, cat);
    expect(out.map((i) => i.foodId)).toEqual(['a1', 'b1', 'a2', 'b2']);
  });

  it('falls back to priority order when a run is unavoidable', () => {
    const items = [mk('a1'), mk('a2'), mk('a3')];
    const cat = cats({ a1: 'A', a2: 'A', a3: 'A' });
    const out = romanceOrder(items, [], () => true, cat);
    expect(out.map((i) => i.foodId)).toEqual(['a1', 'a2', 'a3']);
  });

  it('is deterministic and returns every item exactly once', () => {
    const items = [mk('a1'), mk('a2'), mk('b1'), mk('c1'), mk('c2')];
    const cat = cats({ a1: 'A', a2: 'A', b1: 'B', c1: 'C', c2: 'C' });
    const one = romanceOrder(items, ['dish:c2'], (id) => id !== 'dish:b1', cat);
    const two = romanceOrder(items, ['dish:c2'], (id) => id !== 'dish:b1', cat);
    expect(one).toEqual(two);
    expect(new Set(one.map((i) => i.id)).size).toBe(items.length);
  });
});

describe('romanceOrder: the real 41-dish menu', () => {
  const dishes = allStage1Items().filter((i) => i.kind === 'dish');
  const cat = (i: JourneyItem) => romanceFor(i).category;

  it('fresh state: all 41 present, no two same-category dishes adjacent', () => {
    const out = romanceOrder(dishes, [], () => false, cat);
    expect(out.length).toBe(41);
    expect(new Set(out.map((i) => i.id)).size).toBe(41);
    for (let i = 1; i < out.length; i++) {
      expect(cat(out[i]), `${out[i - 1].id} then ${out[i].id}`).not.toBe(cat(out[i - 1]));
    }
  });

  it('a shaky dish leads even from the back of the roster', () => {
    const last = dishes[dishes.length - 1];
    const out = romanceOrder(dishes, [last.id], (id) => id === last.id, cat);
    expect(out[0].id).toBe(last.id);
  });
});
