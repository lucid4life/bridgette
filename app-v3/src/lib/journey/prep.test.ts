// Prep-my-bottle pure layer — glass + bottle mappers, the 5-question self-check,
// and the 60-second script, validated over the REAL wine + full-menu data.
import { describe, expect, it } from 'vitest';
import { data, type Bottle, type Wine } from '$lib/data';
import full from '../../../static/fullmenu.json';
import { bottleToPrep, glassToPrep, prepScript, prepSelfCheck, type PrepWine } from './prep';

const bottles = full.bottles as unknown as Bottle[];
// Both production paths feed the self-check + script: glass pours AND bottles.
const ALL: PrepWine[] = [...(data.wines as Wine[]).map(glassToPrep), ...bottles.map(bottleToPrep)];

describe('glassToPrep', () => {
  it('maps every by-the-glass pour with a decoded price ladder + objections', () => {
    for (const w of data.wines as Wine[]) {
      const p = glassToPrep(w);
      expect(p.kind).toBe('glass');
      expect(p.grape).toBe(w.grape);
      expect(p.region).toBe(w.region);
      expect(p.structure).toEqual(w.structure);
      expect(p.price).toMatch(/^5oz \$.+ · 8oz \$.+ · bottle \$.+$/); // 3-part ladder
      expect(p.objections).toEqual(w.objections ?? []);
      expect(p.whyWePourIt.length).toBeGreaterThan(0);
    }
  });
});

describe('bottleToPrep', () => {
  it('maps every bottle with a bottle-price line and no objections', () => {
    for (const b of bottles) {
      const p = bottleToPrep(b);
      expect(p.kind).toBe('bottle');
      expect(p.grape).toBe(b.grape);
      expect(p.region).toBe(b.region);
      expect(p.price).toMatch(/^bottle (\$\d+|— ask)$/);
      expect(p.objections).toBeUndefined();
      expect(p.whyWePourIt.length).toBeGreaterThan(0);
    }
  });
});

describe('prepSelfCheck (glass AND bottle view-models)', () => {
  it('asks the pour’s own facts: grape, place, structure, pairing, why', () => {
    for (const p of ALL) {
      const qs = prepSelfCheck(p);
      expect(qs.length, p.id).toBeGreaterThanOrEqual(4);
      expect(qs.length, p.id).toBeLessThanOrEqual(5);
      expect(qs[0].prompt).toContain(p.name);
      expect(qs[0].answer).toBe(p.grape); // grape question
      expect(qs[1].answer).toContain(p.region); // place question
      expect(qs.some((q) => q.answer === p.whyWePourIt)).toBe(true);
      for (const q of qs) {
        expect(q.prompt.length).toBeGreaterThan(0);
        expect(q.answer.length).toBeGreaterThan(0);
      }
    }
  });

  it('degrades to 4 questions (no pairing) when a pour has no pair, without throwing', () => {
    const noPair: PrepWine = { ...ALL[0], pair: [] };
    const qs = prepSelfCheck(noPair);
    expect(qs.length).toBe(4);
    expect(qs.some((q) => q.prompt.includes('pour with'))).toBe(false);
  });
});

describe('prepScript (glass AND bottle view-models)', () => {
  it('assembles open → grape&place → why → pairing → closer, all from the pour’s fields', () => {
    for (const p of ALL) {
      const beats = prepScript(p);
      expect(beats.length, p.id).toBeGreaterThanOrEqual(4);
      expect(beats[0].label).toBe('open');
      expect(beats[0].line).toContain(p.name);
      expect(beats[0].line).toContain(p.respell);
      expect(beats[1].line).toContain(p.grape);
      expect(beats[1].line).toContain(p.region.split(',')[0]);
      expect(beats.some((b) => b.line.includes(p.whyWePourIt))).toBe(true);
      expect(beats[beats.length - 1].label).toBe('the closer');
      expect(beats[beats.length - 1].line).toContain('taste');
    }
  });

  it('degrades to 4 beats (no pairing) when a pour has no pair, without throwing', () => {
    const noPair: PrepWine = { ...ALL[0], pair: [] };
    const beats = prepScript(noPair);
    expect(beats.length).toBe(4);
    expect(beats.some((b) => b.label === 'a pairing')).toBe(false);
  });
});
