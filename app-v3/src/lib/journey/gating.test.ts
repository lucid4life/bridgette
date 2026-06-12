// Task D — gating: sequential unit unlocks, 85% criterion, test-out, stage progress.
// Pure over a minimal ProgressView — no store import.
import { describe, expect, it } from 'vitest';
import type { Rank } from '$lib/srs/scheduler';
import type { ProgressView } from './types';
import { itemsForUnit } from './items';
import {
  CHECKPOINT_PASS_RATIO,
  UNIT_PASS_RATIO,
  stageProgress,
  stageStatus,
  testOutAvailable,
  unitComplete,
  unitStatus
} from './gating';

function view(
  ranks: Record<string, Rank> = {},
  unitDone: ProgressView['unitDone'] = {}
): ProgressView {
  return { rankOf: (id) => ranks[id] ?? 'new', unitDone };
}

/** ranks map putting the first `n` items of `unitId` at `rank`. */
function ranked(unitId: string, n: number, rank: Rank = 'learning'): Record<string, Rank> {
  const out: Record<string, Rank> = {};
  for (const item of itemsForUnit(unitId).slice(0, n)) out[item.id] = rank;
  return out;
}

/** A view where the given units are complete via recorded gate passes. */
function doneUnits(...unitIds: string[]): ProgressView {
  return view({}, Object.fromEntries(unitIds.map((u) => [u, 'gate' as const])));
}

const LESSONS = [
  'day-one',
  'snacks',
  'snacks-2',
  'small-plates',
  'vegetables',
  'pizza',
  'pasta',
  'mains',
  'dessert'
];

describe('constants', () => {
  it('pass ratios are 0.85', () => {
    expect(UNIT_PASS_RATIO).toBe(0.85);
    expect(CHECKPOINT_PASS_RATIO).toBe(0.85);
  });
});

describe('unitComplete', () => {
  it('fresh unit is not complete', () => {
    expect(unitComplete('day-one', view())).toBe(false);
  });

  it('needs >=85% of items at rank >= learning (14/16 yes, 13/16 no)', () => {
    expect(unitComplete('day-one', view(ranked('day-one', 13)))).toBe(false);
    expect(unitComplete('day-one', view(ranked('day-one', 14)))).toBe(true);
  });

  it('solid / locked-in ranks count toward the criterion', () => {
    expect(unitComplete('snacks', view(ranked('snacks', 4, 'solid')))).toBe(true);
    expect(unitComplete('dessert', view(ranked('dessert', 3, 'locked-in')))).toBe(true);
  });

  it('a recorded unitDone short-circuits (gate or test-out)', () => {
    expect(unitComplete('pizza', view({}, { pizza: 'gate' }))).toBe(true);
    expect(unitComplete('pizza', view({}, { pizza: 'test-out' }))).toBe(true);
  });
});

describe('unitStatus: sequential path', () => {
  it('fresh path: first unit available, the rest locked', () => {
    const v = view();
    expect(unitStatus('day-one', v)).toBe('available');
    for (const u of LESSONS.slice(1)) expect(unitStatus(u, v), u).toBe('locked');
    expect(unitStatus('checkpoint-food', v)).toBe('locked');
  });

  it('locked -> available -> started -> complete', () => {
    expect(unitStatus('snacks', view())).toBe('locked');
    const open = doneUnits('day-one');
    expect(unitStatus('snacks', open)).toBe('available');
    const started = view(ranked('snacks', 1), { 'day-one': 'gate' });
    expect(unitStatus('snacks', started)).toBe('started');
    const done = view(ranked('snacks', 4), { 'day-one': 'gate' });
    expect(unitStatus('snacks', done)).toBe('complete');
  });

  it('completing unit N opens unit N+1', () => {
    const v = doneUnits('day-one', 'snacks');
    expect(unitStatus('snacks-2', v)).toBe('available');
    expect(unitStatus('small-plates', v)).toBe('locked');
  });

  it('a test-out mid-path completes that unit and opens the next', () => {
    const v = view({}, { 'small-plates': 'test-out' });
    expect(unitStatus('small-plates', v)).toBe('complete');
    expect(unitStatus('vegetables', v)).toBe('available');
    expect(unitStatus('snacks', v)).toBe('locked'); // earlier units untouched
  });
});

describe('unitStatus: checkpoint', () => {
  it('stays locked until ALL 9 lesson units are complete', () => {
    expect(unitStatus('checkpoint-food', doneUnits(...LESSONS.slice(0, 8)))).toBe('locked');
    expect(unitStatus('checkpoint-food', doneUnits(...LESSONS))).toBe('available');
  });

  it('completes via a recorded pass', () => {
    const v = view({}, Object.fromEntries([...LESSONS, 'checkpoint-food'].map((u) => [u, 'gate' as const])));
    expect(unitStatus('checkpoint-food', v)).toBe('complete');
  });

  it('NEVER completes via the ratio — only a sat shift check (unitDone) counts', () => {
    // every lesson at criterion AND all 57 ranks >= learning: the checkpoint's
    // item set is mathematically at 100%, but the shift check was never taken
    const ranks: Record<string, Rank> = {};
    for (const u of LESSONS) for (const item of itemsForUnit(u)) ranks[item.id] = 'learning';
    const v = view(ranks);
    for (const u of LESSONS) expect(unitComplete(u, v), u).toBe(true);
    expect(unitComplete('checkpoint-food', v)).toBe(false);
    expect(unitStatus('checkpoint-food', v)).toBe('available'); // offered, not complete
    // the recorded pass is the ONLY way through
    const sat = view(ranks, { 'checkpoint-food': 'gate' });
    expect(unitComplete('checkpoint-food', sat)).toBe(true);
    expect(unitStatus('checkpoint-food', sat)).toBe('complete');
  });
});

describe('testOutAvailable', () => {
  it('any unit of the unlocked stage can be tested out of, any time', () => {
    const v = view();
    for (const u of [...LESSONS, 'checkpoint-food']) expect(testOutAvailable(u, v), u).toBe(true);
  });

  it('stage test-out is always offered while the stage is unlocked', () => {
    expect(testOutAvailable('food-runner', view())).toBe(true);
  });

  it('not offered for completed units, completed stages, or locked stages', () => {
    expect(testOutAvailable('snacks', view({}, { snacks: 'test-out' }))).toBe(false);
    expect(testOutAvailable('wine', view())).toBe(false);
    const allDone = doneUnits(...LESSONS, 'checkpoint-food');
    expect(testOutAvailable('food-runner', allDone)).toBe(false);
  });
});

describe('stageStatus', () => {
  it('food-runner is unlocked from the start; later stages locked (Phase 1)', () => {
    const v = view();
    expect(stageStatus('food-runner', v)).toBe('available');
    for (const s of ['allergen-guardian', 'behind-the-bar', 'wine', 'pairings'])
      expect(stageStatus(s, v), s).toBe('locked');
  });

  it('started once any item moves past new; complete when every unit is', () => {
    expect(stageStatus('food-runner', view(ranked('day-one', 1)))).toBe('started');
    expect(stageStatus('food-runner', doneUnits(...LESSONS, 'checkpoint-food'))).toBe('complete');
  });
});

describe('stageProgress', () => {
  it('fresh stage: 0 of 57', () => {
    expect(stageProgress('food-runner', view())).toEqual({
      itemsAtCriterion: 0,
      totalItems: 57,
      ratio: 0
    });
  });

  it('counts unique items at rank >= learning', () => {
    const ranks = { ...ranked('day-one', 16), ...ranked('snacks', 2, 'solid') };
    const p = stageProgress('food-runner', view(ranks));
    expect(p.itemsAtCriterion).toBe(18);
    expect(p.totalItems).toBe(57);
    expect(p.ratio).toBeCloseTo(18 / 57);
  });

  it('locked stages report empty progress (no NaN)', () => {
    expect(stageProgress('wine', view())).toEqual({ itemsAtCriterion: 0, totalItems: 0, ratio: 0 });
  });
});
