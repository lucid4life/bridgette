// "The allergen sweep" — the flags drill behind /allergens. Same item model as
// everything else (it grades the SAME dish:<foodId> items the path tracks) and
// the same mechanics as romance.ts at ONE forced rung — except the rung is the
// allergen MC ('mc' + variant 'allergen'), resolved via answerMc + advance()
// like every other MC step: answerMc gives feedback (the step stays current so
// the why + confirm line can land), advance() resolves. The FIRST attempt
// decides the emitted grade ('good' or an immediate 'again'); a miss reteaches
// next (the full menu card) and retries ~3 steps later until cleared. Full UI
// contract: ./types.ts.
import { allergenMcFor, hasAllergenMc } from '../journey/items';
import type { JourneyItem } from '../journey/types';
import { insertRecycled } from './shared';
import type {
  AllergenDeps,
  AllergenItemResult,
  AllergenProgress,
  AllergenSession,
  AllergenSummary,
  McAnswer,
  Step
} from './types';

type QueueEntry =
  | { kind: 'retrieve'; item: JourneyItem; retry: boolean }
  | { kind: 'reteach'; item: JourneyItem };

export function createAllergenSession(
  items: readonly JourneyItem[],
  deps: AllergenDeps
): AllergenSession {
  // Caller order is preserved (the caller decides shakiest-first + interleave)
  // and the caller excludes flagless dishes — a missing card here is a bug.
  const queue: QueueEntry[] = items.map((item) => {
    if (item.kind !== 'dish')
      throw new Error(`session: allergen item '${item.id}' is not a dish — only dishes carry flags`);
    if (!hasAllergenMc(item))
      throw new Error(
        `session: '${item.id}' has no allergens card (no flags) — callers exclude these via hasAllergenMc`
      );
    return { kind: 'retrieve', item, retry: false };
  });

  const clearedList: AllergenItemResult[] = []; // in clearing order
  const missedIds = new Set<string>(); // items whose 'again' already fired
  let missEvents = 0;
  let position = 0;
  let pendingMc: { correct: boolean } | null = null; // answered, awaiting advance()

  function current(): Step | null {
    const head = queue[0];
    if (!head) return null;
    return head.kind === 'reteach'
      ? { type: 'reteach', item: head.item }
      : { type: 'quiz', item: head.item, rung: 'mc', variant: 'allergen' };
  }

  function answerMc(choiceIndex: number): McAnswer {
    const head = queue[0];
    if (!head) throw new Error('session: already complete');
    if (head.kind !== 'retrieve')
      throw new Error('session: the reteach step resolves via advance(), not answerMc');
    if (pendingMc) throw new Error('session: MC already answered — call advance()');
    const mc = allergenMcFor(head.item);
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= mc.choices.length)
      throw new Error(`session: choiceIndex ${choiceIndex} out of range (0..${mc.choices.length - 1})`);
    pendingMc = { correct: choiceIndex === mc.answerIndex };
    return { correct: pendingMc.correct, answerIndex: mc.answerIndex };
  }

  function selfGrade(_gotIt: boolean): void {
    throw new Error('session: the allergen sweep is button-graded — resolve via answerMc + advance()');
  }

  function advance(): void {
    const head = queue[0];
    if (!head) throw new Error('session: already complete');
    if (head.kind === 'reteach') {
      position += 1;
      queue.shift();
      return;
    }
    if (!pendingMc) throw new Error('session: answer the MC before advancing');
    const { correct } = pendingMc;
    pendingMc = null;
    position += 1;
    queue.shift();
    const id = head.item.id;

    if (correct) {
      // One right answer clears the item. A retry clears SILENTLY — the
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
    // Retry ~3 steps out at the SAME allergen rung, with the teach screen NEXT.
    insertRecycled(queue, { kind: 'retrieve', item: head.item, retry: true });
    queue.unshift({ kind: 'reteach', item: head.item });
  }

  function isComplete(): boolean {
    return queue.length === 0;
  }

  function progress(): AllergenProgress {
    return {
      position,
      total: position + queue.length,
      cleared: clearedList.length,
      misses: missEvents
    };
  }

  function summary(): AllergenSummary {
    if (!isComplete())
      throw new Error('session: summary() is only available once the session is complete');
    return { perItem: clearedList.slice(), cleared: clearedList.length, misses: missEvents };
  }

  return { current, answerMc, selfGrade, advance, isComplete, progress, summary };
}
