// Task B — FSRS scheduler + named ranks (spec: docs/handoffs/2026-06-11-v3-phase1-spec.md).
// The SRS schedules ITEMS (knowledge units), not UI cards. The UI shows ranks only.
import { describe, expect, it } from 'vitest';
import {
  LOCKED_IN_MIN_DAYS,
  SOLID_MIN_DAYS,
  dueAt,
  isDue,
  newItemSrs,
  rankOf,
  reviewItem,
  type Grade,
  type ItemSrs,
  type Rank
} from './scheduler';

const T0 = new Date('2026-06-11T15:00:00.000Z');
const MIN = 60_000;
const DAY = 86_400_000;

const RANK_ORDER: Rank[] = ['new', 'learning', 'solid', 'locked-in'];
const rankIndex = (s: ItemSrs) => RANK_ORDER.indexOf(rankOf(s));

/** Review at the exact moment the item comes due; returns new state + the interval (ms) it scheduled. */
function reviewAtDue(s: ItemSrs, grade: Grade): { next: ItemSrs; interval: number } {
  const at = dueAt(s);
  const next = reviewItem(s, grade, at);
  return { next, interval: dueAt(next).getTime() - at.getTime() };
}

/** Grade 'good' n times, always exactly on time. */
function runGoods(n: number, from: ItemSrs = newItemSrs(T0)): { s: ItemSrs; intervals: number[] } {
  let s = from;
  const intervals: number[] = [];
  for (let i = 0; i < n; i++) {
    const { next, interval } = reviewAtDue(s, 'good');
    intervals.push(interval);
    s = next;
  }
  return { s, intervals };
}

/** A hand-built reviewed item whose current scheduled interval is `days` (rankOf is a pure threshold fn). */
function withIntervalDays(days: number, reps = 5): ItemSrs {
  return {
    ...newItemSrs(T0),
    reps,
    last_review: T0.getTime(),
    due: T0.getTime() + days * DAY
  };
}

describe('newItemSrs', () => {
  it('starts at rank new with zero counters, due immediately', () => {
    const s = newItemSrs(T0);
    expect(rankOf(s)).toBe('new');
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(0);
    expect(isDue(s, T0)).toBe(true);
    expect(dueAt(s).getTime()).toBe(T0.getTime());
  });

  it('is plain JSON — every field a number, no Date objects, lossless round-trip', () => {
    const s = newItemSrs(T0);
    for (const v of Object.values(s)) {
      if (v !== undefined) expect(typeof v).toBe('number');
    }
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe('first reviews (short-term steps)', () => {
  it("a brand-new item's first 'good' lands due within the same session (≤15 min)", () => {
    const s1 = reviewItem(newItemSrs(T0), 'good', T0);
    const wait = dueAt(s1).getTime() - T0.getTime();
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(15 * MIN);
    expect(isDue(s1, T0)).toBe(false);
    expect(isDue(s1, new Date(T0.getTime() + 15 * MIN))).toBe(true);
    expect(rankOf(s1)).toBe('learning');
    expect(s1.reps).toBe(1);
  });

  it("'again' on a new item recycles within minutes and is not a lapse", () => {
    const s1 = reviewItem(newItemSrs(T0), 'again', T0);
    expect(dueAt(s1).getTime() - T0.getTime()).toBeLessThanOrEqual(5 * MIN);
    expect(s1.lapses).toBe(0);
    expect(rankOf(s1)).toBe('learning');
  });
});

describe('early ladder (request_retention 0.92, learning steps on)', () => {
  it('successive goods produce a compressed, strictly growing FSRS-shaped ladder', () => {
    const { intervals } = runGoods(6);
    // Rung 0: same-session, never a 4-hour-style gate.
    expect(intervals[0]).toBeLessThanOrEqual(15 * MIN);
    // 1st day-level rung ~1d (0.5–2d).
    expect(intervals[1]).toBeGreaterThanOrEqual(0.5 * DAY);
    expect(intervals[1]).toBeLessThanOrEqual(2 * DAY);
    // 2nd day-level rung between 1 and 5 days (spec bound).
    expect(intervals[2]).toBeGreaterThanOrEqual(1 * DAY);
    expect(intervals[2]).toBeLessThanOrEqual(5 * DAY);
    // Strictly monotonic growth across the whole ladder.
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    }
  });

  it('ranks walk upward: learning after first review, locked-in once intervals mature', () => {
    let s = newItemSrs(T0);
    let prev = rankIndex(s);
    const seen: Rank[] = [rankOf(s)];
    for (let i = 0; i < 6; i++) {
      s = reviewAtDue(s, 'good').next;
      const cur = rankIndex(s);
      expect(cur).toBeGreaterThanOrEqual(prev); // goods never demote
      prev = cur;
      seen.push(rankOf(s));
    }
    expect(seen[1]).toBe('learning');
    expect(rankOf(s)).toBe('locked-in');
  });
});

describe('rankOf thresholds (named constants)', () => {
  it('exposes the spec thresholds', () => {
    expect(SOLID_MIN_DAYS).toBe(3.5);
    expect(LOCKED_IN_MIN_DAYS).toBe(12);
  });

  it('never-reviewed is new regardless of anything else', () => {
    expect(rankOf(withIntervalDays(20, 0))).toBe('new');
  });

  it('maps scheduled interval to learning / solid / locked-in at the constants', () => {
    expect(rankOf(withIntervalDays(SOLID_MIN_DAYS - 0.1))).toBe('learning');
    expect(rankOf(withIntervalDays(SOLID_MIN_DAYS))).toBe('solid');
    expect(rankOf(withIntervalDays(LOCKED_IN_MIN_DAYS - 0.1))).toBe('solid');
    expect(rankOf(withIntervalDays(LOCKED_IN_MIN_DAYS))).toBe('locked-in');
  });
});

describe('lapses demote', () => {
  it("'again' on a locked-in item drops at least one rank, counts a lapse, recycles same session", () => {
    const { s } = runGoods(6);
    expect(rankOf(s)).toBe('locked-in');
    const at = dueAt(s);
    const lapsed = reviewItem(s, 'again', at);
    expect(rankIndex(lapsed)).toBeLessThan(rankIndex(s));
    expect(lapsed.lapses).toBe(s.lapses + 1);
    expect(dueAt(lapsed).getTime() - at.getTime()).toBeLessThanOrEqual(15 * MIN);
  });

  it("'again' on a solid item drops at least one rank and counts a lapse", () => {
    // good ×3 then 'hard' lands a mid-length interval => solid.
    const { s: three } = runGoods(3);
    const solid = reviewAtDue(three, 'hard').next;
    expect(rankOf(solid)).toBe('solid');
    const lapsed = reviewAtDue(solid, 'again').next;
    expect(rankIndex(lapsed)).toBeLessThan(rankIndex(solid));
    expect(lapsed.lapses).toBe(solid.lapses + 1);
  });

  it('a lapsed item climbs back with growing intervals', () => {
    const { s } = runGoods(6);
    const lapsed = reviewAtDue(s, 'again').next;
    const { s: back, intervals } = runGoods(4, lapsed);
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    }
    expect(rankIndex(back)).toBeGreaterThanOrEqual(RANK_ORDER.indexOf('solid'));
  });
});

describe('grade mapping', () => {
  it('on a mature item: again recycles in minutes; hard < good < easy intervals', () => {
    const { s } = runGoods(4);
    const at = dueAt(s);
    const ivl = (g: Grade) => dueAt(reviewItem(s, g, at)).getTime() - at.getTime();
    expect(ivl('again')).toBeLessThanOrEqual(15 * MIN);
    expect(ivl('hard')).toBeGreaterThan(ivl('again'));
    expect(ivl('good')).toBeGreaterThan(ivl('hard'));
    expect(ivl('easy')).toBeGreaterThan(ivl('good'));
  });
});

describe('purity, determinism, serialization', () => {
  it('reviewItem never mutates its argument (frozen input works)', () => {
    const s = Object.freeze(newItemSrs(T0));
    const snapshot = JSON.stringify(s);
    const next = reviewItem(s, 'good', T0);
    expect(JSON.stringify(s)).toBe(snapshot);
    expect(next).not.toBe(s);
  });

  it('same inputs give identical outputs', () => {
    const { s } = runGoods(3);
    const at = dueAt(s);
    expect(reviewItem(s, 'good', at)).toEqual(reviewItem(s, 'good', at));
  });

  it('scheduling continues identically after a JSON round-trip mid-stream', () => {
    const straight = runGoods(6).s;
    const { s: half } = runGoods(3);
    const revived = JSON.parse(JSON.stringify(half)) as ItemSrs;
    expect(revived).toEqual(half);
    const resumed = runGoods(3, revived).s;
    expect(resumed).toEqual(straight);
  });
});
