// "The food test" — the mock of the real Monday-night menu test (./types.ts
// has the full UI contract). Checkpoint semantics: one rng-shuffled graded
// pass, no teach, no recycling, NO SRS events — the CALLER renders results
// from summary() and records nothing. The twist: each dish is asked as ONE of
// four question types assigned round-robin from a per-run rotation, so a
// retake re-deals both the order AND which face each dish shows.
import { CHECKPOINT_PASS_RATIO } from '../journey/gating';
import { allergenMcFor, hasAllergenMc, mcFor, reverseMcFor, teachFor } from '../journey/items';
import type { McContent } from '../journey/items';
import type { JourneyItem } from '../journey/types';
import { shuffled } from './shared';
import type {
  McAnswer,
  McVariant,
  MockBreakdown,
  MockQuestionType,
  MockTestDeps,
  MockTestItemResult,
  MockTestSession,
  MockTestSummary,
  CheckpointProgress,
  Step
} from './types';

/** The question-type wheel, in dealing order. */
export const MOCK_TYPE_ROTATION: readonly MockQuestionType[] = [
  'components-mc',
  'allergen-mc',
  'reverse-mc',
  'romance'
];

const VARIANT: Record<Exclude<MockQuestionType, 'romance'>, McVariant> = {
  'components-mc': 'components',
  'allergen-mc': 'allergen',
  'reverse-mc': 'reverse'
};

/** Pure type assignment: round-robin from `offset`; an allergen-mc slot whose
 * dish has no allergens card (no flags) falls back to components-mc — the
 * wheel itself keeps turning. Exported for tests (the fallback is dormant on
 * today's path data: every path dish carries flags). */
export function assignMockTypes(
  items: readonly JourneyItem[],
  offset: number,
  hasAllergen: (item: JourneyItem) => boolean
): MockQuestionType[] {
  return items.map((item, i) => {
    const qtype = MOCK_TYPE_ROTATION[(offset + i) % MOCK_TYPE_ROTATION.length];
    return qtype === 'allergen-mc' && !hasAllergen(item) ? 'components-mc' : qtype;
  });
}

const mcContentFor = (item: JourneyItem, qtype: MockQuestionType): McContent => {
  if (qtype === 'components-mc') return mcFor(item);
  if (qtype === 'allergen-mc') return allergenMcFor(item);
  if (qtype === 'reverse-mc') return reverseMcFor(item);
  throw new Error('session: romance steps have no MC content'); // unreachable via answerMc guard
};

export function createMockTestSession(
  items: readonly JourneyItem[],
  deps: MockTestDeps = {}
): MockTestSession {
  if (items.length === 0)
    throw new Error('session: a mock test needs at least one dish — pass/fail over nothing is undefined');
  const categoryOf = new Map<string, string>();
  const categoryOrder: string[] = []; // caller (path) order = menu order
  for (const item of items) {
    if (item.kind !== 'dish')
      throw new Error(`session: mock-test item '${item.id}' is not a dish — the food test covers plates only`);
    const teach = teachFor(item);
    const category = teach.kind === 'dish' ? teach.category : '';
    categoryOf.set(item.id, category);
    if (!categoryOrder.includes(category)) categoryOrder.push(category);
  }

  const rng = deps.rng ?? Math.random;
  // One rng draw spins the wheel's starting slot, then the same rng shuffles —
  // deterministic per run for an injected rng, fresh deal per retake otherwise.
  const offset = Math.floor(rng() * MOCK_TYPE_ROTATION.length);
  const order = shuffled(items, rng);
  const qtypes = assignMockTypes(order, offset, hasAllergenMc);
  const queue = order.map((item, i) => ({ item, qtype: qtypes[i] }));

  const total = items.length;
  const results: MockTestItemResult[] = []; // in asked order
  let pendingMc: { correct: boolean } | null = null; // answered, awaiting advance()

  function current(): Step | null {
    const head = queue[0];
    if (!head) return null;
    return head.qtype === 'romance'
      ? { type: 'quiz', item: head.item, rung: 'romance' }
      : { type: 'quiz', item: head.item, rung: 'mc', variant: VARIANT[head.qtype] };
  }

  function resolve(correct: boolean): void {
    const head = queue.shift()!;
    results.push({
      itemId: head.item.id,
      qtype: head.qtype,
      category: categoryOf.get(head.item.id)!,
      correct
    });
  }

  function answerMc(choiceIndex: number): McAnswer {
    const head = queue[0];
    if (!head) throw new Error('session: already complete');
    if (head.qtype === 'romance')
      throw new Error('session: romance steps resolve via selfGrade(gotIt), not answerMc');
    if (pendingMc) throw new Error('session: MC already answered — call advance()');
    const mc = mcContentFor(head.item, head.qtype);
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= mc.choices.length)
      throw new Error(`session: choiceIndex ${choiceIndex} out of range (0..${mc.choices.length - 1})`);
    pendingMc = { correct: choiceIndex === mc.answerIndex };
    return { correct: pendingMc.correct, answerIndex: mc.answerIndex };
  }

  function advance(): void {
    const head = queue[0];
    if (!head) throw new Error('session: already complete');
    if (head.qtype === 'romance')
      throw new Error('session: romance steps resolve via selfGrade(gotIt), not advance()');
    if (!pendingMc) throw new Error('session: answer the MC before advancing');
    const { correct } = pendingMc;
    pendingMc = null;
    resolve(correct);
  }

  function selfGrade(gotIt: boolean): void {
    const head = queue[0];
    if (!head) throw new Error('session: already complete');
    if (head.qtype !== 'romance')
      throw new Error('session: MC steps resolve via answerMc + advance(), not selfGrade');
    resolve(gotIt);
  }

  const isComplete = (): boolean => queue.length === 0;
  const correctCount = (): number => results.filter((r) => r.correct).length;

  function requireComplete(what: string): void {
    if (!isComplete())
      throw new Error(`session: ${what} is only available once the mock test is complete`);
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

  function summary(): MockTestSummary {
    requireComplete('summary()');
    const byType = Object.fromEntries(
      MOCK_TYPE_ROTATION.map((t) => [t, { asked: 0, correct: 0 }])
    ) as Record<MockQuestionType, MockBreakdown>;
    const byCat = new Map(categoryOrder.map((c) => [c, { category: c, asked: 0, correct: 0 }]));
    for (const r of results) {
      byType[r.qtype].asked += 1;
      const cat = byCat.get(r.category)!;
      cat.asked += 1;
      if (r.correct) {
        byType[r.qtype].correct += 1;
        cat.correct += 1;
      }
    }
    return {
      perItem: results.slice(),
      correct: correctCount(),
      total,
      score: score(),
      passed: passed(),
      byType,
      byCategory: categoryOrder.map((c) => byCat.get(c)!),
      missed: results.filter((r) => !r.correct).map((r) => r.itemId)
    };
  }

  return { current, answerMc, selfGrade, advance, isComplete, progress, score, passed, summary };
}
