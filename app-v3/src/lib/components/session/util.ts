// Task H — tiny helpers shared by the session routes: resolve Stage-1 items
// from store ids (the store speaks item-id strings; the engine wants
// JourneyItems), and display names for summaries (names, never ids).
import { allStage1Items, teachFor } from '$lib/journey/items';
import type { JourneyItem, ProgressView } from '$lib/journey/types';
import type { ReviewEntry } from '$lib/session';

let byId: Map<string, JourneyItem> | null = null;

/** Stage-1 item lookup (lazy; item derivation is pure + stable). */
export function stage1ItemById(id: string): JourneyItem | undefined {
  byId ??= new Map(allStage1Items().map((i) => [i.id, i]));
  return byId.get(id);
}

/** Human name for an item — dish name or service-call title. */
export function itemName(item: JourneyItem): string {
  return teachFor(item).name;
}

/** Display name straight from a store id; falls back to the id (never blank). */
export function nameOf(itemId: string): string {
  const item = stage1ItemById(itemId);
  return item ? itemName(item) : itemId;
}

/**
 * Store ids → review entries, caller order preserved. Ids outside Stage 1 are
 * skipped (Phase 1 only has Stage 1 content to render them with) — LOUDLY, so
 * future-stage items silently vanishing from /review shows up in dev.
 */
export function toStage1Entries(ids: string[], view: ProgressView): ReviewEntry[] {
  return ids.flatMap((id) => {
    const item = stage1ItemById(id);
    if (!item) {
      if (import.meta.env.DEV)
        console.warn(`session: dropping store id '${id}' — not a Stage-1 item (no content to render yet)`);
      return [];
    }
    return [{ item, rank: view.rankOf(id) }];
  });
}
