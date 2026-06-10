import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { buildExam, EXAM_BLUEPRINT } from './exam.js';
import { data } from '../data/index';

// Seedable rng (same mulberry-style generator the training tests use).
function seededRng(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function countByDeck(cards: { deck: string }[]) {
  const seen: Record<string, number> = {};
  cards.forEach((c) => { seen[c.deck] = (seen[c.deck] || 0) + 1; });
  return seen;
}

describe('buildExam (Mock Menu-Test blueprint)', () => {
  it('honors the full-exam blueprint counts (30 questions)', () => {
    const cards = buildExam(data, { rng: seededRng(1) });
    const seen = countByDeck(cards);
    let total = 0;
    Object.keys(EXAM_BLUEPRINT).forEach((d) => {
      const n = (EXAM_BLUEPRINT as Record<string, number>)[d];
      expect(seen[d], 'deck ' + d + ' should contribute ' + n).toBe(n);
      total += n;
    });
    expect(total).toBe(30);
    expect(cards.length).toBe(30);
  });

  it('half exam halves each deck count rounding up (~15 questions)', () => {
    const cards = buildExam(data, { half: true, rng: seededRng(2) });
    const seen = countByDeck(cards);
    let total = 0;
    Object.keys(EXAM_BLUEPRINT).forEach((d) => {
      const n = Math.ceil((EXAM_BLUEPRINT as Record<string, number>)[d] / 2);
      expect(seen[d], 'deck ' + d + ' should contribute ' + n).toBe(n);
      total += n;
    });
    expect(cards.length).toBe(total);
    expect(Math.abs(cards.length - 15) <= 1, 'half exam should be ~15, got ' + cards.length).toBeTruthy();
  });

  it('is deterministic under a seeded rng', () => {
    const a = buildExam(data, { rng: seededRng(42) }).map((c: any) => c.id);
    const b = buildExam(data, { rng: seededRng(42) }).map((c: any) => c.id);
    expect(a).toEqual(b);
    // a different seed still yields a full, valid exam
    expect(buildExam(data, { rng: seededRng(7) }).length).toBe(a.length);
  });

  it('never draws a pronunciation card (self-graded — not objectively scorable)', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const cards = buildExam(data, { rng: seededRng(seed) });
      expect(cards.filter((c: any) => c.deck === 'pronunciation').length).toBe(0);
      expect(cards.filter((c: any) => c.kind === 'pronounce').length).toBe(0);
    }
  });

  it('every drawn card id exists in allCards(data)', () => {
    const valid = new Set(T.allCards(data).map((c: any) => c.id));
    const cards = buildExam(data, { rng: seededRng(9) });
    cards.forEach((c: any) => {
      expect(valid.has(c.id), 'unknown card id: ' + c.id).toBeTruthy();
    });
    // and no duplicates within one exam
    expect(new Set(cards.map((c: any) => c.id)).size).toBe(cards.length);
  });

  it('scores with scoreReadiness even without confidence fields', () => {
    const cards = buildExam(data, { half: true, rng: seededRng(3) });
    const results = cards.map((card: any, i: number) => ({ card, correct: i % 2 === 0 }));
    const scored = T.scoreReadiness(results);
    expect(scored.total).toBe(cards.length);
    expect(scored.sureWrong).toBe(0); // no confidence in exams
    expect(scored.score).toBe(Math.round((scored.correct / scored.total) * 100));
  });
});
