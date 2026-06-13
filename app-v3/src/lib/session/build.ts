// "Build the bar" — the make-the-drink say-it drill behind /build. Same item
// model as the path (it grades the SAME build:<cocktailId> items Stage 3
// tracks; "build" is a presentation MODE, not a new card set) and the same
// mechanics as review.ts/romance.ts at ONE forced rung 'build': every cocktail
// is asked once in the caller's order; the FIRST attempt decides the emitted
// grade ('good' or an immediate 'again'); a miss reteaches next and retries at
// the SAME build rung ~3 steps later until cleared. Full UI contract: ./types.ts.
import type { JourneyItem } from '../journey/types';
import { insertRecycled } from './shared';
import type {
  BuildDeps,
  BuildItemResult,
  BuildProgress,
  BuildSession,
  BuildSummary,
  McAnswer,
  Step
} from './types';

type QueueEntry =
  | { kind: 'retrieve'; item: JourneyItem; retry: boolean }
  | { kind: 'reteach'; item: JourneyItem };

export function createBuildSession(items: readonly JourneyItem[], deps: BuildDeps): BuildSession {
  // Caller order is preserved (the caller decides shakiest-first + interleave).
  const queue: QueueEntry[] = items.map((item) => {
    if (item.kind !== 'build')
      throw new Error(
        `session: build item '${item.id}' is not a cocktail build — only build:* items get built`
      );
    return { kind: 'retrieve', item, retry: false };
  });

  const clearedList: BuildItemResult[] = []; // in clearing order
  const missedIds = new Set<string>(); // items whose 'again' already fired
  let missEvents = 0;
  let position = 0;

  function current(): Step | null {
    const head = queue[0];
    if (!head) return null;
    return head.kind === 'reteach'
      ? { type: 'reteach', item: head.item }
      : { type: 'quiz', item: head.item, rung: 'build' };
  }

  function answerMc(_choiceIndex: number): McAnswer {
    throw new Error('session: build sessions have no MC steps');
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
      // One correct build clears the item. A retry clears SILENTLY — the
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
    // Retry ~3 steps out at the SAME build rung, with the teach screen NEXT.
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

  function progress(): BuildProgress {
    return {
      position,
      total: position + queue.length,
      cleared: clearedList.length,
      misses: missEvents
    };
  }

  function summary(): BuildSummary {
    if (!isComplete())
      throw new Error('session: summary() is only available once the session is complete');
    return { perItem: clearedList.slice(), cleared: clearedList.length, misses: missEvents };
  }

  return { current, answerMc, selfGrade, advance, isComplete, progress, summary };
}
