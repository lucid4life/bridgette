// Task D — gating rules: open self-paced modules, the 85% rank criterion,
// checkpoint availability, test-out, and stage progress. Pure functions over a
// minimal ProgressView — the store is never imported here.
import { itemsForUnit } from './items';
import { STAGES, stageById, unitById } from './stages';
import type { ProgressView, Stage, Unit } from './types';

/** A unit completes when >= this share of its items reach rank >= 'learning'. */
export const UNIT_PASS_RATIO = 0.85;
/** A checkpoint session passes at >= this score (same bar as units). */
export const CHECKPOINT_PASS_RATIO = 0.85;

export type UnitStatus = 'locked' | 'available' | 'started' | 'complete';
export type StageStatus = UnitStatus;

/** rank >= 'learning' — i.e. the item has been studied at least once. */
function atCriterion(view: ProgressView, itemId: string): boolean {
  return view.rankOf(itemId) !== 'new';
}

function criterionRatio(view: ProgressView, itemIds: string[]): number {
  if (itemIds.length === 0) return 0;
  return itemIds.filter((id) => atCriterion(view, id)).length / itemIds.length;
}

export function unitComplete(unitId: string, view: ProgressView): boolean {
  if (view.unitDone[unitId]) return true; // recorded gate pass or test-out wins
  // A checkpoint completes ONLY by being sat (a unitDone record): its items are
  // the lessons' items, so the ratio criterion would mark the shift check done
  // the moment the lessons are — without it ever being taken.
  if (unitById(unitId).unit.kind === 'checkpoint') return false;
  const ids = itemsForUnit(unitId).map((i) => i.id);
  return criterionRatio(view, ids) >= UNIT_PASS_RATIO;
}

function lessonUnits(stage: Stage): Unit[] {
  return stage.units.filter((u) => u.kind === 'lesson');
}

/** A stage is complete when it has units and every one is complete. */
export function stageComplete(stageId: string, view: ProgressView): boolean {
  const stage = stageById(stageId);
  return stage.units.length > 0 && stage.units.every((u) => unitComplete(u.id, view));
}

/** Stages unlock sequentially: the first stage is always open; a later stage
 * opens when the one before it is complete. `locked: true` (stages with no
 * content yet) wins outright. */
export function stageUnlocked(stageId: string, view: ProgressView): boolean {
  const idx = STAGES.findIndex((s) => s.id === stageId);
  if (idx === -1 || STAGES[idx].locked) return false;
  if (idx === 0) return true;
  return stageComplete(STAGES[idx - 1].id, view);
}

/** Module availability: every lesson module of an unlocked stage is open, in
 * any order — self-paced, no finish-the-previous gate and no per-day throttle.
 * The checkpoint is the one hold-back: it opens only when ALL lesson units are
 * complete (test-out still offers it cold any time). */
function unitAvailable(unitId: string, view: ProgressView): boolean {
  const { unit, stage } = unitById(unitId);
  if (!stageUnlocked(stage.id, view)) return false;
  if (unit.kind === 'checkpoint')
    return lessonUnits(stage).every((u) => unitComplete(u.id, view));
  return true;
}

export function unitStatus(unitId: string, view: ProgressView): UnitStatus {
  if (unitComplete(unitId, view)) return 'complete';
  if (!unitAvailable(unitId, view)) return 'locked';
  // A checkpoint has no partial state — its items belong to the lessons, so
  // "some at criterion" says nothing about the shift check itself.
  if (unitById(unitId).unit.kind === 'checkpoint') return 'available';
  const started = itemsForUnit(unitId).some((i) => atCriterion(view, i.id));
  return started ? 'started' : 'available';
}

/**
 * Test-out is the skip-ahead affordance: offered for any not-yet-complete unit
 * of an unlocked stage, any time — and for a whole stage (taken on the stage's
 * checkpoint) while the stage is unlocked and not fully complete. Accepts a
 * unitId or a stageId.
 */
export function testOutAvailable(unitOrStageId: string, view: ProgressView): boolean {
  const stage = STAGES.find((s) => s.id === unitOrStageId);
  if (stage) {
    if (!stageUnlocked(stage.id, view)) return false;
    return !stage.units.every((u) => unitComplete(u.id, view));
  }
  const { stage: home } = unitById(unitOrStageId);
  if (!stageUnlocked(home.id, view)) return false;
  return !unitComplete(unitOrStageId, view);
}

export function stageStatus(stageId: string, view: ProgressView): StageStatus {
  const stage = stageById(stageId);
  if (!stageUnlocked(stageId, view)) return 'locked';
  if (stageComplete(stageId, view)) return 'complete';
  const started = stageItemIds(stage).some((id) => atCriterion(view, id));
  return started ? 'started' : 'available';
}

/** Unique item ids of a stage (the checkpoint repeats lesson items — skip it). */
function stageItemIds(stage: Stage): string[] {
  const seen = new Set<string>();
  for (const unit of stage.units) {
    if (unit.kind === 'checkpoint') continue;
    for (const item of itemsForUnit(unit.id)) seen.add(item.id);
  }
  return [...seen];
}

export interface UnitProgress {
  /** Items at the criterion (rank >= 'learning'). */
  studied: number;
  total: number;
  ratio: number;
}

/** Per-unit criterion progress — the ONE place the "studied" count is derived
 * (the Path's node meters consume this instead of re-deriving rankOf !== 'new'). */
export function unitProgress(unitId: string, view: ProgressView): UnitProgress {
  const ids = itemsForUnit(unitId).map((i) => i.id);
  const studied = ids.filter((id) => atCriterion(view, id)).length;
  return { studied, total: ids.length, ratio: ids.length === 0 ? 0 : studied / ids.length };
}

/** The continue-target: first 'started' unit of the stage, else the first
 * 'available' one, else null (stage complete). Today + the Path share this. */
export function nextUnit(stageId: string, view: ProgressView): Unit | null {
  const units = stageById(stageId).units;
  const statuses = units.map((u) => unitStatus(u.id, view));
  const started = statuses.indexOf('started');
  if (started !== -1) return units[started];
  const available = statuses.indexOf('available');
  return available !== -1 ? units[available] : null;
}

/** Where a unit is taken: checkpoints have their own surface. */
export function unitHref(stage: Stage, unit: Unit): string {
  return unit.kind === 'checkpoint' ? `/checkpoint/${stage.id}` : `/unit/${unit.id}`;
}

export interface StageProgress {
  itemsAtCriterion: number;
  totalItems: number;
  ratio: number;
}

export function stageProgress(stageId: string, view: ProgressView): StageProgress {
  const ids = stageItemIds(stageById(stageId));
  const itemsAtCriterion = ids.filter((id) => atCriterion(view, id)).length;
  return {
    itemsAtCriterion,
    totalItems: ids.length,
    ratio: ids.length === 0 ? 0 : itemsAtCriterion / ids.length
  };
}
