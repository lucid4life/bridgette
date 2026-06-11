// Task E — review session: retrieval ONLY (review days never start with
// teaching). Rung by rank; the FIRST attempt decides the emitted grade
// ('good' or an immediate 'again'); a miss reteaches next and retries at
// cued ~3 steps later until cleared. Full UI contract: ./types.ts.
import type { JourneyItem } from '../journey/types';
import { insertRecycled } from './shared';
import type {
  McAnswer,
  ReviewDeps,
  ReviewEntry,
  ReviewItemResult,
  ReviewProgress,
  ReviewSession,
  ReviewSummary,
  Step
} from './types';

type QueueEntry =
  | { kind: 'retrieve'; item: JourneyItem; rung: 'cued' | 'free'; retry: boolean }
  | { kind: 'reteach'; item: JourneyItem };

export function createReviewSession(entries: ReviewEntry[], deps: ReviewDeps): ReviewSession {
  // Caller order is preserved (the caller decides due-date ordering).
  const queue: QueueEntry[] = entries.map(({ item, rank }) => {
    if (rank === 'new')
      throw new Error(
        `session: review item '${item.id}' has rank 'new' — reviews are for introduced items`
      );
    return { kind: 'retrieve', item, rung: rank === 'learning' ? 'cued' : 'free', retry: false };
  });

  const clearedList: ReviewItemResult[] = []; // in clearing order
  const missedIds = new Set<string>(); // items whose 'again' already fired
  let missEvents = 0;
  let position = 0;

  function current(): Step | null {
    const head = queue[0];
    if (!head) return null;
    return head.kind === 'reteach'
      ? { type: 'reteach', item: head.item }
      : { type: 'quiz', item: head.item, rung: head.rung };
  }

  function answerMc(_choiceIndex: number): McAnswer {
    throw new Error('session: review sessions have no MC steps');
  }

  function selfGrade(gotIt: boolean): void {
    const head = queue[0];
    if (!head) throw new Error('session: already complete');
    if (head.kind !== 'retrieve')
      throw new Error('session: the reteach step resolves via advance(), not selfGrade()');
    position += 1;
    queue.shift();
    const id = head.item.id;

    if (gotIt) {
      // One correct answer clears the item. A retry clears SILENTLY — the
      // first-attempt 'again' already recorded the day's outcome.
      if (!head.retry) deps.onResult(id, 'good');
      clearedList.push({ itemId: id, missed: missedIds.has(id) });
      return;
    }

    missEvents += 1;
    if (!missedIds.has(id)) {
      missedIds.add(id);
      deps.onResult(id, 'again'); // immediate — never wait for the retry
    }
    // Retry at cued ~3 steps out, with the teach screen injected NEXT.
    insertRecycled(queue, { kind: 'retrieve', item: head.item, rung: 'cued', retry: true });
    queue.unshift({ kind: 'reteach', item: head.item });
  }

  function advance(): void {
    const head = queue[0];
    if (!head) throw new Error('session: already complete');
    if (head.kind !== 'reteach')
      throw new Error('session: retrieval steps resolve via selfGrade(gotIt), not advance()');
    position += 1;
    queue.shift();
  }

  function isComplete(): boolean {
    return queue.length === 0;
  }

  function progress(): ReviewProgress {
    return {
      position,
      total: position + queue.length,
      cleared: clearedList.length,
      misses: missEvents
    };
  }

  function summary(): ReviewSummary {
    if (!isComplete())
      throw new Error('session: summary() is only available once the session is complete');
    return { perItem: clearedList.slice(), cleared: clearedList.length, misses: missEvents };
  }

  return { current, answerMc, selfGrade, advance, isComplete, progress, summary };
}
