// tools/build_app_data.mjs — single source of truth: src/data.js -> app/src/lib/data/data.js
// Byte-reproducible (mirrors tools/build_audio_js.py). Run: node tools/build_app_data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = readFileSync(root + 'src/data.js', 'utf8');

// src/data.js is a classic script that assigns window.BB.data. Run it in a
// sandbox whose only global is `window`, then read the data back out.
const sandbox = { window: {} };
// eslint-disable-next-line no-new-func
new Function('window', src).call(sandbox, sandbox.window);
const data = sandbox.window.BB.data;
if (!data || !Array.isArray(data.wines)) throw new Error('failed to extract BB.data from src/data.js');

// Merge the curated full-menu sections (the ~38 by-the-bottle wines, beer, dessert +
// digestif fortifieds) — web-sourced + verified in Phase B (docs/research/
// 2026-06-07-v2-content-sourced.json) and curated by tools/curate_sourced.mjs. Display
// fields only; the per-field sources + accuracy flags live in the research doc and
// docs/v2-open-questions.md, not in the shipped client bundle.
const full = JSON.parse(readFileSync(root + 'src/data-fullmenu.json', 'utf8'));
data.bottles = full.bottles;
data.beers = full.beers;
data.fortifieds = full.fortifieds;
// The 10 new guest-ask translator rows (Gamay, Viognier, Albariño, Barolo, Cava, the
// honest "sweet plush red" expectation-setter, …) are merged at build time so v1's
// src/data.js stays untouched while the app translator deck + Reference get them.
data.translator = data.translator.concat(full.translatorRows);

const header =
  '// app/src/lib/data/data.js — GENERATED from src/data.js by tools/build_app_data.mjs.\n' +
  '// Do NOT edit by hand. Edit src/data.js and re-run: node tools/build_app_data.mjs\n';
const body = 'export const data = ' + JSON.stringify(data, null, 2) + ';\n';
writeFileSync(root + 'app/src/lib/data/data.js', header + body);
console.log('wrote app/src/lib/data/data.js (' + data.wines.length + ' wines)');
