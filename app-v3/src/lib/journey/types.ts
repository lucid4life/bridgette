// Task D — journey content model types (spec: docs/handoffs/2026-06-11-v3-phase1-spec.md).
// The SRS tracks ITEMS (one per knowledge unit), not UI cards. Namespaces:
// 'dish:<foodId>' and 'service:<slug>' — minted here for v3; the 428 frozen v2
// engine card ids are reused only as content material, never as item ids.
import type { Rank } from '../srs/scheduler';

export type ItemKind = 'dish' | 'service';

export interface JourneyItem {
  id: string; // 'dish:tuna-crudo' | 'service:seat-1-left'
  kind: ItemKind;
  unitId: string; // home lesson unit (checkpoint items keep their home unit)
  foodId?: string; // dish items only: key into data.foods
}

export interface Unit {
  id: string;
  title: string;
  blurb: string;
  kind: 'lesson' | 'checkpoint';
  itemIds?: never; // items are DERIVED (journey/items.ts), never stored on the unit
}

export type Track = 'food' | 'allergens' | 'bar' | 'wine' | 'pairings';

export interface Stage {
  id: string;
  title: string;
  track: Track;
  blurb: string;
  units: Unit[];
  locked?: boolean; // Phase 1: stages 2-5 are declared but locked
}

/**
 * Minimal read-interface the gating logic needs from the progress store.
 * Deliberately NOT the store itself — gating stays pure and store-agnostic.
 * `unitDone` records explicit completions: 'gate' = passed the unit's gate,
 * 'test-out' = skipped ahead by passing cold.
 */
export interface ProgressView {
  rankOf(itemId: string): Rank;
  unitDone: Record<string, 'gate' | 'test-out'>;
}
