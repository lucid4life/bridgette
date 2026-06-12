// "Romance the menu" — the say-it-aloud drill behind /romance. Same item
// model as everything else (it grades the SAME dish:<foodId> items the path
// tracks; romance is a presentation MODE, not a new card set) and the same
// mechanics as review.ts at ONE forced rung 'romance': every item is asked
// once in the caller's order; the FIRST attempt decides the emitted grade
// ('good' or an immediate 'again'); a miss reteaches next and retries at the
// SAME romance rung ~3 steps later until cleared. Full UI contract: ./types.ts.
import type { JourneyItem } from '../journey/types';
import { insertRecycled } from './shared';
import type {
  McAnswer,
  RomanceDeps,
  RomanceItemResult,
  RomanceProgress,
  RomanceSession,
  RomanceSummary,
  Step
} from './types';

type QueueEntry =
  | { kind: 'retrieve'; item: JourneyItem; retry: boolean }
  | { kind: 'reteach'; item: JourneyItem };

export function createRomanceSession(
  items: readonly JourneyItem[],
  deps: RomanceDeps
): RomanceSession {
  // Caller order is preserved (the caller decides shakiest-first + interleave).
  const queue: QueueEntry[] = items.map((item) => {
    if (item.kind !== 'dish')
      throw new Error(
        `session: romance item '${item.id}' is not a dish — only dishes get romanced`
      );
    return { kind: 'retrieve', item, retry: false };
  });

  const clearedList: RomanceItemResult[] = []; // in clearing order
  const missedIds = new Set<string>(); // items whose 'again' already fired
  let missEvents = 0;
  let position = 0;

  function current(): Step | null {
    const head = queue[0];
    if (!head) return null;
    return head.kind === 'reteach'
      ? { type: 'reteach', item: head.item }
      : { type: 'quiz', item: head.item, rung: 'romance' };
  }

  function answerMc(_choiceIndex: number): McAnswer {
    throw new Error('session: romance sessions have no MC steps');
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
      // One correct delivery clears the item. A retry clears SILENTLY — the
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
    // Retry ~3 steps out at the SAME romance rung, with the teach screen NEXT.
    insertRecycled(queue, { kind: 'retrieve', item: head.item, retry: true });
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

  function progress(): RomanceProgress {
    return {
      position,
      total: position + queue.length,
      cleared: clearedList.length,
      misses: missEvents
    };
  }

  function summary(): RomanceSummary {
    if (!isComplete())
      throw new Error('session: summary() is only available once the session is complete');
    return { perItem: clearedList.slice(), cleared: clearedList.length, misses: missEvents };
  }

  return { current, answerMc, selfGrade, advance, isComplete, progress, summary };
}
