import { describe, it, expect } from 'vitest';
import { deduce, checkQuickCheck } from './wineschool.js';
import { DECKS } from './training.js';
import { data as DATA } from '../data/index';

describe('wineschool deductive logic', () => {
  it('deduce: white + high acid + low tannin clues → Grüner (Hiedler Löss) ranks first', () => {
    const out = deduce(DATA.wines, { category: 'White', acidity: 'high', tannin: 'low' });
    expect(out.length > 0).toBeTruthy();
    expect(out[0].wine.id).toBe('hiedler-loss');
    expect(out[0].exact).toBe(true);
  });

  it('deduce: red + high tannin + high acid → Nebbiolo (Ca\' del Baio) ranks first', () => {
    const out = deduce(DATA.wines, { category: 'Red', tannin: 'high', acidity: 'high' });
    expect(out[0].wine.id).toBe('ca-del-baio-langhe');
  });

  it('deduce: no clues set → empty', () => {
    expect(deduce(DATA.wines, {})).toEqual([]);
  });

  it('deduce: results are sorted by match count descending', () => {
    const out = deduce(DATA.wines, { category: 'Red', tannin: 'high' });
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1].matched >= out[i].matched, 'non-increasing match counts').toBeTruthy();
    }
  });

  it('deduce: every returned row matched at least one clue', () => {
    const out = deduce(DATA.wines, { category: 'White', body: 'medium' });
    expect(out.every((r) => r.matched >= 1)).toBeTruthy();
  });

  it('checkQuickCheck: returns true only for the correct index', () => {
    const lesson = { quickCheck: { q: 'x', choices: ['a', 'b', 'c'], answer: 1 } };
    expect(checkQuickCheck(lesson, 1)).toBe(true);
    expect(checkQuickCheck(lesson, 0)).toBe(false);
    expect(checkQuickCheck(lesson, 2)).toBe(false);
  });

  it('data integrity: every lesson quickCheck.answer indexes a real choice', () => {
    DATA.lessons.forEach((l) => {
      const qc = l.quickCheck;
      expect(qc && Array.isArray(qc.choices), `${l.id}: choices array`).toBeTruthy();
      expect(
        Number.isInteger(qc.answer) && qc.answer >= 0 && qc.answer < qc.choices.length,
        `${l.id}: answer ${qc.answer} out of range`
      ).toBeTruthy();
    });
  });

  it('every deck learnLink resolves to a real lesson id', () => {
    const lessonIds = new Set(DATA.lessons.map((l) => l.id));
    Object.keys(DECKS).forEach((deck) => {
      expect(
        lessonIds.has((DECKS as any)[deck].learnLink),
        `deck ${deck} learnLink ${(DECKS as any)[deck].learnLink} has no lesson`
      ).toBeTruthy();
    });
  });
});
