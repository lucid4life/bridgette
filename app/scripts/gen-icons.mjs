// app/scripts/gen-icons.mjs — rasterize static/icon.svg into PWA PNG icons using the
// installed Playwright Chromium (no extra image deps). Run from app/: node scripts/gen-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const appRoot = fileURLToPath(new URL('..', import.meta.url)); // app/
const svg = readFileSync(appRoot + 'static/icon.svg', 'utf8');

const targets = [
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-512.png', size: 512 },
  { file: 'pwa-maskable-512.png', size: 512 }, // full-bleed dark bg = safe as maskable
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon.png', size: 48 }
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;padding:0">` +
      svg.replace('width="512" height="512"', `width="${t.size}" height="${t.size}"`) +
      `</body></html>`
  );
  const buf = await page.locator('svg').screenshot({ omitBackground: false });
  writeFileSync(appRoot + 'static/' + t.file, buf);
  console.log('wrote static/' + t.file + ' (' + t.size + 'px)');
}
await browser.close();
