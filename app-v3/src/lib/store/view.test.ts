// Task G — the ProgressView adapter over store state.
import { describe, expect, it } from 'vitest';
import { defaultState, recordReview } from './store';
import { progressView } from './view';

const T = new Date(2026, 5, 11, 15);

describe('progressView', () => {
  it("rankOf returns 'new' for un-introduced items", () => {
    const view = progressView(defaultState());
    expect(view.rankOf('dish:tuna-crudo')).toBe('new');
  });

  it('rankOf reads the live item record; unitDone passes through by reference', async () => {
    const state = defaultState();
    const view = progressView(state); // built BEFORE the mutations — reads must be lazy
    await recordReview(state, 'dish:tuna-crudo', 'good', T);
    state.meta.unitDone['snacks'] = 'gate';
    expect(view.rankOf('dish:tuna-crudo')).toBe('learning');
    expect(view.unitDone['snacks']).toBe('gate');
  });

  it("rankOf stays 'new' for an item with zero lifetime correct recalls (all-'again')", async () => {
    const state = defaultState();
    const view = progressView(state);
    // an all-miss romance pass: reps move the srs, but nothing was ever recalled
    await recordReview(state, 'dish:tuna-crudo', 'again', T);
    await recordReview(state, 'dish:tuna-crudo', 'again', new Date(T.getTime() + 60_000));
    expect(state.items['dish:tuna-crudo'].srs.reps).toBeGreaterThan(0);
    expect(view.rankOf('dish:tuna-crudo')).toBe('new'); // gating: never-recalled is still new
  });

  it("one correct recall flips an all-'again' item past 'new'", async () => {
    const state = defaultState();
    const view = progressView(state);
    await recordReview(state, 'dish:tuna-crudo', 'again', T);
    expect(view.rankOf('dish:tuna-crudo')).toBe('new');
    await recordReview(state, 'dish:tuna-crudo', 'good', new Date(T.getTime() + 60_000));
    expect(view.rankOf('dish:tuna-crudo')).toBe('learning');
  });
});
