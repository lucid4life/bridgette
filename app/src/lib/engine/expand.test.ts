import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { data } from '../data/index';

const hasContent = (s: any) =>
  !!(s.text || (s.items && s.items.length) || s.structure || (s.objections && s.objections.length) || s.picks);

describe('expandFor — the progressive-disclosure drawer from existing data', () => {
  it('a wine card surfaces the 10-second line + structure', () => {
    const c = T.generateDeck('wine-identity', data)[0];
    const labels = T.expandFor(c, data).sections.map((s: any) => s.label);
    expect(labels).toContain('10-second');
    expect(labels).toContain('Structure');
  });

  it('a translator card surfaces familiar / different / say', () => {
    const c = T.generateDeck('translator', data)[0];
    const sections = T.expandFor(c, data).sections;
    expect(sections.length).toBeGreaterThan(0);
    const labels = sections.map((s: any) => s.label);
    expect(labels).toContain('Point of difference');
  });

  it('a pairing (food) card surfaces the lever + the picks', () => {
    const c = T.generateDeck('pairing', data)[0];
    const sections = T.expandFor(c, data).sections;
    expect(sections.some((s: any) => s.picks)).toBe(true);
  });

  it('every section across every card has real content (no empty drawers)', () => {
    for (const c of T.allCards(data)) {
      for (const s of T.expandFor(c, data).sections) {
        expect(hasContent(s), `${c.id} / ${s.label}`).toBe(true);
      }
    }
  });
});
