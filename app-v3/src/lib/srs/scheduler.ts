// FSRS scheduler + named ranks (Task B, spec: docs/handoffs/2026-06-11-v3-phase1-spec.md).
// Thin pure wrapper over ts-fsrs v5. Schedules ITEMS (knowledge units), not UI cards.
// The UI shows RANKS only — never intervals.
import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type CardInput,
  type Grade as FsrsGrade
} from 'ts-fsrs';

export type Rank = 'new' | 'learning' | 'solid' | 'locked-in';
export type Grade = 'again' | 'hard' | 'good' | 'easy';

/**
 * Persisted SRS state for one item. Plain-JSON serializable: every date is
 * epoch ms, every field a number. Field names mirror the ts-fsrs `Card` so the
 * card can be revived losslessly (`state` is the ts-fsrs State enum value).
 */
export interface ItemSrs {
  due: number; // epoch ms
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number; // ts-fsrs State (0 New | 1 Learning | 2 Review | 3 Relearning)
  last_review?: number; // epoch ms; absent until first review
}

/** Scheduled interval ≥ this many days ⇒ rank 'solid'. */
export const SOLID_MIN_DAYS = 3.5;
/** Scheduled interval ≥ this many days ⇒ rank 'locked-in'. */
export const LOCKED_IN_MIN_DAYS = 12;

const DAY_MS = 86_400_000;

// Learning steps tuned so the first 'good' lands same-session (10m) and the
// day-level ladder opens 1d → 3d before FSRS takes over (~15d at 0.92).
// '1439m' (not '1d'): ts-fsrs 5.4.1 flips a card to Review state at steps
// ≥ 1440 min, and Review-state goods skip any remaining steps — one minute
// short keeps the card in Learning so the 3d rung still applies.
const scheduler = fsrs({
  request_retention: 0.92,
  enable_fuzz: false, // determinism: same inputs → same outputs
  enable_short_term: true,
  learning_steps: ['1m', '10m', '1439m', '3d'],
  relearning_steps: ['10m']
});

const RATING: Record<Grade, FsrsGrade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy
};

function fromCard(c: Card): ItemSrs {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    ...(c.last_review ? { last_review: c.last_review.getTime() } : {})
  };
}

function toCard(s: ItemSrs): CardInput {
  return { ...s, state: s.state, due: s.due, last_review: s.last_review ?? null };
}

export function newItemSrs(now: Date): ItemSrs {
  return fromCard(createEmptyCard(now));
}

/** Pure: returns a new ItemSrs, never mutates `s`. */
export function reviewItem(s: ItemSrs, grade: Grade, now: Date): ItemSrs {
  return fromCard(scheduler.next(toCard(s), now, RATING[grade]).card);
}

export function isDue(s: ItemSrs, now: Date): boolean {
  return s.due <= now.getTime();
}

export function dueAt(s: ItemSrs): Date {
  return new Date(s.due);
}

export function rankOf(s: ItemSrs): Rank {
  if (s.reps === 0) return 'new';
  const intervalDays = (s.due - (s.last_review ?? s.due)) / DAY_MS;
  if (intervalDays >= LOCKED_IN_MIN_DAYS) return 'locked-in';
  if (intervalDays >= SOLID_MIN_DAYS) return 'solid';
  return 'learning';
}
