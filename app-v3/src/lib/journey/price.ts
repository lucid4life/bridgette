// §4 dedup: ONE glass-wine price formatter. The by-the-glass price is stored as
// a "5oz | 8oz | bottle" ladder string; both the wine teach card and prep-my-
// bottle render it the same way — keep that rule in one place so they can't drift.
/** "15 | 24 | 75" → "5oz $15 · 8oz $24 · bottle $75"; a non-3-part value → "$<raw>". */
export function formatGlassPrice(p: string): string {
  const parts = p.split('|').map((s) => s.trim());
  return parts.length === 3
    ? `5oz $${parts[0]} · 8oz $${parts[1]} · bottle $${parts[2]}`
    : `$${p}`;
}
