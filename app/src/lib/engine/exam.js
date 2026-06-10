// app/src/lib/engine/exam.js — pure Mock Menu-Test exam builder.
// A fixed-blueprint mixed exam over the OBJECTIVE decks (no self-graded
// pronunciation — same honesty rule as buildReadiness). Cards are drawn per
// deck via generateDeck, shuffled, then interleaved with one final shuffle —
// the exact composition pattern buildReadiness uses. Scoring reuses
// scoreReadiness(results); there is no separate exam scorer.
import { generateDeck, shuffle } from './training.js';

// Full exam: 30 questions. Weights mirror floor priority (identity + pairing first).
export const EXAM_BLUEPRINT = {
  'wine-identity': 6,
  pairing: 5,
  'pairing-principle': 4,
  structure: 4,
  translator: 4,
  mystery: 3,
  upsell: 2,
  'wine-dish': 2
};

export const EXAM_MINUTES = { full: 12, half: 6 };

// opts: { half?: boolean, rng?: () => number } — rng seedable like buildReadiness.
export function buildExam(data, opts = {}) {
  if (!data) throw new Error('engine.buildExam: data is required');
  const rng = opts.rng || Math.random;
  let picked = [];
  Object.keys(EXAM_BLUEPRINT).forEach((id) => {
    const n = opts.half ? Math.ceil(EXAM_BLUEPRINT[id] / 2) : EXAM_BLUEPRINT[id];
    const cards = generateDeck(id, data);
    picked = picked.concat(shuffle(cards, rng).slice(0, n));
  });
  return shuffle(picked, rng);
}
