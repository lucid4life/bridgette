// Task C — streak with one FREE freeze per calendar week (week starts Monday).
// Spec: docs/handoffs/2026-06-11-v3-phase1-spec.md. tickStreak is pure-sync on
// the state object; persistence is exercised in store.test.ts.
//
// June 2026 calendar used throughout: 1=Mon … 8=Mon, 9=Tue, 10=Wed, 11=Thu,
// 12=Fri, 13=Sat, 14=Sun, 15=Mon, 16=Tue.
import { describe, expect, it } from 'vitest';
import { dayNumber, defaultState, tickStreak, weekStartOf, type ProgressState } from './store';

/** Local noon on the given June 2026 day-of-month. */
const at = (dom: number) => new Date(2026, 5, dom, 12);
const dn = (dom: number) => dayNumber(at(dom));

/** Simulate one study event on a day (≥1 review marks the day studied) then tick. */
function studyOn(state: ProgressState, dom: number): void {
  const d = dn(dom);
  const entry = (state.meta.dayLog[d] ??= { reviews: 0, newItems: 0 });
  entry.reviews += 1;
  tickStreak(state, at(dom));
}

describe('dayNumber', () => {
  it('is whole days since epoch in LOCAL time (same calendar day ⇒ same number)', () => {
    expect(dayNumber(new Date(2026, 5, 11, 0, 0, 1))).toBe(dayNumber(new Date(2026, 5, 11, 23, 59, 59)));
  });

  it('increments by 1 per local calendar day', () => {
    expect(dn(12)).toBe(dn(11) + 1);
    expect(dayNumber(new Date(2026, 5, 12, 0, 0, 0))).toBe(dayNumber(new Date(2026, 5, 11, 23, 59, 59)) + 1);
  });
});

describe('weekStartOf', () => {
  it('maps every day of the week to its Monday', () => {
    expect(weekStartOf(dn(8))).toBe(dn(8)); // Monday → itself
    expect(weekStartOf(dn(11))).toBe(dn(8)); // Thursday
    expect(weekStartOf(dn(14))).toBe(dn(8)); // Sunday still belongs to Monday's week
    expect(weekStartOf(dn(15))).toBe(dn(15)); // next Monday starts a new week
  });
});

describe('tickStreak', () => {
  it('first study day starts the streak at 1', () => {
    const s = defaultState();
    studyOn(s, 8);
    expect(s.meta.streak).toEqual({ current: 1, lastDay: dn(8), freezeUsedWeekOf: null });
  });

  it('does nothing on a fresh state with no study yet (load tick)', () => {
    const s = defaultState();
    tickStreak(s, at(8));
    expect(s.meta.streak).toEqual({ current: 0, lastDay: null, freezeUsedWeekOf: null });
  });

  it('consecutive study days extend the streak', () => {
    const s = defaultState();
    studyOn(s, 8);
    studyOn(s, 9);
    studyOn(s, 10);
    expect(s.meta.streak.current).toBe(3);
    expect(s.meta.streak.lastDay).toBe(dn(10));
  });

  it('multiple studies on the same day count once', () => {
    const s = defaultState();
    studyOn(s, 8);
    studyOn(s, 8);
    studyOn(s, 8);
    expect(s.meta.streak.current).toBe(1);
  });

  it('a load tick the morning after a study day changes nothing (no gap yet)', () => {
    const s = defaultState();
    studyOn(s, 8);
    tickStreak(s, at(9)); // opened the app, has not studied yet
    expect(s.meta.streak).toEqual({ current: 1, lastDay: dn(8), freezeUsedWeekOf: null });
  });

  it('exactly one missed day is absorbed by the weekly freeze — streak survives', () => {
    const s = defaultState();
    studyOn(s, 8); // Mon
    studyOn(s, 10); // Wed (missed Tue 9)
    expect(s.meta.streak.current).toBe(2);
    expect(s.meta.streak.lastDay).toBe(dn(10));
    // the freeze was spent in the week of the missed day (Mon 8's week)
    expect(s.meta.streak.freezeUsedWeekOf).toBe(dn(8));
  });

  it('a second miss in the same calendar week resets the streak (freeze already used)', () => {
    const s = defaultState();
    studyOn(s, 8); // Mon
    studyOn(s, 10); // Wed — freeze spent on Tue
    studyOn(s, 12); // Fri — Thu 11 missed, same week, no freeze left
    expect(s.meta.streak.current).toBe(1); // reset, then today made it 1
    expect(s.meta.streak.lastDay).toBe(dn(12));
  });

  it('a 2-day gap resets even with the freeze unused (freeze covers exactly ONE day)', () => {
    const s = defaultState();
    studyOn(s, 8); // Mon
    studyOn(s, 11); // Thu (missed Tue + Wed)
    expect(s.meta.streak.current).toBe(1);
    expect(s.meta.streak.freezeUsedWeekOf).toBeNull(); // not wasted on an unbridgeable gap
  });

  it('the freeze renews each calendar week', () => {
    const s = defaultState();
    studyOn(s, 8); // Mon — 1
    studyOn(s, 10); // Wed — 2, freeze spent for week of Mon 8
    studyOn(s, 11); // Thu — 3
    studyOn(s, 12); // Fri — 4
    studyOn(s, 13); // Sat — 5
    studyOn(s, 14); // Sun — 6
    studyOn(s, 16); // Tue — missed Mon 15, NEW week ⇒ fresh freeze
    expect(s.meta.streak.current).toBe(7);
    expect(s.meta.streak.freezeUsedWeekOf).toBe(dn(15));
  });

  it('a load tick (no study) spends the freeze to bridge yesterday, keeping the streak alive', () => {
    const s = defaultState();
    studyOn(s, 8); // Mon
    tickStreak(s, at(10)); // opened the app Wed before studying; Tue was missed
    expect(s.meta.streak.current).toBe(1); // survived, not extended
    expect(s.meta.streak.freezeUsedWeekOf).toBe(dn(8));
    studyOn(s, 10);
    expect(s.meta.streak.current).toBe(2);
  });

  it('does not waste the freeze when there is no streak to protect', () => {
    const s = defaultState();
    s.meta.streak = { current: 0, lastDay: dn(8), freezeUsedWeekOf: null };
    tickStreak(s, at(10)); // 1-day gap, but current is already 0
    expect(s.meta.streak.freezeUsedWeekOf).toBeNull();
    expect(s.meta.streak.current).toBe(0);
  });

  it('freeze bridges one day, but a continued absence still kills the streak', () => {
    const s = defaultState();
    studyOn(s, 8); // Mon
    tickStreak(s, at(10)); // Wed load: freeze bridges Tue
    tickStreak(s, at(11)); // Thu load: Wed also missed, freeze gone ⇒ dead
    expect(s.meta.streak.current).toBe(0);
    studyOn(s, 11);
    expect(s.meta.streak.current).toBe(1); // today's study restarts at 1
  });

  it('ignores a clock that moved backwards', () => {
    const s = defaultState();
    studyOn(s, 10);
    tickStreak(s, at(8));
    expect(s.meta.streak).toEqual({ current: 1, lastDay: dn(10), freezeUsedWeekOf: null });
  });
});
