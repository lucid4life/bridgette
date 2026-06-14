// Task E — learn session: pretest (no events) → teach (unit order) → quiz
// (test-to-criterion ladder mc → cued → free; misses recycle ~3 positions
// later; graduation emits onIntroduce + onResult with the hard/good split).
import { describe, expect, it } from 'vitest';
import { itemsForUnit, mcFor } from '$lib/journey/items';
import { createLearnSession, type LearnSession, type Step } from './index';

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

function logging(seed = 1) {
  const calls: string[] = [];
  const deps = {
    onIntroduce: (id: string) => calls.push(`introduce:${id}`),
    onResult: (id: string, grade: string) => calls.push(`result:${id}:${grade}`),
    rng: rng(seed)
  };
  return { calls, deps };
}

/** Answer the current MC step (pretest or quiz) and advance past the reveal. */
function answerMc(s: LearnSession, correct: boolean): void {
  const step = s.current();
  if (!step || (step.type !== 'pretest-mc' && !(step.type === 'quiz' && step.rung === 'mc')))
    throw new Error(`test: expected an MC step, got ${step?.type}`);
  const mc = mcFor(step.item, step.round ?? 0); // grade the round the session serves
  const idx = correct ? mc.answerIndex : (mc.answerIndex + 1) % mc.choices.length;
  const res = s.answerMc(idx);
  expect(res).toEqual({ correct, answerIndex: mc.answerIndex });
  s.advance();
}

/** Run the session to completion under `policy`; returns every step seen. */
function drive(s: LearnSession, policy: (step: Step) => boolean, cap = 500): Step[] {
  const seen: Step[] = [];
  while (!s.isComplete()) {
    if (seen.length > cap) throw new Error('test: runaway session');
    const step = s.current()!;
    seen.push(step);
    if (step.type === 'teach' || step.type === 'reteach') {
      s.advance();
      continue;
    }
    const ok = policy(step);
    if (step.rung === 'mc') answerMc(s, ok);
    else s.selfGrade(ok);
  }
  return seen;
}

describe('learn session: full single-item walkthrough', () => {
  it('runs pretest (no events, even on a miss) → teach → mc → cued → free → graduate good', () => {
    const items = itemsForUnit('snacks').slice(0, 1); // dish:french-fries
    const { calls, deps } = logging();
    const s = createLearnSession(items, deps);
    const mc = mcFor(items[0], 0); // pretest is round 0

    // pretest: deliberately wrong — errorful generation, NO events, no 'hard' later
    let step = s.current()!;
    expect(step).toEqual({ type: 'pretest-mc', item: items[0], rung: 'mc' });
    const res = s.answerMc((mc.answerIndex + 1) % mc.choices.length);
    expect(res).toEqual({ correct: false, answerIndex: mc.answerIndex });
    expect(calls).toEqual([]);
    expect(s.current()).toEqual(step); // stable until advance() past the reveal
    s.advance();

    // teach
    step = s.current()!;
    expect(step).toEqual({ type: 'teach', item: items[0] });
    expect(calls).toEqual([]);
    s.advance();

    // quiz ladder — first quiz-mc is round 1 (pretest was round 0), so a fresh question
    expect(s.current()).toEqual({ type: 'quiz', item: items[0], rung: 'mc', round: 1 });
    const mcQuiz = mcFor(items[0], 1);
    s.answerMc(mcQuiz.answerIndex);
    s.advance();
    expect(s.current()).toEqual({ type: 'quiz', item: items[0], rung: 'cued' });
    expect(calls).toEqual([]); // nothing until graduation
    s.selfGrade(true);
    expect(s.current()).toEqual({ type: 'quiz', item: items[0], rung: 'free' });
    s.selfGrade(true);

    // graduation: introduce THEN result, 'good' (pretest miss does not count)
    expect(calls).toEqual(['introduce:dish:french-fries', 'result:dish:french-fries:good']);
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(s.summary()).toEqual({
      perItem: [{ itemId: 'dish:french-fries', misses: 0, grade: 'good' }],
      graduated: 1,
      misses: 0
    });
  });
});

describe('learn session: phases and ordering', () => {
  it('pretest and teach run once per item in unit order; quiz is an rng permutation climbing mc→cued→free', () => {
    const items = itemsForUnit('snacks'); // 4 items
    const ids = items.map((i) => i.id);
    const { calls, deps } = logging(42);
    const s = createLearnSession(items, deps);
    const seen = drive(s, () => true);

    // strict phase order: all pretest, then all teach, then all quiz
    const types = seen.map((st) => st.type);
    expect(types).toEqual([
      ...Array(4).fill('pretest-mc'),
      ...Array(4).fill('teach'),
      ...Array(12).fill('quiz')
    ]);

    // pretest + teach in unit order
    expect(seen.slice(0, 4).map((st) => st.item.id)).toEqual(ids);
    expect(seen.slice(4, 8).map((st) => st.item.id)).toEqual(ids);

    // quiz: first pass is a permutation of the items, all at mc
    const quizSteps = seen.slice(8);
    const firstPass = quizSteps.slice(0, 4);
    expect(firstPass.every((st) => st.type === 'quiz' && st.rung === 'mc')).toBe(true);
    expect(firstPass.map((st) => st.item.id).sort()).toEqual([...ids].sort());

    // each item climbs exactly mc → cued → free
    const ladders = new Map<string, string[]>();
    for (const st of quizSteps) {
      if (st.type !== 'quiz') continue;
      ladders.set(st.item.id, [...(ladders.get(st.item.id) ?? []), st.rung]);
    }
    for (const id of ids) expect(ladders.get(id), id).toEqual(['mc', 'cued', 'free']);

    // events: one introduce + one 'good' per item, introduce first
    expect(calls).toHaveLength(8);
    for (const id of ids) {
      const intro = calls.indexOf(`introduce:${id}`);
      const result = calls.indexOf(`result:${id}:good`);
      expect(intro, id).toBeGreaterThanOrEqual(0);
      expect(result, id).toBe(intro + 1);
    }
    expect(s.isComplete()).toBe(true);
  });
});

describe('learn session: miss recycling', () => {
  it('a missed item keeps its rung and reappears after exactly 3 other steps', () => {
    const s = createLearnSession(itemsForUnit('small-plates'), logging(7).deps); // 7 items
    while (s.current()!.type === 'pretest-mc') answerMc(s, true);
    while (s.current()!.type === 'teach') s.advance();

    const missed = s.current()!;
    expect(missed.type).toBe('quiz');
    answerMc(s, false);

    for (let k = 0; k < 3; k++) {
      const st = s.current()!;
      expect(st.type).toBe('quiz');
      expect(st.item.id).not.toBe(missed.item.id);
      answerMc(s, true); // all still on the mc first pass
    }
    const again = s.current()!;
    // same rung; round bumped to 2 (1 + the one miss) → a different question
    expect(again).toEqual({ type: 'quiz', item: missed.item, rung: 'mc', round: 2 });
  });

  it('recycles to the end of the queue when fewer than 3 steps remain', () => {
    const s = createLearnSession(itemsForUnit('snacks').slice(0, 2), logging(2).deps);
    while (s.current()!.type === 'pretest-mc') answerMc(s, true);
    while (s.current()!.type === 'teach') s.advance();

    const first = s.current()!;
    answerMc(s, false); // only 1 other entry → goes to the end
    const other = s.current()!;
    expect(other.item.id).not.toBe(first.item.id);
    answerMc(s, true); // other advances to cued and re-queues at the end
    expect(s.current()).toEqual({ type: 'quiz', item: first.item, rung: 'mc', round: 2 }); // back after its miss
  });
});

describe('learn session: graduation grades', () => {
  it("an item that missed during the quiz graduates 'hard'; clean items graduate 'good'", () => {
    const items = itemsForUnit('snacks').slice(0, 2);
    const { calls, deps } = logging(3);
    const s = createLearnSession(items, deps);
    let missedOnce = false;
    drive(s, (step) => {
      if (step.type === 'quiz' && step.item.id === items[0].id && step.rung === 'cued' && !missedOnce) {
        missedOnce = true;
        return false;
      }
      return true;
    });
    expect(calls.filter((c) => c.startsWith('introduce:'))).toHaveLength(2);
    expect(calls).toContain(`result:${items[0].id}:hard`);
    expect(calls).toContain(`result:${items[1].id}:good`);
    const summary = s.summary();
    expect(summary.perItem.find((r) => r.itemId === items[0].id)).toEqual({
      itemId: items[0].id,
      misses: 1,
      grade: 'hard'
    });
    expect(summary.misses).toBe(1);
  });

  it("pretest misses never count toward 'hard'", () => {
    const items = itemsForUnit('snacks').slice(0, 2);
    const { calls, deps } = logging(4);
    const s = createLearnSession(items, deps);
    drive(s, (step) => step.type !== 'pretest-mc'); // miss EVERY pretest, ace the quiz
    expect(calls.filter((c) => c.includes(':good'))).toHaveLength(2);
    expect(calls.filter((c) => c.includes(':hard'))).toHaveLength(0);
  });
});

describe('learn session: finishability', () => {
  it('completes under repeated misses (2 misses per item per rung) — no infinite loop', () => {
    const items = itemsForUnit('snacks'); // 4 items
    const { calls, deps } = logging(5);
    const s = createLearnSession(items, deps);
    const missCount = new Map<string, number>();
    const seen = drive(s, (step) => {
      if (step.type !== 'quiz') return true;
      const key = `${step.item.id}:${step.rung}`;
      const n = missCount.get(key) ?? 0;
      if (n < 2) {
        missCount.set(key, n + 1);
        return false;
      }
      return true;
    });
    expect(s.isComplete()).toBe(true);
    // 4 pretest + 4 teach + (3 rungs × 3 attempts × 4 items) quiz steps
    expect(seen).toHaveLength(4 + 4 + 36);
    expect(s.progress().misses).toBe(24);
    expect(calls.filter((c) => c.endsWith(':hard'))).toHaveLength(4);
    for (const r of s.summary().perItem) expect(r.misses).toBe(6);
  });
});

describe('learn session: determinism', () => {
  function trace(seed: number): string[] {
    const { calls, deps } = logging(seed);
    const s = createLearnSession(itemsForUnit('small-plates'), deps);
    let n = 0;
    const seen = drive(s, () => n++ % 3 !== 0); // deterministic mixed policy
    return [
      ...seen.map((st) => `${st.type}:${'rung' in st ? st.rung : '-'}:${st.item.id}`),
      ...calls
    ];
  }

  it('same seed → identical step sequence and identical events', () => {
    expect(trace(123)).toEqual(trace(123));
  });

  it('different seeds → different quiz order', () => {
    expect(trace(123)).not.toEqual(trace(456));
  });
});

describe('learn session: progress accounting', () => {
  it('total = position + minimum remaining steps; each miss grows it by 1', () => {
    const items = itemsForUnit('snacks'); // 4 → 4 pretest + 4 teach + 12 quiz = 20
    const s = createLearnSession(items, logging(6).deps);
    expect(s.progress()).toEqual({ position: 0, total: 20, graduated: 0, misses: 0 });
    answerMc(s, true);
    expect(s.progress()).toEqual({ position: 1, total: 20, graduated: 0, misses: 0 });
    while (s.current()!.type === 'pretest-mc') answerMc(s, false); // pretest errors are NOT misses
    while (s.current()!.type === 'teach') s.advance();
    expect(s.progress()).toEqual({ position: 8, total: 20, graduated: 0, misses: 0 });
    answerMc(s, false); // quiz miss: step taken, no rung climbed
    expect(s.progress()).toEqual({ position: 9, total: 21, graduated: 0, misses: 1 });
  });
});

describe('learn session: API misuse throws', () => {
  it('guards every wrong call for the current step type', () => {
    const items = itemsForUnit('snacks').slice(0, 1);
    const s = createLearnSession(items, logging(8).deps);

    // pretest-mc step
    expect(() => s.advance()).toThrow(); // unanswered MC
    expect(() => s.selfGrade(true)).toThrow(); // not self-graded
    expect(() => s.answerMc(99)).toThrow(); // out of range
    s.answerMc(0);
    expect(() => s.answerMc(0)).toThrow(); // double answer
    s.advance();

    // teach step
    expect(() => s.answerMc(0)).toThrow();
    expect(() => s.selfGrade(true)).toThrow();
    s.advance();

    // quiz mc step
    expect(() => s.selfGrade(true)).toThrow();
    answerMc(s, true);

    // quiz cued step
    expect(() => s.answerMc(0)).toThrow();
    expect(() => s.advance()).toThrow(); // cued resolves via selfGrade
    expect(() => s.summary()).toThrow(); // not complete yet
    s.selfGrade(true);
    s.selfGrade(true); // free → graduates → complete

    expect(s.isComplete()).toBe(true);
    expect(() => s.advance()).toThrow();
    expect(() => s.answerMc(0)).toThrow();
    expect(() => s.selfGrade(true)).toThrow();
  });

  it('an empty item list is complete immediately', () => {
    const s = createLearnSession([], logging(9).deps);
    expect(s.isComplete()).toBe(true);
    expect(s.current()).toBeNull();
    expect(s.progress()).toEqual({ position: 0, total: 0, graduated: 0, misses: 0 });
    expect(s.summary()).toEqual({ perItem: [], graduated: 0, misses: 0 });
  });
});
