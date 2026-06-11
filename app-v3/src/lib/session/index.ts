// Task E — public surface of the session engine. Import from '$lib/session'.
// The full UI contract (step → render/resolve matrix, progress + summary
// semantics, error rules) is documented in ./types.ts — read it first.
export * from './types';
export { createLearnSession } from './learn';
export { createReviewSession } from './review';
export { createCheckpointSession } from './checkpoint';
export { RECYCLE_GAP } from './shared';
// Same 0.85 bar the path gating uses — re-exported so the runner UI needs
// only one import.
export { CHECKPOINT_PASS_RATIO } from '../journey/gating';
