// Task E — checkpoint session ("Shift check" / test-out): one deterministically
// shuffled graded pass. No teach, no recycling, NO SRS events — the CALLER
// reads summary() and applies test-out effects. Pass bar = the same 0.85 the
// gating module uses. Full UI contract: ./types.ts.
import { CHECKPOINT_PASS_RATIO } from '../journey/gating';
import type { JourneyItem } from '../journey/types';
import { shuffled } from './shared';
import type {
  CheckpointDeps,
  CheckpointItemResult,
  CheckpointProgress,
  CheckpointSession,
  CheckpointSummary,
  McAnswer,
  Step
} from './types';

const rungFor = (item: JourneyItem): 'cued' | 'free' =>
  item.kind === 'service' ? 'cued' : 'free';

export function createCheckpointSession(
  items: JourneyItem[],
  deps: CheckpointDeps = {}
): CheckpointSession {
  if (items.length === 0)
    throw new Error('session: a checkpoint needs at least one item — pass/fail over nothing is undefined');
  const rng = deps.rng ?? Math.random;
  const queue = shuffled(items, rng);
  const total = items.length;
  const results: CheckpointItemResult[] = []; // in asked order

  function current(): Step | null {
    const item = queue[0];
    return item ? { type: 'quiz', item, rung: rungFor(item) } : null;
  }

  function answerMc(_choiceIndex: number): McAnswer {
    throw new Error('session: checkpoint sessions have no MC steps');
  }

  function selfGrade(gotIt: boolean): void {
    const item = queue.shift();
    if (!item) throw new Error('session: already complete');
    results.push({ itemId: item.id, rung: rungFor(item), correct: gotIt });
  }

  function advance(): void {
    throw new Error('session: checkpoint steps resolve via selfGrade(gotIt), not advance()');
  }

  const isComplete = (): boolean => queue.length === 0;
  const correctCount = (): number => results.filter((r) => r.correct).length;

  function requireComplete(what: string): void {
    if (!isComplete())
      throw new Error(`session: ${what} is only available once the checkpoint is complete`);
  }

  function progress(): CheckpointProgress {
    const correct = correctCount();
    return { position: results.length, total, correct, misses: results.length - correct };
  }

  function score(): number {
    requireComplete('score()');
    return correctCount() / total;
  }

  function passed(): boolean {
    return score() >= CHECKPOINT_PASS_RATIO;
  }

  function summary(): CheckpointSummary {
    requireComplete('summary()');
    return {
      perItem: results.slice(),
      correct: correctCount(),
      total,
      score: score(),
      passed: passed()
    };
  }

  return { current, answerMc, selfGrade, advance, isComplete, progress, score, passed, summary };
}
