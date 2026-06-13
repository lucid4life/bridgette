// Task D — journey content model types (spec: docs/handoffs/2026-06-11-v3-phase1-spec.md).
// The SRS tracks ITEMS (one per knowledge unit), not UI cards. Namespaces:
// 'dish:<foodId>' and 'service:<slug>' — minted here for v3; the 428 frozen v2
// engine card ids are reused only as content material, never as item ids.
import type { Rank } from '../srs/scheduler';

// 'dish:<id>' (component knowledge) · 'service:<slug>' (day-one + bar arc calls) ·
// 'allergen:<foodId>' (Stage 2 — that dish's allergen flags, tracked apart from
// its components so Stage 1 progress never auto-completes Stage 2) ·
// 'build:<cocktailId>' (Stage 3 — the cocktail's official build, keyed into
// data.cocktails) · 'wine:<wineId>' (Stage 4 — the by-the-glass pour's identity +
// ten-second story, keyed into data.wines) · 'pairing:<foodId>' (Stage 5 — the
// dish→pour call + the why-lever, dish-anchored so it keys into data.foods).
export type ItemKind = 'dish' | 'service' | 'allergen' | 'build' | 'wine' | 'pairing';

export interface JourneyItem {
  id: string; // 'dish:tuna-crudo' | 'build:jr-stargazer' | 'wine:hiedler-loss'
  kind: ItemKind;
  unitId: string; // home lesson unit (checkpoint items keep their home unit)
  foodId?: string; // dish + allergen + pairing items: key into data.foods
  cocktailId?: string; // build items: key into data.cocktails
  wineId?: string; // wine items: key into data.wines
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
