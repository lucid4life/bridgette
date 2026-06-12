// Photos shipped in app-v3/static/img/<photoId>.webp (scraped + matched by
// tools/photo_scrape — source evidence in static/img/manifest.json). TeachCard
// only renders <img> for ids listed here, so missing files never 404 (clean
// console, clean offline cache); the onerror fallback in TeachCard still
// covers a stale entry. Everything else keeps the branded no-photo placeholder.
export const PHOTO_IDS: ReadonlySet<string> = new Set<string>([
  // food (Stage-1 teach cards)
  'bread-butter',
  'the-banana-pie',
  'tuna-crudo',
  'endive',
  // cocktails (Stage 3 — same id convention, shipped now so the set stays
  // the single manifest of what's on disk)
  'french-export',
  'spicy-sandia',
  'eat-apres-love',
  'heartbreak-mountain',
  'rolling-canoe'
]);
