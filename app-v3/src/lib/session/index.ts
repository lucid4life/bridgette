// Task E — public surface of the session engine. Import from '$lib/session'.
// The full UI contract (step → render/resolve matrix, progress + summary
// semantics, error rules) is documented in ./types.ts — read it first.
export * from './types';
export { createLearnSession } from './learn';
export { createReviewSession } from './review';
export { createCheckpointSession } from './checkpoint';
export { createRomanceSession } from './romance';
export { createBuildSession } from './build';
export { createPairingDrillSession } from './pairing-drill';
export {
  createMockTestSession,
  assignMockTypes,
  mockMcContentFor,
  mockQtypeOf,
  MOCK_TYPE_ROTATION
} from './mock-test';
export type { MockTypePredicates } from './mock-test';
export { createRomanceExamSession, requiredComponents } from './romance-exam';
export { createAllergenSession } from './allergen';
export { createJudgmentSession } from './judgment';
export type { JudgmentQuestion, JudgmentSession, JudgmentSummary } from './judgment';
export { romanceOrder } from './romance-order';
export { RECYCLE_GAP } from './shared';
// Same 0.85 bar the path gating uses — re-exported so the runner UI needs
// only one import.
export { CHECKPOINT_PASS_RATIO } from '../journey/gating';
