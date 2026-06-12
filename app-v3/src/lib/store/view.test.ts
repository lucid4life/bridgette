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
});
