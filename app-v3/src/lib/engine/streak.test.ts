import { describe, it, expect } from 'vitest';
import { addStudyDay, weekStart, dailyStreak, weeklyStreak } from './streak.js';

describe('forgiving streak (spec §10)', () => {
  it('addStudyDay: adds, dedupes, sorts', () => {
    expect(addStudyDay([], 100)).toEqual([100]);
    expect(addStudyDay([100], 100)).toEqual([100]);
    expect(addStudyDay([102, 100], 101)).toEqual([100, 101, 102]);
  });

  it('weekStart: anchors to Monday (1970-01-01 = Thu = day 0)', () => {
    expect(weekStart(0)).toBe(-3); // Mon Dec 29 1969
    expect(weekStart(4)).toBe(4); // Mon Jan 5 1970 maps to itself
    expect(weekStart(7)).toBe(4); // Thu Jan 8 → same week as Jan 5
    expect(weekStart(11)).toBe(11); // next Monday
  });

  it('dailyStreak: empty → 0', () => {
    expect(dailyStreak([], 100)).toEqual({ count: 0, protectedRecently: false });
  });

  it('dailyStreak: consecutive days count up', () => {
    expect(dailyStreak([98, 99, 100], 100)).toEqual({ count: 3, protectedRecently: false });
  });

  it('dailyStreak: a single skipped day is silently forgiven (freeze) and flagged', () => {
    expect(dailyStreak([98, 100], 100)).toEqual({ count: 2, protectedRecently: true });
  });

  it('dailyStreak: a one-day gap to today still protects the streak', () => {
    expect(dailyStreak([100], 102)).toEqual({ count: 1, protectedRecently: true });
  });

  it('dailyStreak: two missed days lapses the streak to 0', () => {
    expect(dailyStreak([100], 103)).toEqual({ count: 0, protectedRecently: false });
  });

  it('weeklyStreak: meeting the target this week counts it', () => {
    const today = 1000;
    const tw = weekStart(today);
    expect(weeklyStreak([tw, tw + 1, today], today, 3)).toEqual({ weeks: 1, thisWeek: 3, target: 3 });
  });

  it('weeklyStreak: under target this week, prior met weeks still count', () => {
    const today = 1000;
    const tw = weekStart(today);
    const lw = tw - 7;
    const days = [tw, tw + 1, lw, lw + 1, lw + 2]; // 2 this week, 3 last week
    expect(weeklyStreak(days, today, 3)).toEqual({ weeks: 1, thisWeek: 2, target: 3 });
  });

  it('weeklyStreak: counts consecutive prior weeks meeting target', () => {
    const today = 1000;
    const tw = weekStart(today);
    const lw = tw - 7;
    const lw2 = tw - 14;
    const days = [lw, lw + 1, lw + 2, lw2, lw2 + 1, lw2 + 3];
    expect(weeklyStreak(days, today, 3)).toEqual({ weeks: 2, thisWeek: 0, target: 3 });
  });
});
