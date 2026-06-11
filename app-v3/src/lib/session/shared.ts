// Task E — small pure helpers shared by the three session factories.
import type { Rng, Step } from './types';

/** A missed step re-enters its queue after this many other steps (or at the
 * end when fewer remain) — far enough to break echo recall, near enough to
 * retry while the correction is still warm. */
export const RECYCLE_GAP = 3;

/** Mutates `queue`: insert `entry` RECYCLE_GAP positions in (or at the end). */
export function insertRecycled<T>(queue: T[], entry: T): void {
  queue.splice(Math.min(RECYCLE_GAP, queue.length), 0, entry);
}

/** Fisher-Yates over a copy; the input array is never touched. */
export function shuffled<T>(arr: readonly T[], rng: Rng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** For error messages: 'quiz/cued dish:french-fries'. */
export function describeStep(step: Step): string {
  const rung = 'rung' in step ? `/${step.rung}` : '';
  return `${step.type}${rung} ${step.item.id}`;
}
