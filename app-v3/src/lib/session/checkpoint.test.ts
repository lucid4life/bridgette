// Task E — checkpoint ("Shift check"): one deterministically-shuffled graded
// pass, rung by kind (service → cued, dish → free), no teach, no recycling,
// NO SRS events (CheckpointDeps has no event hooks by design — the CALLER
// applies test-out effects from the summary). Pass at score >= 0.85.
import { describe, expect, it } from 'vitest';
import { allStage1Items, itemsForUnit } from '$lib/journey/items';
import {
  CHECKPOINT_PASS_RATIO,
  createCheckpointSession,
  type CheckpointSession
} from './index';
import { CHECKPOINT_PASS_RATIO as GATING_RATIO } from '$lib/journey/gating';

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

/** selfGrade through the whole pass with `policy`, returning asked item ids. */
function run(s: CheckpointSession, policy: (n: number) => boolean): string[] {
  const order: string[] = [];
  let n = 0;
  while (!s.isComplete()) {
    if (order.length > 200) throw new Error('test: runaway session');
    const step = s.current()!;
    expect(step.type).toBe('quiz');
    order.push(step.item.id);
    s.selfGrade(policy(n++));
  }
  return order;
}

describe('checkpoint: constant', () => {
  it('re-exports the same 0.85 ratio the gating module uses', () => {
    expect(CHECKPOINT_PASS_RATIO).toBe(0.85);
    expect(CHECKPOINT_PASS_RATIO).toBe(GATING_RATIO);
  });
});

describe('checkpoint: one shuffled graded pass', () => {
  const mixed = [...itemsForUnit('snacks'), ...itemsForUnit('day-one').slice(0, 4)];

  it('rungs by kind: service → cued, dish → free', () => {
    const s = createCheckpointSession(mixed, { rng: rng(9) });
    while (!s.isComplete()) {
      const step = s.current()!;
      if (step.type !== 'quiz') throw new Error(`test: expected a quiz step, got ${step.type}`);
      expect(step.rung).toBe(step.item.kind === 'service' ? 'cued' : 'free');
      s.selfGrade(true);
    }
  });

  it('same seed → same order; order is a permutation, not the input order', () => {
    const order1 = run(createCheckpointSession(mixed, { rng: rng(9) }), () => true);
    const order2 = run(createCheckpointSession(mixed, { rng: rng(9) }), () => true);
    expect(order1).toEqual(order2);
    expect([...order1].sort()).toEqual(mixed.map((i) => i.id).sort());
    expect(order1).not.toEqual(mixed.map((i) => i.id)); // actually shuffled (seed 9)
    const order3 = run(createCheckpointSession(mixed, { rng: rng(10) }), () => true);
    expect(order3).not.toEqual(order1);
  });

  it('no recycling: every item is asked exactly once even when all are missed', () => {
    const s = createCheckpointSession(mixed, { rng: rng(11) });
    const order = run(s, () => false);
    expect(order).toHaveLength(mixed.length);
    expect(new Set(order).size).toBe(mixed.length);
    expect(s.isComplete()).toBe(true);
    expect(s.score()).toBe(0);
    expect(s.passed()).toBe(false);
  });
});

describe('checkpoint: score and pass math at the 0.85 boundary', () => {
  const items = allStage1Items().slice(0, 20);

  function runWithCorrect(nCorrect: number): CheckpointSession {
    const s = createCheckpointSession(items, { rng: rng(5) });
    run(s, (n) => n < nCorrect);
    return s;
  }

  it('17/20 = 0.85 passes; 16/20 = 0.80 fails', () => {
    const pass = runWithCorrect(17);
    expect(pass.score()).toBe(0.85);
    expect(pass.passed()).toBe(true);
    const fail = runWithCorrect(16);
    expect(fail.score()).toBe(0.8);
    expect(fail.passed()).toBe(false);
  });

  it('summary carries per-item results in asked order plus the totals', () => {
    const s = createCheckpointSession(items, { rng: rng(5) });
    const order = run(s, (n) => n < 17);
    const summary = s.summary();
    expect(summary.perItem.map((r) => r.itemId)).toEqual(order);
    expect(summary.perItem.filter((r) => r.correct)).toHaveLength(17);
    for (const r of summary.perItem) {
      const item = items.find((i) => i.id === r.itemId)!;
      expect(r.rung).toBe(item.kind === 'service' ? 'cued' : 'free');
    }
    expect(summary).toMatchObject({ correct: 17, total: 20, score: 0.85, passed: true });
  });

  it('all correct → score 1', () => {
    const s = runWithCorrect(20);
    expect(s.score()).toBe(1);
    expect(s.passed()).toBe(true);
  });
});

describe('checkpoint: progress + API misuse', () => {
  const items = itemsForUnit('snacks'); // 4 dish items

  it('progress mid-run', () => {
    const s = createCheckpointSession(items, { rng: rng(1) });
    expect(s.progress()).toEqual({ position: 0, total: 4, correct: 0, misses: 0 });
    s.selfGrade(true);
    s.selfGrade(false);
    expect(s.progress()).toEqual({ position: 2, total: 4, correct: 1, misses: 1 });
  });

  it('score/passed/summary are final-only; answerMc/advance never apply', () => {
    const s = createCheckpointSession(items, { rng: rng(1) });
    expect(() => s.score()).toThrow();
    expect(() => s.passed()).toThrow();
    expect(() => s.summary()).toThrow();
    expect(() => s.answerMc(0)).toThrow(); // checkpoints have no MC steps
    expect(() => s.advance()).toThrow(); // every step resolves via selfGrade
    run(s, () => true);
    expect(() => s.selfGrade(true)).toThrow(); // already complete
  });

  it('deps are optional (rng defaults to Math.random)', () => {
    const s = createCheckpointSession(items);
    expect(run(s, () => true).sort()).toEqual(items.map((i) => i.id).sort());
  });

  it('an empty checkpoint throws — pass/fail over nothing is undefined', () => {
    expect(() => createCheckpointSession([])).toThrow();
  });
});
