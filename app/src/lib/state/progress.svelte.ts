// app/src/lib/state/progress.svelte.ts — reactive wrapper around the pure engine
// (spec §4). $state holds progress; the engine stays pure; one save() persists to
// the byte-exact bb_progress_v1 localStorage key. Swappable later for sync.
import { browser } from '$app/environment';
import { data } from '$lib/data/index';
import * as engine from '$lib/engine/training.js';
import type { Card, Progress } from '$lib/data/types';

function initial(): Progress {
  // SSR is off, but guard anyway: on the server use a fresh default.
  return browser ? engine.loadProgress(data) : engine.defaultProgress();
}

let progress = $state<Progress>(initial());

export const progressStore = {
  get value(): Progress {
    return progress;
  },
  get streak() {
    return progress.streak;
  },
  get readiness() {
    return progress.readiness;
  },
  reload() {
    if (browser) progress = engine.loadProgress(data);
  },
  save() {
    if (browser) engine.saveProgress(progress);
  },
  /** Grade a card and persist (skips re-shown cards — caller decides). */
  record(card: Card, correct: boolean, today?: number) {
    progress = engine.recordResult(progress, card, correct, today);
    this.save();
  },
  /**
   * Confidence-weighted grade (spec §9). Standard grade is +1 box on correct.
   * A confident-correct answer ("Sure") earns a second promotion (capped at box
   * 5) on top of the engine's +1 — without a second correct/streak increment, so
   * the pure engine + its tests are untouched. "Shaky" keeps the single promote.
   */
  recordWithConfidence(card: Card, correct: boolean, confidence: 'sure' | 'shaky' | null, today?: number) {
    const t = today ?? engine.dayNumber();
    const next = engine.recordResult(progress, card, correct, t);
    if (correct && confidence === 'sure') {
      const st = next.cards[card.id];
      const boosted = Math.min(5, st.box + 1);
      st.box = boosted;
      st.due = t + (engine.BOX_DUE_DAYS as Record<number, number>)[boosted];
    }
    progress = next;
    this.save();
  },
  recordReadiness(scored: Parameters<typeof engine.recordReadiness>[1], today?: number) {
    const t = today ?? engine.dayNumber();
    const next = engine.recordReadiness(progress, scored, t);
    next.streak = engine.updateStreak(next.streak, t);
    progress = next;
    this.save();
  },
  masteryFor(key: string): number {
    return engine.masteryFor(progress, key, data);
  },
  /** Cards due across all decks today (for the Today cockpit). */
  dueCount(today = engine.dayNumber()): number {
    return engine.allCards(data).filter((c: Card) => {
      const st = progress.cards[c.id];
      return st && engine.isDue(st, today);
    }).length;
  },
  /** Weak list: low-box cards the learner has missed. */
  weakCards(): Card[] {
    return engine.allCards(data).filter((c: Card) => {
      const st = progress.cards[c.id];
      return st && st.box <= 2 && st.wrong > 0;
    });
  },
  exportJson(): string {
    return engine.exportProgress(progress, data);
  },
  importJson(json: string): boolean {
    const validIds = new Set(engine.allCards(data).map((c: Card) => c.id));
    const imported = engine.importProgress(json, validIds);
    if (!imported) return false;
    progress = imported;
    this.save();
    return true;
  }
};
