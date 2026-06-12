// Dish photos shipped in app-v3/static/img/<foodId>.webp. NONE exist yet —
// the branded no-photo placeholder IS the current state (tools/photo_scrape
// will fill the folder later). TeachCard only renders <img> for ids listed
// here, so missing files never 404 (clean console, clean offline cache);
// the onerror fallback in TeachCard still covers a stale entry.
export const PHOTO_IDS: ReadonlySet<string> = new Set<string>([]);
