// tools/merge_beverage_syllabus.mjs — one-off merge of the official Beverage
// Syllabus (January 2025, docs/handoffs/beverage-syllabus-2025-01.parsed.json)
// into the hand-authored src/data.js cocktails array. Purely ADDITIVE: for each
// matched cocktail line it inserts `build`, `description`, `flavorTags`,
// `allergens` (+ `allergenNote` when non-null) immediately before that line's
// `, tags:[` — every existing byte of the line stays untouched. Menu-current
// items only: spicy-sandia and lovers-mountain (newer than the syllabus) are
// left alone, and the 3 syllabus-only drinks (First Wives Club, 0-Proof
// Heartbreak Mountain, Long Game) are NOT integrated.
// Run once from the repo root: node tools/merge_beverage_syllabus.mjs
//
// TYPO POLICY (logged in docs/v2-open-questions.md, 2026-06-10 section): exactly
// three obvious syllabus typos are fixed in the integrated text — "Absinth
// Rinse" → "Absinthe Rinse" (french-export build), "Za'tar Syrup" → "Za'atar
// Syrup" and "Martini Florale" → "Martini Floreale" (short-film build).
// Everything else is verbatim-official.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = fileURLToPath(new URL('..', import.meta.url));
const DATA_PATH = root + 'src/data.js';
const PARSED_PATH = root + 'docs/handoffs/beverage-syllabus-2025-01.parsed.json';

const assert = (cond, msg) => { if (!cond) throw new Error('ASSERT: ' + msg); };

// Evaluate src/data.js the same way tools/build_app_data.mjs does.
function evalData(srcText) {
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function('window', srcText).call(sandbox, sandbox.window);
  const data = sandbox.window.BB.data;
  assert(data && Array.isArray(data.cocktails), 'failed to extract BB.data');
  return data;
}

const parsed = JSON.parse(readFileSync(PARSED_PATH, 'utf8'));
const original = readFileSync(DATA_PATH, 'utf8');
const before = evalData(original);

// The three sanctioned typo fixes (and ONLY these), applied to the integrated text.
const TYPO_FIXES = {
  'french-export': (d) => {
    d.build = d.build.map((c) => (c === 'Absinth Rinse' ? 'Absinthe Rinse' : c));
    assert(d.build.includes('Absinthe Rinse'), 'french-export: Absinthe Rinse fix applied');
  },
  'short-film': (d) => {
    d.build = d.build.map((c) => (c === "Za'tar Syrup" ? "Za'atar Syrup" : c));
    d.build = d.build.map((c) => (c === 'Martini Florale' ? 'Martini Floreale' : c));
    assert(d.build.includes("Za'atar Syrup"), "short-film: Za'atar Syrup fix applied");
    assert(d.build.includes('Martini Floreale'), 'short-film: Martini Floreale fix applied');
  },
};

const norm = (s) => s.replace(/\s+/g, ' ').trim();

// ---- locate the cocktails block (each cocktail is ONE compact line) ----
const lines = original.split('\n');
const blockStart = lines.findIndex((l) => /^\s*cocktails:\s*\[\s*\r?$/.test(l));
assert(blockStart !== -1, 'found cocktails: [ line');
let blockEnd = -1;
for (let i = blockStart + 1; i < lines.length; i++) {
  if (/^\s*\],?\s*\r?$/.test(lines[i])) { blockEnd = i; break; }
}
assert(blockEnd !== -1, 'found cocktails closing ],');

const matched = parsed.drinks.filter((d) => d.matchedCocktailId);
assert(matched.length === 13, `13 matched drinks (got ${matched.length})`);
const skipped = parsed.drinks.filter((d) => !d.matchedCocktailId);
assert(
  skipped.length === 3 &&
    isDeepStrictEqual(
      skipped.map((d) => d.name).sort(),
      ['0-Proof Heartbreak Mountain', 'First Wives Club', 'Long Game'].sort()
    ),
  'only First Wives Club, 0-Proof Heartbreak Mountain, Long Game are syllabus-only/skipped'
);

// Idempotency guard: refuse to double-insert.
for (let i = blockStart + 1; i < blockEnd; i++) {
  assert(!lines[i].includes(', build:['), 'cocktails block already enriched — refusing to run twice');
}

// Capture the non-syllabus cocktail lines so we can prove they stay byte-identical.
const UNTOUCHED_IDS = ['spicy-sandia', 'lovers-mountain'];
const untouchedBefore = new Map();
for (const id of UNTOUCHED_IDS) {
  const token = `{id:${JSON.stringify(id)},`;
  const hits = [];
  for (let i = blockStart + 1; i < blockEnd; i++) if (lines[i].includes(token)) hits.push(i);
  assert(hits.length === 1, `${id}: found exactly once in cocktails block (got ${hits.length})`);
  untouchedBefore.set(id, { li: hits[0], text: lines[hits[0]] });
}

for (const drink of matched) {
  const d = {
    build: [...drink.build],
    description: norm(drink.description),
    flavorTags: [...drink.flavorTags],
    allergens: [...drink.allergens],
    allergenNote: drink.allergenNote == null ? null : norm(drink.allergenNote),
  };
  if (TYPO_FIXES[drink.matchedCocktailId]) TYPO_FIXES[drink.matchedCocktailId](d);

  const token = `{id:${JSON.stringify(drink.matchedCocktailId)},`;
  const hits = [];
  for (let i = blockStart + 1; i < blockEnd; i++) if (lines[i].includes(token)) hits.push(i);
  assert(hits.length === 1, `${drink.matchedCocktailId}: found exactly once in cocktails block (got ${hits.length})`);
  const li = hits[0];

  assert(lines[li].split(', tags:[').length === 2, `${drink.matchedCocktailId}: exactly one ", tags:[" on its line`);

  const parts = [
    `build:${JSON.stringify(d.build)}`,
    `description:${JSON.stringify(d.description)}`,
    `flavorTags:${JSON.stringify(d.flavorTags)}`,
    `allergens:${JSON.stringify(d.allergens)}`,
  ];
  if (d.allergenNote != null) parts.push(`allergenNote:${JSON.stringify(d.allergenNote)}`);

  lines[li] = lines[li].replace(', tags:[', ', ' + parts.join(', ') + ', tags:[');
}

const updated = lines.join('\n');

// Global typo sanity: none of the three typos survive anywhere in the new content.
assert(!updated.includes('Absinth Rinse'), 'no "Absinth Rinse" remains');
assert(!updated.includes("Za'tar"), `no "Za'tar" remains`);
assert(!updated.includes('Martini Florale'), 'no "Martini Florale" remains');

// Non-syllabus cocktails stayed byte-identical.
for (const [id, { li, text }] of untouchedBefore) {
  assert(lines[li] === text, `${id}: line byte-identical`);
}

// ---- verify in memory before writing ----
const after = evalData(updated);
const NEW_FIELDS = ['build', 'description', 'flavorTags', 'allergens', 'allergenNote'];

// 1) every top-level key other than cocktails is deep-equal to before
assert(isDeepStrictEqual(Object.keys(after), Object.keys(before)), 'same top-level keys');
for (const key of Object.keys(before)) {
  if (key === 'cocktails') continue;
  assert(isDeepStrictEqual(after[key], before[key]), `top-level "${key}" unchanged`);
}

// 2) cocktails: same ids/order; stripping the new fields restores the old record
assert(after.cocktails.length === before.cocktails.length, 'cocktails length unchanged');
after.cocktails.forEach((c, i) => {
  const stripped = { ...c };
  for (const k of NEW_FIELDS) delete stripped[k];
  assert(isDeepStrictEqual(stripped, before.cocktails[i]), `cocktail ${c.id}: existing fields untouched`);
});

// 3) all 13 matched cocktails enriched; everything else untouched
const byId = new Map(after.cocktails.map((c) => [c.id, c]));
for (const drink of matched) {
  const c = byId.get(drink.matchedCocktailId);
  assert(c, `${drink.matchedCocktailId}: exists in data.cocktails`);
  assert(Array.isArray(c.build) && c.build.length > 0, `${c.id}: build non-empty`);
  assert(typeof c.description === 'string' && c.description.length > 0, `${c.id}: description present`);
  assert(Array.isArray(c.flavorTags) && c.flavorTags.length > 0, `${c.id}: flavorTags non-empty`);
  assert(Array.isArray(c.allergens), `${c.id}: allergens defined`);
  assert(
    c.allergens.every((a) => a === a.toLowerCase()),
    `${c.id}: allergens normalized lowercase`
  );
  assert(
    (drink.allergenNote == null) === !('allergenNote' in c),
    `${c.id}: allergenNote present iff non-null in syllabus`
  );
}
const untouched = after.cocktails.filter((c) => !matched.some((d) => d.matchedCocktailId === c.id));
assert(
  isDeepStrictEqual(untouched.map((c) => c.id).sort(), [...UNTOUCHED_IDS].sort()),
  'exactly spicy-sandia + lovers-mountain are non-syllabus'
);
for (const c of untouched) {
  assert(!('build' in c) && !('allergens' in c) && !('flavorTags' in c), `${c.id}: non-syllabus cocktail untouched`);
}

writeFileSync(DATA_PATH, updated);

// re-read + re-verify the written file round-trips
const reread = evalData(readFileSync(DATA_PATH, 'utf8'));
assert(isDeepStrictEqual(reread, after), 'written file round-trips');

console.log(
  `merged ${matched.length} syllabus drinks into src/data.js cocktails ` +
  `(${untouched.map((c) => c.id).join(', ')} untouched; ` +
  `${skipped.map((d) => d.name).join(', ')} skipped); all assertions passed`
);
