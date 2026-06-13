// The "judgment round" — a one-pass, MC-only, SCORE-ONLY quiz over pre-minted
// questions that span dishes (safe calls / mods calls / glossary). It writes
// NOTHING to the SRS by construction (the deps carry no hooks): a safe-call
// has no single home item to grade, so the round reports a score and a miss
// list instead — honest, like the mock test.
import { shuffled } from './shared';
import type { McAnswer, Rng } from './types';

export interface JudgmentQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  why?: string;
  confirmLine?: string;
}

export interface JudgmentResult {
  id: string;
  correct: boolean;
}

export interface JudgmentSummary {
  perItem: JudgmentResult[];
  correct: number;
  total: number;
  score: number;
}

export interface JudgmentSession {
  current(): JudgmentQuestion | null;
  answerMc(choiceIndex: number): McAnswer;
  advance(): void;
  isComplete(): boolean;
  progress(): { position: number; total: number; correct: number; misses: number };
  summary(): JudgmentSummary;
}

export function createJudgmentSession(
  questions: readonly JudgmentQuestion[],
  deps: { rng?: Rng } = {}
): JudgmentSession {
  if (questions.length === 0) throw new Error('session: a judgment round needs questions');
  const queue = shuffled(questions, deps.rng ?? Math.random);
  const total = queue.length;
  const results: JudgmentResult[] = [];
  let pendingMc: { correct: boolean } | null = null;

  const current = (): JudgmentQuestion | null => queue[0] ?? null;

  function answerMc(choiceIndex: number): McAnswer {
    const head = queue[0];
    if (!head) throw new Error('session: already complete');
    if (pendingMc) throw new Error('session: MC already answered — call advance()');
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= head.choices.length)
      throw new Error(`session: choiceIndex ${choiceIndex} out of range`);
    pendingMc = { correct: choiceIndex === head.answerIndex };
    return { correct: pendingMc.correct, answerIndex: head.answerIndex };
  }

  function advance(): void {
    const head = queue[0];
    if (!head) throw new Error('session: already complete');
    if (!pendingMc) throw new Error('session: answer the MC before advancing');
    results.push({ id: head.id, correct: pendingMc.correct });
    pendingMc = null;
    queue.shift();
  }

  const isComplete = (): boolean => queue.length === 0;
  const correctCount = (): number => results.filter((r) => r.correct).length;

  function progress() {
    const correct = correctCount();
    return { position: results.length, total, correct, misses: results.length - correct };
  }

  function summary(): JudgmentSummary {
    if (!isComplete())
      throw new Error('session: summary() is only available once the judgment round is complete');
    return { perItem: results.slice(), correct: correctCount(), total, score: correctCount() / total };
  }

  return { current, answerMc, advance, isComplete, progress, summary };
}
