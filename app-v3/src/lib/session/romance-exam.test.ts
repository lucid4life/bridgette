// "The Romance Exam" — the scored simulator of Monday night's MENU test. Every
// dish, cold, one pass: say the name + the dish + (up to) 3 components OUT LOUD,
// then a STRUCTURED self-check (named? + how many official components did you
// actually say?) graded to the real bar: name + min(3, components). Checkpoint
// semantics — one rng-shuffled pass, NO recycling, NO SRS events (it READS
// readiness, never penalizes). summary() reports the readiness %, the per-
// category breakdown, and the shaky dishes for a one-tap re-drill.
import { describe, expect, it } from 'vitest';
import { allStage1Items, itemsForUnit, romanceFor } from '$lib/journey/items';
import type { JourneyItem } from '$lib/journey/types';
import {
  CHECKPOINT_PASS_RATIO,
  createRomanceExamSession,
  requiredComponents,
  type RomanceExamOutcome,
  type RomanceExamSession
} from './index';

// mulberry32 — deterministic rng for tests (matches mock-test.test.ts).
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

/** Drive the whole pass: grade each asked dish via `outcomeFor`, return asked ids. */
function run(
  s: RomanceExamSession,
  outcomeFor: (item: JourneyItem, n: number) => RomanceExamOutcome
): string[] {
  const asked: string[] = [];
  while (!s.isComplete()) {
    if (asked.length > 200) throw new Error('test: runaway session');
    const step = s.current()!;
    asked.push(step.item.id);
    s.grade(outcomeFor(step.item, asked.length - 1));
  }
  return asked;
}

const clean = (): RomanceExamOutcome => ({ named: true, componentsHit: 3 });

describe('romance exam: construction guards', () => {
  it('throws over an empty roster — a readiness % over nothing is undefined', () => {
    expect(() => createRomanceExamSession([], { rng: rng(1) })).toThrow();
  });
  it('throws on a service item — the exam covers plates only', () => {
    const [svc] = itemsForUnit('day-one');
    expect(() => createRomanceExamSession([svc], { rng: rng(1) })).toThrow(/dish/);
  });
});

describe('romance exam: the pass bar is name + min(3, official components)', () => {
  it('requiredComponents matches the romance pass-bar length for every dish', () => {
    for (const d of DISHES) {
      expect(requiredComponents(d)).toBe(romanceFor(d).romanceTargets.length);
      expect(requiredComponents(d)).toBeGreaterThanOrEqual(1);
      expect(requiredComponents(d)).toBeLessThanOrEqual(3);
    }
  });
});

describe('romance exam: one cold pass, no recycling', () => {
  it('asks every dish exactly once and the total never grows', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(2) });
    expect(s.progress().total).toBe(DISHES.length);
    expect(s.progress().position).toBe(0);
    const asked = run(s, () => ({ named: false, componentsHit: 0 })); // every miss
    expect(asked.length).toBe(DISHES.length);
    expect(new Set(asked).size).toBe(DISHES.length); // no dish asked twice
    expect(s.progress().total).toBe(DISHES.length); // unchanged despite all misses
    expect(s.isComplete()).toBe(true);
  });
});

describe('romance exam: grades to the exact bar', () => {
  it('a clean run (named + every required component) is 100% ready', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(3) });
    run(s, (item) => ({ named: true, componentsHit: requiredComponents(item) }));
    const sum = s.summary();
    expect(sum.clean).toBe(DISHES.length);
    expect(sum.missed).toEqual([]);
    expect(sum.score).toBe(1);
    expect(sum.passed).toBe(true);
  });

  it('over-delivering components still passes (hit > required)', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(4) });
    run(s, () => ({ named: true, componentsHit: 99 }));
    expect(s.summary().clean).toBe(DISHES.length);
  });

  it('missing the NAME fails the dish even with every component', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(5) });
    run(s, (item) => ({ named: false, componentsHit: requiredComponents(item) }));
    const sum = s.summary();
    expect(sum.clean).toBe(0);
    expect(sum.missed.length).toBe(DISHES.length);
    expect(sum.passed).toBe(false);
  });

  it('one component short of the bar fails the dish', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(6) });
    run(s, (item) => ({ named: true, componentsHit: requiredComponents(item) - 1 }));
    expect(s.summary().clean).toBe(0);
  });

  it('per-item result records named, componentsHit, required, and the pass call', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(7) });
    // pass even-asked dishes cleanly, fail odd-asked by one component
    run(s, (item, n) =>
      n % 2 === 0
        ? { named: true, componentsHit: requiredComponents(item) }
        : { named: true, componentsHit: requiredComponents(item) - 1 }
    );
    const sum = s.summary();
    for (const r of sum.perItem) {
      expect(r.required).toBe(requiredComponents(DISHES.find((d) => d.id === r.itemId)!));
      expect(r.passed).toBe(r.named && r.componentsHit >= r.required);
    }
    const expectedClean = sum.perItem.filter((_, i) => i % 2 === 0).length;
    expect(sum.clean).toBe(expectedClean);
    expect(sum.missed).toEqual(sum.perItem.filter((r) => !r.passed).map((r) => r.itemId));
  });
});

describe('romance exam: readiness % + pass bar', () => {
  it('score is clean / total and passed() uses the 0.85 bar', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(8) });
    // pass exactly the first 90% of asked dishes
    const cutoff = Math.floor(DISHES.length * 0.9);
    run(s, (item, n) =>
      n < cutoff
        ? { named: true, componentsHit: requiredComponents(item) }
        : { named: false, componentsHit: 0 }
    );
    const sum = s.summary();
    expect(sum.score).toBeCloseTo(cutoff / DISHES.length, 5);
    expect(sum.passed).toBe(sum.score >= CHECKPOINT_PASS_RATIO);
  });
});

describe('romance exam: byCategory breakdown', () => {
  it('counts asked + clean per menu category, in menu order, summing to the total', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(9) });
    run(s, (item, n) => ({ named: true, componentsHit: n % 2 === 0 ? requiredComponents(item) : 0 }));
    const sum = s.summary();
    const askedSum = sum.byCategory.reduce((a, c) => a + c.asked, 0);
    const cleanSum = sum.byCategory.reduce((a, c) => a + c.clean, 0);
    expect(askedSum).toBe(DISHES.length);
    expect(cleanSum).toBe(sum.clean);
    // menu order = the order categories first appear among the caller's items
    const menuOrder: string[] = [];
    for (const d of DISHES) {
      const cat = romanceFor(d).category;
      if (!menuOrder.includes(cat)) menuOrder.push(cat);
    }
    expect(sum.byCategory.map((c) => c.category)).toEqual(menuOrder);
  });
});

describe('romance exam: progress() during the run', () => {
  it('tracks position, fixed total, correct-so-far and misses', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(10) });
    let seen = 0;
    while (!s.isComplete()) {
      const p = s.progress();
      expect(p.total).toBe(DISHES.length);
      expect(p.position).toBe(seen);
      expect(p.correct + p.misses).toBe(seen);
      const item = s.current()!.item;
      s.grade({ named: true, componentsHit: seen % 2 === 0 ? requiredComponents(item) : 0 });
      seen += 1;
    }
    const p = s.progress();
    expect(p.position).toBe(DISHES.length);
    expect(p.correct).toBe(s.summary().clean);
  });
});

describe('romance exam: no SRS — never penalizes', () => {
  it('runs to completion with no event deps at all', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(11) });
    expect(() => run(s, clean)).not.toThrow();
    expect(s.summary().clean).toBe(DISHES.length);
  });
});

describe('romance exam: deterministic per injected rng', () => {
  it('the same seed deals the same asking order', () => {
    const a = createRomanceExamSession(DISHES, { rng: rng(12) });
    const b = createRomanceExamSession(DISHES, { rng: rng(12) });
    expect(run(a, clean)).toEqual(run(b, clean));
  });
});

describe('romance exam: misuse throws', () => {
  it('grade() past the end throws', () => {
    const s = createRomanceExamSession([DISHES[0]], { rng: rng(13) });
    s.grade(clean());
    expect(() => s.grade(clean())).toThrow(/complete/);
  });
  it('summary()/score()/passed() before completion throw', () => {
    const s = createRomanceExamSession(DISHES, { rng: rng(14) });
    expect(() => s.summary()).toThrow();
    expect(() => s.score()).toThrow();
    expect(() => s.passed()).toThrow();
  });
});
