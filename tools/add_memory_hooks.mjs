// tools/add_memory_hooks.mjs — one-off ADDITIVE merge of per-dish memory hooks
// (§0b) into the hand-authored src/data.js foods array. For each of the 41 path
// dishes it inserts `memoryHook:"…"` immediately before that line's `, tags:[`,
// mirroring tools/merge_food_syllabus.mjs — every existing byte of the line
// stays untouched; only the new field is added. The hooks are vivid mnemonics
// grounded ONLY in each dish's official name/components/description (no invented
// menu facts) — authored + adversarially verified by the dish-memory-hooks
// workflow, then hand-finished. Source of record: docs/handoffs/2026-06-13-dish-memory-hooks.json.
// Run once from the repo root: node tools/add_memory_hooks.mjs && node tools/build_app_data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const DATA_PATH = root + 'src/data.js';
const HOOKS_PATH = root + 'docs/handoffs/2026-06-13-dish-memory-hooks.json';

const assert = (cond, msg) => { if (!cond) throw new Error('ASSERT: ' + msg); };

const { hooks } = JSON.parse(readFileSync(HOOKS_PATH, 'utf8'));
const ids = Object.keys(hooks);
assert(ids.length === 41, `41 hooks expected (got ${ids.length})`);

const original = readFileSync(DATA_PATH, 'utf8');
const lines = original.split('\n');

// Locate the foods block (each food is ONE compact line).
const foodsStart = lines.findIndex((l) => /^\s*foods:\s*\[\s*\r?$/.test(l));
assert(foodsStart !== -1, 'found foods: [ line');
let foodsEnd = -1;
for (let i = foodsStart + 1; i < lines.length; i++) {
  if (/^\s*\],?\s*\r?$/.test(lines[i])) { foodsEnd = i; break; }
}
assert(foodsEnd !== -1, 'found foods closing ],');

// Idempotency guard: refuse to double-insert.
for (let i = foodsStart + 1; i < foodsEnd; i++) {
  assert(!lines[i].includes(', memoryHook:'), 'foods block already has memoryHook — refusing to run twice');
}

for (const id of ids) {
  const hook = hooks[id];
  assert(typeof hook === 'string' && hook.length > 0, `${id}: non-empty hook`);
  const token = `{id:${JSON.stringify(id)},`;
  const hits = [];
  for (let i = foodsStart + 1; i < foodsEnd; i++) if (lines[i].includes(token)) hits.push(i);
  assert(hits.length === 1, `${id}: found exactly once in foods block (got ${hits.length})`);
  const li = hits[0];
  assert(lines[li].split(', tags:[').length === 2, `${id}: exactly one ", tags:[" on its line`);
  lines[li] = lines[li].replace(', tags:[', `, memoryHook:${JSON.stringify(hook)}, tags:[`);
}

writeFileSync(DATA_PATH, lines.join('\n'));
console.log(`inserted ${ids.length} memoryHook fields into src/data.js — now run: node tools/build_app_data.mjs`);
