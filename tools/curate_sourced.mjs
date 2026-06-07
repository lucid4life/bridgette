// tools/curate_sourced.mjs — curate the Phase-B web-sourced records into lean,
// integration-ready app data. Input: docs/research/2026-06-07-v2-content-sourced.json
// Output: src/data-fullmenu.json ({bottles, beers, fortifieds, translatorRows}).
// I (the integrator) own this transform; the agents' JSON is research input only.
// Applies: structure→LMH coercion (full→high, light→low, etc.), fortified de-dup,
// drop low-confidence Tawny Port, vegan true|null only, lean display fields (flags/
// sources/confidence stay in the research doc + open-questions, NOT shipped to client).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = JSON.parse(readFileSync(root + 'docs/research/2026-06-07-v2-content-sourced.json', 'utf8'));

const slug = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const LMH = new Set(['low', 'medium', 'high']);
const report = { coerced: [], excluded: [], deduped: [], flaggedIntegrated: [] };

function lmh(v, label) {
  if (LMH.has(v)) return v;
  const map = { full: 'high', 'medium-full': 'high', 'medium-high': 'high', 'full-bodied': 'high', light: 'low', 'light-medium': 'low', 'low-medium': 'low', 'medium-low': 'medium' };
  const out = map[String(v).toLowerCase()] || 'medium';
  report.coerced.push(`${label}: '${v}' -> '${out}'`);
  return out;
}
const vegan = (v) => (v === true ? true : null);
function typeOf(family) {
  const f = String(family || '');
  if (/Red/i.test(f)) return 'Red';
  if (/White/i.test(f)) return 'White';
  if (/Bubbles|Sparkl/i.test(f)) return 'Sparkling';
  return 'Other';
}

const bottles = src.bottles.map((b) => {
  if (b.verifiedConfidence !== 'high' || (b.flags && b.flags.length)) report.flaggedIntegrated.push(`bottle ${b.name} [${b.verifiedConfidence}]`);
  const st = b.structure || {};
  return {
    id: slug(b.name), name: b.name, grape: b.grape, region: b.region, country: b.country,
    vintage: b.vintage || 'NV', priceBottle: b.priceBottle ?? null,
    family: b.family, type: typeOf(b.family), climate: b.climate,
    structure: { acidity: lmh(st.acidity, b.name + '.acidity'), body: lmh(st.body, b.name + '.body'), tannin: lmh(st.tannin, b.name + '.tannin'), sweetness: st.sweetness || 'dry' },
    profile: b.profile || '', tenSecond: b.tenSecond || '', pairWhy: b.pairWhy || '',
    pair: Array.isArray(b.suggestedPairs) ? b.suggestedPairs : [],
    upgradeFrom: b.upgradeFrom || 'none',
    pronunciation: { say: b.name, respell: b.respell || b.name },
    aliases: Array.isArray(b.aliases) ? b.aliases : [],
    mnemonic: b.mnemonic || '', vegan: vegan(b.vegan), exclusive: false
  };
}).sort((a, b) => (a.name < b.name ? -1 : 1));

const beers = src.beers.map((b) => ({
  id: slug(b.name), name: b.name, style: b.style, origin: b.origin, abv: b.abv, oz: b.oz || '',
  flavor: b.flavor || '', pairWith: Array.isArray(b.pairWith) ? b.pairWith : [],
  pronunciation: b.respell ? { say: b.name, respell: b.respell } : null
})).sort((a, b) => (a.name < b.name ? -1 : 1));

// fortifieds: drop low-confidence placeholders; de-dup by normalized name (keep first / higher conf).
const seen = new Map();
for (const f of src.fortifieds) {
  if (f.verifiedConfidence === 'low') { report.excluded.push(`fortified ${f.name} [low — hold for open-questions]`); continue; }
  const key = slug(f.name);
  if (seen.has(key)) { report.deduped.push(`fortified ${f.name}`); continue; }
  seen.set(key, f);
}
const fortifieds = [...seen.values()].map((f) => {
  if (f.verifiedConfidence !== 'high' || (f.flags && f.flags.length)) report.flaggedIntegrated.push(`fortified ${f.name} [${f.verifiedConfidence}]`);
  return {
    id: slug(f.name), name: f.name, type: f.type, origin: f.origin || '', abv: f.abv || '',
    sweetness: f.sweetness || '', profile: f.profile || '',
    pairWith: Array.isArray(f.pairWith) ? f.pairWith : [],
    servedAs: f.servedAs || 'digestif',
    pronunciation: { say: f.name, respell: f.respell || f.name }
  };
}).sort((a, b) => (a.name < b.name ? -1 : 1));

// translator rows -> lean shape matching src/data.js translator[] (integrated into src/data.js separately).
const translatorRows = src.translatorRows.map((t) => ({
  ask: t.ask, aliases: Array.isArray(t.aliases) ? t.aliases : [],
  bestGlass: t.bestGlass, bottleOptions: Array.isArray(t.bottleOptions) ? t.bottleOptions : [],
  familiar: t.familiar || '', different: t.different || '', phrase: t.phrase || ''
}));

const out = {
  generatedFrom: 'docs/research/2026-06-07-v2-content-sourced.json (Phase B web-sourced, curated)',
  note: 'Lean display fields only. Per-field sources + flags live in the research JSON + docs/v2-open-questions.md. Curated by tools/curate_sourced.mjs.',
  bottles, beers, fortifieds, translatorRows
};
writeFileSync(root + 'src/data-fullmenu.json', JSON.stringify(out, null, 2) + '\n');

console.log(`bottles ${bottles.length} · beers ${beers.length} · fortifieds ${fortifieds.length} · translatorRows ${translatorRows.length}`);
console.log('excluded:', report.excluded);
console.log('deduped:', report.deduped);
console.log('coerced:', report.coerced);
console.log('flagged-but-integrated count:', report.flaggedIntegrated.length);
