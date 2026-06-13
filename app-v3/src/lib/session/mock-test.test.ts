// "The food test" — checkpoint semantics (one rng-shuffled graded pass, NO SRS
// events, pass at 0.85) over dish items, but each dish is asked as ONE of four
// question types assigned round-robin from a per-run rotation. summary() adds
// byType + byCategory breakdowns and the miss list.
import { describe, expect, it } from 'vitest';
import { hasModsMc, teachFor } from '$lib/journey/items';
import { allStage1Items, itemsForUnit } from '$lib/journey/items';
import type { JourneyItem } from '$lib/journey/types';
import {
  MOCK_TYPE_ROTATION,
  assignMockTypes,
  createMockTestSession,
  mockMcContentFor,
  mockQtypeOf,
  type MockQuestionType,
  type MockTestSession,
  type Step
} from './index';

const PREDS = { hasAllergen: () => true, hasMods: () => true };

// mulberry32 — deterministic rng for tests
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DISHES = allStage1Items().filter((i) => i.kind === 'dish');

// The session's own exported resolution — tests answer EXACTLY what it grades.
const qtypeOf = (step: Step): MockQuestionType => mockQtypeOf(step);
const mcContentFor = mockMcContentFor;

/** Drive the whole pass: answer/grade per `policy`, return asked steps. */
function run(
  s: MockTestSession,
  policy: (n: number) => boolean
): { itemId: string; qtype: MockQuestionType }[] {
  const asked: { itemId: string; qtype: MockQuestionType }[] = [];
  let n = 0;
  while (!s.isComplete()) {
    if (asked.length > 200) throw new Error('test: runaway session');
    const step = s.current()!;
    const qtype = qtypeOf(step);
    asked.push({ itemId: step.item.id, qtype });
    const want = policy(n++);
    if (qtype === 'romance') {
      s.selfGrade(want);
    } else {
      const mc = mcContentFor(step.item, qtype);
      const wrong = (mc.answerIndex + 1) % mc.choices.length;
      const res = s.answerMc(want ? mc.answerIndex : wrong);
      expect(res.correct).toBe(want);
      expect(res.answerIndex).toBe(mc.answerIndex);
      s.advance();
    }
  }
  return asked;
}

describe('mock test: construction guards', () => {
  it('throws on service items — the food test covers plates only', () => {
    const [svc] = itemsForUnit('day-one');
    expect(() => createMockTestSession([svc], { rng: rng(1) })).toThrow(/dish/);
  });

  it('throws on an empty item list', () => {
    expect(() => createMockTestSession([], { rng: rng(1) })).toThrow();
  });
});

describe('mock test: one shuffled pass with a round-robin type wheel', () => {
  it('asks every dish exactly once; same seed → same order + types; different seed differs', () => {
    const a = run(createMockTestSession(DISHES, { rng: rng(9) }), () => true);
    const b = run(createMockTestSession(DISHES, { rng: rng(9) }), () => true);
    expect(a).toEqual(b);
    expect(a.map((x) => x.itemId).sort()).toEqual(DISHES.map((i) => i.id).sort());
    expect(a.map((x) => x.itemId)).not.toEqual(DISHES.map((i) => i.id)); // actually shuffled
    const c = run(createMockTestSession(DISHES, { rng: rng(10) }), () => true);
    expect(c).not.toEqual(a);
  });

  it('types cycle the rotation in asked order, with the documented fallbacks', () => {
    const asked = run(createMockTestSession(DISHES, { rng: rng(3) }), () => true);
    // Reconstruct the wheel: the first non-fallback-prone slot anchors the offset.
    const byId = new Map(DISHES.map((i) => [i.id, i]));
    let start = -1;
    for (const cand of MOCK_TYPE_ROTATION.keys()) {
      const ok = asked.every(({ itemId, qtype }, i) => {
        const wheel = MOCK_TYPE_ROTATION[(cand + i) % MOCK_TYPE_ROTATION.length];
        const expected =
          wheel === 'mods-mc' && !hasModsMc(byId.get(itemId)!) ? 'components-mc' : wheel;
        return qtype === expected;
      });
      if (ok) {
        start = cand;
        break;
      }
    }
    expect(start).toBeGreaterThanOrEqual(0); // exactly one offset explains the run
    // every distinct wheel type is genuinely asked across 41 dishes
    const seen = new Set(asked.map((x) => x.qtype));
    for (const t of ['components-mc', 'allergen-mc', 'safe-call', 'reverse-mc', 'romance', 'description-mc'])
      expect(seen.has(t as MockQuestionType), t).toBe(true);
    expect(seen.has('mods-mc')).toBe(true); // ~half the menu has authored rows
  });

  it('the wheel offset is per-run: some seed pair starts on different types', () => {
    const starts = new Set<MockQuestionType>();
    for (let seed = 1; seed <= 8; seed++) {
      const s = createMockTestSession(DISHES, { rng: rng(seed) });
      starts.add(qtypeOf(s.current()!));
    }
    expect(starts.size).toBeGreaterThan(1);
  });
});

describe('mock test: type assignment (pure helper)', () => {
  const four = DISHES.slice(0, 4);

  it('round-robins the rotation from the given offset', () => {
    const types = assignMockTypes(four, 2, PREDS);
    expect(types).toEqual([
      MOCK_TYPE_ROTATION[2],
      MOCK_TYPE_ROTATION[3],
      MOCK_TYPE_ROTATION[4],
      MOCK_TYPE_ROTATION[5]
    ]);
  });

  it('flagless and row-less dishes fall back to components-mc (the wheel keeps turning)', () => {
    // offset 1 → allergen-mc lands on index 0; safe-call on index 1; mods-mc on index 5
    const seven = DISHES.slice(0, 7);
    const noFlagFirst = { ...PREDS, hasAllergen: (item: JourneyItem) => item.id !== seven[0].id };
    const a = assignMockTypes(seven, 1, noFlagFirst);
    expect(a[0]).toBe('components-mc'); // allergen slot, no flags
    expect(a[1]).toBe('safe-call'); // flags fine on the rest
    const noMods = { ...PREDS, hasMods: () => false };
    const b = assignMockTypes(seven, 1, noMods);
    expect(b[5]).toBe('components-mc'); // mods slot, no authored row
    expect(b[0]).toBe('allergen-mc');
  });
});

describe('mock test: answering contract per step type', () => {
  it('MC steps: answerMc gives feedback, the step stays current, advance() resolves', () => {
    const s = createMockTestSession(DISHES, { rng: rng(3) });
    // walk to the first MC step
    while (qtypeOf(s.current()!) === 'romance') s.selfGrade(true);
    const step = s.current()!;
    const qtype = qtypeOf(step);
    const mc = mcContentFor(step.item, qtype);
    const before = s.progress().position;
    const res = s.answerMc(mc.answerIndex);
    expect(res).toEqual({ correct: true, answerIndex: mc.answerIndex });
    expect(s.current()).toEqual(step); // feedback screen — still current
    expect(() => s.answerMc(mc.answerIndex)).toThrow(/already answered/);
    expect(() => s.selfGrade(true)).toThrow(/answerMc/);
    s.advance();
    expect(s.progress().position).toBe(before + 1);
  });

  it('each MC variant validates against ITS accessor (a components answer can be an allergen miss)', () => {
    const s = createMockTestSession(DISHES, { rng: rng(3) });
    const seen = new Set<MockQuestionType>();
    while (!s.isComplete() && seen.size < 7) {
      const step = s.current()!;
      const qtype = qtypeOf(step);
      seen.add(qtype);
      if (qtype === 'romance') {
        s.selfGrade(true);
        continue;
      }
      const mc = mcContentFor(step.item, qtype);
      expect(s.answerMc(mc.answerIndex).correct, qtype).toBe(true);
      s.advance();
    }
    expect(seen.size).toBeGreaterThanOrEqual(6); // every wheel type reachable + answerable (mods may fall back per dish)
  });

  it('romance steps: selfGrade resolves; answerMc/advance throw on them', () => {
    const s = createMockTestSession(DISHES, { rng: rng(3) });
    while (qtypeOf(s.current()!) !== 'romance') {
      const step = s.current()!;
      const mc = mcContentFor(step.item, qtypeOf(step));
      s.answerMc(mc.answerIndex);
      s.advance();
    }
    expect(() => s.answerMc(0)).toThrow(/selfGrade/);
    expect(() => s.advance()).toThrow(/selfGrade/);
    const before = s.progress().position;
    s.selfGrade(false);
    expect(s.progress().position).toBe(before + 1);
    expect(s.progress().misses).toBe(1);
  });

  it('advance() before answering an MC throws; out-of-range choice throws', () => {
    const s = createMockTestSession(DISHES, { rng: rng(3) });
    while (qtypeOf(s.current()!) === 'romance') s.selfGrade(true);
    expect(() => s.advance()).toThrow(/answer the MC/);
    expect(() => s.answerMc(99)).toThrow(/out of range/);
    expect(() => s.answerMc(-1)).toThrow(/out of range/);
  });
});

describe('mock test: score, pass bar, summary breakdowns', () => {
  const items = DISHES.slice(0, 20);

  it('17/20 = 0.85 passes; 16/20 fails; misuse guards before completion', () => {
    const s = createMockTestSession(items, { rng: rng(5) });
    expect(() => s.score()).toThrow();
    expect(() => s.passed()).toThrow();
    expect(() => s.summary()).toThrow();
    run(s, (n) => n < 17);
    expect(s.score()).toBe(0.85);
    expect(s.passed()).toBe(true);
    expect(() => s.selfGrade(true)).toThrow(); // already complete
    expect(() => s.advance()).toThrow();

    const fail = createMockTestSession(items, { rng: rng(5) });
    run(fail, (n) => n < 16);
    expect(fail.score()).toBe(0.8);
    expect(fail.passed()).toBe(false);
  });

  it('summary: perItem in asked order; byType + byCategory add up; miss list named by id', () => {
    const s = createMockTestSession(items, { rng: rng(5) });
    const asked = run(s, (n) => n % 3 !== 0); // miss every third question
    const sum = s.summary();
    expect(sum.perItem.map((r) => r.itemId)).toEqual(asked.map((a) => a.itemId));
    expect(sum.perItem.map((r) => r.qtype)).toEqual(asked.map((a) => a.qtype));
    expect(sum.total).toBe(20);
    expect(sum.correct).toBe(sum.perItem.filter((r) => r.correct).length);

    // byType: all four keys, asked counts match the run, correct <= asked
    for (const t of MOCK_TYPE_ROTATION) {
      const expected = asked.filter((a) => a.qtype === t).length;
      expect(sum.byType[t].asked).toBe(expected);
      expect(sum.byType[t].correct).toBeLessThanOrEqual(sum.byType[t].asked);
    }
    expect(Object.values(sum.byType).reduce((n, b) => n + b.asked, 0)).toBe(20);
    expect(Object.values(sum.byType).reduce((n, b) => n + b.correct, 0)).toBe(sum.correct);

    // byCategory: caller (path) category order, totals add up, categories match teachFor
    const catOrder: string[] = [];
    for (const item of items) {
      const teach = teachFor(item);
      const cat = teach.kind === 'dish' ? teach.category : '';
      if (!catOrder.includes(cat)) catOrder.push(cat);
    }
    expect(sum.byCategory.map((c) => c.category)).toEqual(catOrder);
    expect(sum.byCategory.reduce((n, c) => n + c.asked, 0)).toBe(20);
    expect(sum.byCategory.reduce((n, c) => n + c.correct, 0)).toBe(sum.correct);
    for (const r of sum.perItem) {
      const item = items.find((i) => i.id === r.itemId)!;
      const teach = teachFor(item);
      expect(r.category).toBe(teach.kind === 'dish' ? teach.category : '');
    }

    // the miss list: missed ids in asked order
    expect(sum.missed).toEqual(sum.perItem.filter((r) => !r.correct).map((r) => r.itemId));
    expect(sum.missed.length).toBe(20 - sum.correct);
  });

  it('progress mid-run mirrors the checkpoint shape', () => {
    const four = DISHES.slice(0, 4);
    const s = createMockTestSession(four, { rng: rng(1) });
    expect(s.progress()).toEqual({ position: 0, total: 4, correct: 0, misses: 0 });
    const step = s.current()!;
    const qtype = qtypeOf(step);
    if (qtype === 'romance') s.selfGrade(true);
    else {
      s.answerMc(mcContentFor(step.item, qtype).answerIndex);
      expect(s.progress().position).toBe(0); // answered, not yet advanced
      s.advance();
    }
    expect(s.progress()).toEqual({ position: 1, total: 4, correct: 1, misses: 0 });
  });

  it('deps are optional (rng defaults to Math.random); NO SRS hooks exist by design', () => {
    const s = createMockTestSession(DISHES.slice(0, 4));
    const asked = run(s, () => true);
    expect(asked.map((a) => a.itemId).sort()).toEqual(
      DISHES.slice(0, 4)
        .map((i) => i.id)
        .sort()
    );
  });
});
