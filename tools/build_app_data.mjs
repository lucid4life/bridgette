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

const header =
  '// app/src/lib/data/data.js — GENERATED from src/data.js by tools/build_app_data.mjs.\n' +
  '// Do NOT edit by hand. Edit src/data.js and re-run: node tools/build_app_data.mjs\n';
const body = 'export const data = ' + JSON.stringify(data, null, 2) + ';\n';
writeFileSync(root + 'app/src/lib/data/data.js', header + body);
console.log('wrote app/src/lib/data/data.js (' + data.wines.length + ' wines)');
