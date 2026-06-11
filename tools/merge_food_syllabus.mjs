// tools/merge_food_syllabus.mjs — one-off merge of the official Food Syllabus
// (June 2026, docs/handoffs/food-syllabus-2026-06.parsed.json) into the
// hand-authored src/data.js foods array. Purely ADDITIVE: for each matched food
// line it inserts `ingredients`, `description`, `allergens` (+ `allergenNote`
// when non-null, + `vegan:true` only where the syllabus states it outright)
// immediately before that line's `, tags:[` — every existing byte of the line
// stays untouched. Run once from the repo root: node tools/merge_food_syllabus.mjs
//
// TYPO POLICY (logged in docs/v2-open-questions.md, 2026-06-10 section): exactly
// three obvious syllabus typos are fixed in the data — "Flor di Latte" → "Fior di
// Latte" (margherita), "Italian Merigue" → "Italian Meringue" (the-banana-pie),
// "ndjua" → "'nduja" (snap-peas description). Everything else is verbatim-official.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = fileURLToPath(new URL('..', import.meta.url));
const DATA_PATH = root + 'src/data.js';
const PARSED_PATH = root + 'docs/handoffs/food-syllabus-2026-06.parsed.json';

const assert = (cond, msg) => { if (!cond) throw new Error('ASSERT: ' + msg); };

// Evaluate src/data.js the same way tools/build_app_data.mjs does.
function evalData(srcText) {
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function('window', srcText).call(sandbox, sandbox.window);
  const data = sandbox.window.BB.data;
  assert(data && Array.isArray(data.foods), 'failed to extract BB.data');
  return data;
}

const parsed = JSON.parse(readFileSync(PARSED_PATH, 'utf8'));
const original = readFileSync(DATA_PATH, 'utf8');
const before = evalData(original);

// Only the dishes the syllabus marks vegan outright get vegan:true.
// french-fries is deliberately EXCLUDED: its veganness is conditional
// (sub ketchup) and lives in its allergenNote — locked decision.
const VEGAN_OK = new Set(['hummus-chips', 'cashews']);

// The three sanctioned typo fixes (and ONLY these).
const TYPO_FIXES = {
  margherita: (d) => {
    d.ingredients = d.ingredients.map((i) => (i === 'Flor di Latte' ? 'Fior di Latte' : i));
    assert(d.ingredients.includes('Fior di Latte'), 'margherita: Fior di Latte fix applied');
  },
  'the-banana-pie': (d) => {
    d.ingredients = d.ingredients.map((i) => (i === 'Italian Merigue' ? 'Italian Meringue' : i));
    assert(d.ingredients.includes('Italian Meringue'), 'the-banana-pie: Meringue fix applied');
  },
  'snap-peas': (d) => {
    const beforeDesc = d.description;
    d.description = d.description
      .replace(/‘ndjua/g, '‘nduja') // ‘ndjua → ‘nduja (misspelled, apostrophe present)
      .replace(/\(ndjua/g, '(‘nduja'); // (ndjua → (‘nduja (misspelled, apostrophe missing)
    assert(beforeDesc !== d.description, 'snap-peas: nduja fix applied');
    assert(!/ndjua/.test(d.description), 'snap-peas: no "ndjua" remains');
  },
};

const norm = (s) => s.replace(/\s+/g, ' ').trim();

// ---- locate the foods block (each food is ONE compact line) ----
const lines = original.split('\n');
const foodsStart = lines.findIndex((l) => /^\s*foods:\s*\[\s*\r?$/.test(l));
assert(foodsStart !== -1, 'found foods: [ line');
let foodsEnd = -1;
for (let i = foodsStart + 1; i < lines.length; i++) {
  if (/^\s*\],?\s*\r?$/.test(lines[i])) { foodsEnd = i; break; }
}
assert(foodsEnd !== -1, 'found foods closing ],');

const matched = parsed.dishes.filter((d) => d.matchedFoodId);
assert(matched.length === 41, `41 matched dishes (got ${matched.length})`);
const skipped = parsed.dishes.filter((d) => !d.matchedFoodId);
assert(skipped.length === 1 && skipped[0].name === 'Sorbet', 'only Sorbet is off-menu/skipped');

// Idempotency guard: refuse to double-insert.
for (let i = foodsStart + 1; i < foodsEnd; i++) {
  assert(!lines[i].includes(', ingredients:['), 'foods block already enriched — refusing to run twice');
}

for (const dish of matched) {
  const d = {
    ingredients: [...dish.ingredients],
    description: norm(dish.description),
    allergens: [...dish.allergens],
    allergenNote: dish.allergenNote == null ? null : norm(dish.allergenNote),
  };
  if (TYPO_FIXES[dish.matchedFoodId]) TYPO_FIXES[dish.matchedFoodId](d);

  const token = `{id:${JSON.stringify(dish.matchedFoodId)},`;
  const hits = [];
  for (let i = foodsStart + 1; i < foodsEnd; i++) if (lines[i].includes(token)) hits.push(i);
  assert(hits.length === 1, `${dish.matchedFoodId}: found exactly once in foods block (got ${hits.length})`);
  const li = hits[0];

  assert(lines[li].split(', tags:[').length === 2, `${dish.matchedFoodId}: exactly one ", tags:[" on its line`);

  const parts = [
    `ingredients:${JSON.stringify(d.ingredients)}`,
    `description:${JSON.stringify(d.description)}`,
    `allergens:${JSON.stringify(d.allergens)}`,
  ];
  if (d.allergenNote != null) parts.push(`allergenNote:${JSON.stringify(d.allergenNote)}`);
  if (VEGAN_OK.has(dish.matchedFoodId)) parts.push('vegan:true');

  lines[li] = lines[li].replace(', tags:[', ', ' + parts.join(', ') + ', tags:[');
}

const updated = lines.join('\n');

// Global typo sanity: none of the three typos survive anywhere in the new content.
assert(!updated.includes('Flor di Latte'), 'no "Flor di Latte" remains');
assert(!updated.includes('Merigue'), 'no "Merigue" remains');
assert(!updated.includes('ndjua'), 'no "ndjua" remains');

// ---- verify in memory before writing ----
const after = evalData(updated);
const NEW_FIELDS = ['ingredients', 'description', 'allergens', 'allergenNote', 'vegan'];

// 1) every top-level key other than foods is deep-equal to before
assert(isDeepStrictEqual(Object.keys(after), Object.keys(before)), 'same top-level keys');
for (const key of Object.keys(before)) {
  if (key === 'foods') continue;
  assert(isDeepStrictEqual(after[key], before[key]), `top-level "${key}" unchanged`);
}

// 2) foods: same ids/order; stripping the new fields restores the old record byte-for-byte
assert(after.foods.length === before.foods.length, 'foods length unchanged');
after.foods.forEach((f, i) => {
  const stripped = { ...f };
  for (const k of NEW_FIELDS) delete stripped[k];
  assert(isDeepStrictEqual(stripped, before.foods[i]), `food ${f.id}: existing fields untouched`);
});

// 3) all 41 matched foods enriched; everything else (matinee-snack-menu) untouched
const byId = new Map(after.foods.map((f) => [f.id, f]));
for (const dish of matched) {
  const f = byId.get(dish.matchedFoodId);
  assert(f, `${dish.matchedFoodId}: exists in data.foods`);
  assert(Array.isArray(f.ingredients) && f.ingredients.length > 0, `${f.id}: ingredients non-empty`);
  assert(typeof f.description === 'string' && f.description.length > 0, `${f.id}: description present`);
  assert(Array.isArray(f.allergens), `${f.id}: allergens defined`);
  assert(
    (dish.allergenNote == null) === !('allergenNote' in f),
    `${f.id}: allergenNote present iff non-null in syllabus`
  );
  assert(
    VEGAN_OK.has(f.id) ? f.vegan === true : !('vegan' in f),
    `${f.id}: vegan:true only for hummus-chips/cashews`
  );
}
const untouched = after.foods.filter((f) => !matched.some((d) => d.matchedFoodId === f.id));
for (const f of untouched) {
  assert(!('ingredients' in f) && !('allergens' in f), `${f.id}: non-syllabus food untouched`);
}

writeFileSync(DATA_PATH, updated);

// re-read + re-verify the written file round-trips
const reread = evalData(readFileSync(DATA_PATH, 'utf8'));
assert(isDeepStrictEqual(reread, after), 'written file round-trips');

console.log(
  `merged ${matched.length} syllabus dishes into src/data.js foods ` +
  `(${untouched.map((f) => f.id).join(', ')} untouched; Sorbet skipped; ` +
  `vegan:true on ${[...VEGAN_OK].join(', ')}); all assertions passed`
);
