// Task E — session engine: the pure state machine behind every learning
// surface (spec: docs/handoffs/2026-06-11-v3-phase1-spec.md). No Svelte, no
// DOM, no storage; deterministic via injected `rng`. THIS FILE IS THE UI
// CONTRACT — the session runner binds to exactly this surface.
//
// ## The three sessions (factories live in ./learn ./review ./checkpoint)
// - createLearnSession(items, deps)    — first exposure of a unit:
//   pretest (errorful generation, NO events) → teach (unit order) → quiz
//   (test-to-criterion ladder mc → cued → free; a miss keeps the rung and
//   recycles the item ~3 steps later; graduation = correct at the free rung
//   = 3 correct recalls; on graduation: onIntroduce(id) then
//   onResult(id, 'hard' if it missed during the quiz, else 'good')).
// - createReviewSession(entries, deps) — daily reviews, retrieval ONLY:
//   rung by rank ('learning' → cued; 'solid'/'locked-in' → free; 'new'
//   throws). First attempt decides the grade: correct → onResult('good');
//   miss → onResult('again') IMMEDIATELY, a reteach step appears next, and
//   the item retries at cued ~3 steps later until answered correctly once
//   (clearing emits nothing further — the 'again' is already recorded).
// - createCheckpointSession(items, deps?) — "Shift check" / test-out: one
//   rng-shuffled graded pass, rung by kind (service → cued, dish → free),
//   no teach, no recycling, NO events (CheckpointDeps has no hooks — the
//   CALLER applies test-out effects from summary()). passed() = score >=
//   CHECKPOINT_PASS_RATIO (0.85, same constant as journey/gating).
//
// ## Driving a session (the UI loop)
//   while (!session.isComplete()) { render(session.current()!); …resolve… }
// `current()` is STABLE: it returns the same step (by value, fresh object
// each call) until the step is resolved — it never consumes. It is null
// exactly when `isComplete()`. There is NO 'summary' step: when the session
// completes, render your own summary screen from `summary()`.
//
// ## Step → render + resolve matrix
// | step.type    | step.rung | render with    | resolve with                          |
// |--------------|-----------|----------------|---------------------------------------|
// | 'pretest-mc' | 'mc'      | mcFor(item)    | answerMc(i) → show reveal → advance() |
// | 'quiz'       | 'mc'      | mcFor(item)    | answerMc(i) → show reveal → advance() |
// | 'quiz'       | 'cued'    | cuedFor(item)  | UI reveal → selfGrade(gotIt)          |
// | 'quiz'       | 'free'    | freeFor(item)  | UI reveal → selfGrade(gotIt)          |
// | 'teach'      | —         | teachFor(item) | advance()                             |
// | 'reteach'    | —         | teachFor(item) | advance()                             |
//
// MC steps are button-driven: `answerMc(choiceIndex)` validates against
// mcFor(item).answerIndex and returns { correct, answerIndex } so the UI can
// highlight the right choice; the step STAYS current (feedback screen) until
// `advance()`. Cued/free steps are self-graded reveals: the UI shows the
// prompt (+hint on cued), the user thinks, taps reveal (pure UI state), then
// reports honesty — `selfGrade(gotIt)` resolves AND advances in one call (no
// advance() after). Grades are binary good/again (+hard at graduation);
// 'easy' is unused in Phase 1.
//
// Misuse throws Error (answerMc on a non-MC step, advance() past an
// unanswered MC or instead of selfGrade, anything after completion,
// summary()/score()/passed() before completion): these are programmer
// errors, never user-reachable states.
import type { JourneyItem } from '../journey/types';
import type { Grade, Rank } from '../srs/scheduler';

/** Prompt-fading ladder rungs, in climbing order. */
export type Rung = 'mc' | 'cued' | 'free';

/** One screen of a session. Discriminate on `type` (then `rung` for quiz). */
export type Step =
  | { type: 'pretest-mc'; item: JourneyItem; rung: 'mc' }
  | { type: 'quiz'; item: JourneyItem; rung: Rung }
  | { type: 'teach'; item: JourneyItem }
  | { type: 'reteach'; item: JourneyItem };

export type StepType = Step['type'];

/** Returned by answerMc: outcome + the right index for the reveal UI. */
export interface McAnswer {
  correct: boolean;
  answerIndex: number;
}

/** Uniform random in [0, 1) — Math.random-compatible; tests inject seeded. */
export type Rng = () => number;

/** Grades sessions can emit ('easy' is reserved for later phases). */
export type SessionGrade = Exclude<Grade, 'easy'>;

/** The methods every session shares (see the matrix above for when to call). */
export interface SessionCore {
  current(): Step | null;
  answerMc(choiceIndex: number): McAnswer;
  selfGrade(gotIt: boolean): void;
  advance(): void;
  isComplete(): boolean;
}

// ----------------------------------------------------------------- learn
export interface LearnDeps {
  /** Graduation only: called once per item, immediately BEFORE its onResult. */
  onIntroduce(itemId: string): void;
  /** Graduation grade: 'hard' if the item missed >= 1 time during the quiz. */
  onResult(itemId: string, grade: 'good' | 'hard'): void;
  /** Shuffles the quiz queue (pretest/teach keep unit order). Default Math.random. */
  rng?: Rng;
}

export interface LearnProgress {
  /** Steps resolved so far (render "position + 1 of total" while a step exists). */
  position: number;
  /** position + minimum steps left if nothing else is missed — grows 1 per miss. */
  total: number;
  graduated: number;
  /** Quiz misses only — pretest errors are expected and never counted. */
  misses: number;
}

export interface LearnItemResult {
  itemId: string;
  /** Quiz misses for this item (pretest excluded). */
  misses: number;
  /** The grade that was emitted at graduation. */
  grade: 'good' | 'hard';
}

export interface LearnSummary {
  /** In graduation order. */
  perItem: LearnItemResult[];
  graduated: number;
  misses: number;
}

export interface LearnSession extends SessionCore {
  progress(): LearnProgress;
  /** Complete sessions only — throws otherwise. */
  summary(): LearnSummary;
}

// ---------------------------------------------------------------- review
export interface ReviewEntry {
  item: JourneyItem;
  /** Current SRS rank; decides the rung. 'new' throws at construction. */
  rank: Rank;
}

export interface ReviewDeps {
  /** At most ONE call per item: 'good' on a clean first attempt, 'again' on
   * the first miss (emitted synchronously inside selfGrade(false)). */
  onResult(itemId: string, grade: 'good' | 'again'): void;
}

export interface ReviewProgress {
  position: number;
  /** position + steps currently queued — grows by 2 per miss (reteach + retry). */
  total: number;
  cleared: number;
  /** Missed ATTEMPTS (a twice-missed item counts 2; its 'again' still fired once). */
  misses: number;
}

export interface ReviewItemResult {
  itemId: string;
  /** True if the item missed at least once before clearing. */
  missed: boolean;
}

export interface ReviewSummary {
  /** In clearing order. */
  perItem: ReviewItemResult[];
  cleared: number;
  misses: number;
}

export interface ReviewSession extends SessionCore {
  progress(): ReviewProgress;
  /** Complete sessions only — throws otherwise. */
  summary(): ReviewSummary;
}

// ------------------------------------------------------------ checkpoint
export interface CheckpointDeps {
  /** Shuffles the single pass. Default Math.random. NO event hooks: a
   * checkpoint never touches the SRS — the caller applies test-out effects. */
  rng?: Rng;
}

export interface CheckpointProgress {
  position: number;
  /** Fixed: items.length (one pass, no recycling). */
  total: number;
  correct: number;
  misses: number;
}

export interface CheckpointItemResult {
  itemId: string;
  rung: Rung;
  correct: boolean;
}

export interface CheckpointSummary {
  /** In asked (shuffled) order. */
  perItem: CheckpointItemResult[];
  correct: number;
  total: number;
  score: number;
  passed: boolean;
}

export interface CheckpointSession extends SessionCore {
  progress(): CheckpointProgress;
  /** correct / total. Complete sessions only — throws otherwise. */
  score(): number;
  /** score() >= CHECKPOINT_PASS_RATIO. Complete sessions only. */
  passed(): boolean;
  /** Complete sessions only — throws otherwise. */
  summary(): CheckpointSummary;
}
