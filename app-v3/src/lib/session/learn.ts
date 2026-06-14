// Task E — learn session: first exposure of a unit. Pretest (errorful
// generation, NO SRS effect) → teach (unit order) → quiz (test-to-criterion:
// ladder mc → cued → free, misses recycle, graduation = correct at free =
// 3 correct recalls in-session). Full UI contract: ./types.ts.
import { mcFor } from '../journey/items';
import type { JourneyItem } from '../journey/types';
import { describeStep, insertRecycled, shuffled } from './shared';
import type {
  LearnDeps,
  LearnItemResult,
  LearnProgress,
  LearnSession,
  LearnSummary,
  McAnswer,
  Rung,
  Step
} from './types';

/** The learn ladder's rungs ('romance' belongs to the Romance drill only). */
type LadderRung = Extract<Rung, 'mc' | 'cued' | 'free'>;

/** Minimum quiz steps left for an entry sitting on a given rung. */
const RUNGS_LEFT: Record<LadderRung, number> = { mc: 3, cued: 2, free: 1 };
const NEXT_RUNG: Record<'mc' | 'cued', LadderRung> = { mc: 'cued', cued: 'free' };

interface QuizEntry {
  item: JourneyItem;
  rung: LadderRung;
}

export function createLearnSession(items: readonly JourneyItem[], deps: LearnDeps): LearnSession {
  const rng = deps.rng ?? Math.random;
  const pretest = items.slice(); // unit order
  const teach = items.slice(); // unit order
  // Quiz order is shuffled so retrieval never mirrors the teach sequence.
  const quiz: QuizEntry[] = shuffled(items, rng).map((item) => ({ item, rung: 'mc' }));

  const missCounts = new Map<string, number>(); // quiz misses per item id
  const graduatedList: LearnItemResult[] = []; // in graduation order
  let pendingMc: { correct: boolean } | null = null; // answered, awaiting advance()
  let position = 0;
  let totalMisses = 0;

  function current(): Step | null {
    if (pretest.length > 0) return { type: 'pretest-mc', item: pretest[0], rung: 'mc' };
    if (teach.length > 0) return { type: 'teach', item: teach[0] };
    if (quiz.length > 0) {
      const entry = quiz[0];
      // MC variety: pretest is round 0, so the first quiz-mc is round 1 (a
      // different question), and each recycle after a miss bumps it again.
      if (entry.rung === 'mc')
        return { type: 'quiz', item: entry.item, rung: 'mc', round: 1 + (missCounts.get(entry.item.id) ?? 0) };
      return { type: 'quiz', item: entry.item, rung: entry.rung };
    }
    return null;
  }

  function answerMc(choiceIndex: number): McAnswer {
    const step = current();
    if (!step) throw new Error('session: already complete');
    if (step.type !== 'pretest-mc' && !(step.type === 'quiz' && step.rung === 'mc'))
      throw new Error(`session: answerMc is only valid on an MC step (current: ${describeStep(step)})`);
    if (pendingMc) throw new Error('session: MC already answered — call advance()');
    // Grade against the SAME round the UI rendered (step.round) — pretest is 0.
    const mc = mcFor(step.item, step.round ?? 0);
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= mc.choices.length)
      throw new Error(`session: choiceIndex ${choiceIndex} out of range (0..${mc.choices.length - 1})`);
    pendingMc = { correct: choiceIndex === mc.answerIndex };
    return { correct: pendingMc.correct, answerIndex: mc.answerIndex };
  }

  function selfGrade(gotIt: boolean): void {
    const step = current();
    if (!step) throw new Error('session: already complete');
    if (step.type !== 'quiz' || step.rung === 'mc')
      throw new Error(
        `session: selfGrade is only valid on a cued/free quiz step (current: ${describeStep(step)})`
      );
    position += 1;
    resolveQuiz(gotIt);
  }

  function advance(): void {
    const step = current();
    if (!step) throw new Error('session: already complete');
    if (step.type === 'teach') {
      position += 1;
      teach.shift();
      return;
    }
    if (step.type === 'pretest-mc') {
      if (!pendingMc) throw new Error('session: answer the MC before advancing');
      pendingMc = null; // pretest outcome is discarded: errorful generation, no SRS effect
      position += 1;
      pretest.shift();
      return;
    }
    // quiz step (learn never emits 'reteach'; the type check narrows the union)
    if (step.type !== 'quiz' || step.rung !== 'mc')
      throw new Error('session: cued/free quiz steps resolve via selfGrade(gotIt), not advance()');
    if (!pendingMc) throw new Error('session: answer the MC before advancing');
    const { correct } = pendingMc;
    pendingMc = null;
    position += 1;
    resolveQuiz(correct);
  }

  function resolveQuiz(correct: boolean): void {
    const entry = quiz.shift();
    if (!entry) throw new Error('session: no quiz step to resolve'); // unreachable
    const id = entry.item.id;
    if (!correct) {
      // Miss: keep the rung, recycle ~3 steps later. Nothing else resets.
      missCounts.set(id, (missCounts.get(id) ?? 0) + 1);
      totalMisses += 1;
      insertRecycled(quiz, entry);
      return;
    }
    if (entry.rung !== 'free') {
      // Climb one rung; re-queue at the end so other items interleave.
      quiz.push({ item: entry.item, rung: NEXT_RUNG[entry.rung] });
      return;
    }
    // Correct at free = graduation (3rd correct recall this session).
    const misses = missCounts.get(id) ?? 0;
    const grade: 'good' | 'hard' = misses > 0 ? 'hard' : 'good';
    deps.onIntroduce(id);
    deps.onResult(id, grade);
    graduatedList.push({ itemId: id, misses, grade });
  }

  function isComplete(): boolean {
    return pretest.length === 0 && teach.length === 0 && quiz.length === 0;
  }

  function progress(): LearnProgress {
    const remaining =
      pretest.length + teach.length + quiz.reduce((n, e) => n + RUNGS_LEFT[e.rung], 0);
    return {
      position,
      total: position + remaining,
      graduated: graduatedList.length,
      misses: totalMisses
    };
  }

  function summary(): LearnSummary {
    if (!isComplete())
      throw new Error('session: summary() is only available once the session is complete');
    return { perItem: graduatedList.slice(), graduated: graduatedList.length, misses: totalMisses };
  }

  return { current, answerMc, selfGrade, advance, isComplete, progress, summary };
}
