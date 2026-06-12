// The Romance drill's asking order — a pure helper so the policy is testable
// without a store. Priority tiers: shakiest/lapsed first (in the caller's
// shaky ranking), then never-introduced, then the rest (both in given order).
// Categories are then INTERLEAVED greedily: each slot takes the highest-
// priority remaining item whose category differs from the previous slot's,
// falling back to the highest-priority item when a same-category run is
// unavoidable. Deterministic for a given store state — no rng anywhere.
import type { JourneyItem } from '../journey/types';

export function romanceOrder(
  items: readonly JourneyItem[],
  /** Lapse-ranked ids, shakiest first (progress.shakyItems()); non-dish ids are ignored. */
  shakyIds: readonly string[],
  /** True when the item already has an SRS record. */
  isIntroduced: (itemId: string) => boolean,
  /** Menu category (drives the interleave). */
  categoryOf: (item: JourneyItem) => string
): JourneyItem[] {
  const shakyRank = new Map(shakyIds.map((id, i) => [id, i] as const));
  const tierOf = (item: JourneyItem): number =>
    shakyRank.has(item.id) ? 0 : isIntroduced(item.id) ? 2 : 1;

  // Priority order: tier, then shaky rank (tier 0) / given order (tiers 1-2).
  const pool = items
    .map((item, index) => ({ item, tier: tierOf(item), rank: shakyRank.get(item.id) ?? index }))
    .sort((a, b) => a.tier - b.tier || a.rank - b.rank);

  const out: JourneyItem[] = [];
  let prevCategory: string | null = null;
  while (pool.length > 0) {
    let at = pool.findIndex((e) => categoryOf(e.item) !== prevCategory);
    if (at === -1) at = 0; // same-category run unavoidable — keep priority order
    const [next] = pool.splice(at, 1);
    out.push(next.item);
    prevCategory = categoryOf(next.item);
  }
  return out;
}
