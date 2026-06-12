// Photos shipped in app-v3/static/img/<photoId>.webp (scraped + matched by
// tools/photo_scrape — source evidence in static/img/manifest.json). The id set
// is DERIVED from that manifest (bundled at build time) so it can never drift
// from what's actually on disk. TeachCard only renders <img> for ids listed
// here, so missing files never 404 (clean console, clean offline cache); the
// onerror fallback in TeachCard still covers a stale entry. Everything else
// keeps the branded no-photo placeholder.
import manifest from '../../../../static/img/manifest.json';

export const PHOTO_IDS: ReadonlySet<string> = new Set<string>(
  manifest.images.map((img) => img.id)
);
