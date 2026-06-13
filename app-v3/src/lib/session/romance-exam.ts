// "The Romance Exam" — the scored simulator of Monday night's MENU test
// (./types.ts has the full UI contract). Checkpoint semantics: one rng-shuffled
// graded pass, no teach, no recycling, NO SRS events — the CALLER renders the
// readiness % from summary() and records NOTHING (the exam READS readiness, it
// never penalizes). The twist vs. the mock food test: every dish is asked the
// SAME way — "romance it" — and graded by a STRUCTURED self-check against the
// real bar: the name + min(3, official components). A dish with only 1-2
// official components passes on that many; everything else needs three.
import { CHECKPOINT_PASS_RATIO } from '../journey/gating';
import { romanceFor } from '../journey/items';
import type { JourneyItem } from '../journey/types';
import { shuffled } from './shared';
import type {
  CheckpointProgress,
  RomanceExamDeps,
  RomanceExamItemResult,
  RomanceExamOutcome,
  RomanceExamSession,
  RomanceExamSummary,
  Step
} from './types';

/** The per-dish pass bar: the name + this many real components — three, or all
 * of them when the dish has only one or two (mirrors romanceFor's first-3
 * "romance targets", the Playbook's bold-first-3 rule). */
export function requiredComponents(item: JourneyItem): number {
  return romanceFor(item).romanceTargets.length;
}

export function createRomanceExamSession(
  items: readonly JourneyItem[],
  deps: RomanceExamDeps = {}
): RomanceExamSession {
  if (items.length === 0)
    throw new Error('session: a romance exam needs at least one dish — a readiness % over nothing is undefined');

  // Category order = the caller's (menu) order, captured BEFORE the shuffle so
  // the byCategory breakdown reads top-to-bottom like the menu.
  const categoryOf = new Map<string, string>();
  const requiredOf = new Map<string, number>();
  const categoryOrder: string[] = [];
  for (const item of items) {
    if (item.kind !== 'dish')
      throw new Error(`session: romance-exam item '${item.id}' is not a dish — the exam covers plates only`);
    const rc = romanceFor(item); // throws if the dish has no official description
    categoryOf.set(item.id, rc.category);
    requiredOf.set(item.id, rc.romanceTargets.length);
    if (!categoryOrder.includes(rc.category)) categoryOrder.push(rc.category);
  }

  const rng = deps.rng ?? Math.random;
  const queue = shuffled(items, rng);
  const total = items.length;
  const results: RomanceExamItemResult[] = []; // in asked (shuffled) order

  function current(): Step | null {
    const head = queue[0];
    return head ? { type: 'quiz', item: head, rung: 'romance' } : null;
  }

  function grade(outcome: RomanceExamOutcome): void {
    const head = queue.shift();
    if (!head) throw new Error('session: the romance exam is already complete');
    const required = requiredOf.get(head.id)!;
    const componentsHit = Math.max(0, Math.floor(outcome.componentsHit));
    const passed = outcome.named && componentsHit >= required;
    results.push({
      itemId: head.id,
      category: categoryOf.get(head.id)!,
      named: outcome.named,
      componentsHit,
      required,
      passed
    });
  }

  const isComplete = (): boolean => queue.length === 0;
  const cleanCount = (): number => results.filter((r) => r.passed).length;

  function requireComplete(what: string): void {
    if (!isComplete())
      throw new Error(`session: ${what} is only available once the romance exam is complete`);
  }

  function progress(): CheckpointProgress {
    const correct = cleanCount();
    return { position: results.length, total, correct, misses: results.length - correct };
  }

  function score(): number {
    requireComplete('score()');
    return cleanCount() / total;
  }

  function passed(): boolean {
    return score() >= CHECKPOINT_PASS_RATIO;
  }

  function summary(): RomanceExamSummary {
    requireComplete('summary()');
    const byCat = new Map(categoryOrder.map((c) => [c, { category: c, asked: 0, clean: 0 }]));
    for (const r of results) {
      const cat = byCat.get(r.category)!;
      cat.asked += 1;
      if (r.passed) cat.clean += 1;
    }
    return {
      perItem: results.slice(),
      clean: cleanCount(),
      total,
      score: score(),
      passed: passed(),
      byCategory: categoryOrder.map((c) => byCat.get(c)!),
      missed: results.filter((r) => !r.passed).map((r) => r.itemId)
    };
  }

  return { current, grade, isComplete, progress, score, passed, summary };
}
