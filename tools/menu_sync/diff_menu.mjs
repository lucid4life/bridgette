// tools/menu_sync/diff_menu.mjs — step 3 of the menu-sync loop.
// Compares the parsed official menus (source_menus/parsed/<date>.json) against
// the app's hand-authored data (src/data.js via the build_app_data.mjs sandbox
// trick + src/data-fullmenu.json) and writes a human-review report to
// docs/menu-sync/<date>-report.md. NOTHING is ever auto-applied.
// Run: node tools/menu_sync/diff_menu.mjs [YYYY-MM-DD]   (default: newest)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

// --- load app data (same sandbox pattern as tools/build_app_data.mjs) ---
const src = readFileSync(root + 'src/data.js', 'utf8');
const sandbox = { window: {} };
new Function('window', src).call(sandbox, sandbox.window);
const data = sandbox.window.BB.data;
const full = JSON.parse(readFileSync(root + 'src/data-fullmenu.json', 'utf8'));

// --- load newest parsed menu snapshot ---
const parsedDir = root + 'source_menus/parsed/';
const dates = readdirSync(parsedDir).filter(f => f.endsWith('.json')).sort();
const stamp = process.argv[2] ?? dates.at(-1)?.replace('.json', '');
if (!stamp) { console.error('no parsed snapshot — run parse_menus.py first'); process.exit(1); }
const parsed = JSON.parse(readFileSync(parsedDir + stamp + '.json', 'utf8'));

// --- name normalization + fuzzy match (token-sorted Dice bigram similarity) ---
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const bigrams = s => { const b = new Set(); const t = s.replace(/ /g, ''); for (let i = 0; i < t.length - 1; i++) b.add(t.slice(i, i + 2)); return b; };
function sim(a, b) {
  const A = bigrams(norm(a)), B = bigrams(norm(b));
  if (!A.size || !B.size) return 0;
  let hit = 0; for (const g of A) if (B.has(g)) hit++;
  let s = (2 * hit) / (A.size + B.size);
  // Token containment: printed names wrap/abbreviate ("Gigondas Les
  // Jardinières" vs "Domaine Gour de Chaulé Gigondas Les Jardinières",
  // "Chimay Blue" vs "Chimay Blue Strong Dark Ale") — if every meaningful
  // token of the shorter name appears in the longer, it's the same item.
  // Containment counts as a clean match (0.95): the print shop wrapping or
  // shortening a name ("Boulard XO" for "Boulard XO Calvados") is not a rename.
  const ta = norm(a).split(' ').filter(t => t.length > 1);
  const tb = norm(b).split(' ').filter(t => t.length > 1);
  if (ta.length && tb.length) {
    const [shorter, longer] = ta.length <= tb.length ? [ta, new Set(tb)] : [tb, new Set(ta)];
    if (shorter.length >= 2 && shorter.every(t => longer.has(t))) s = Math.max(s, 0.95);
  }
  return s;
}

// --- app-side entity list: every name the app teaches, with kind + prices ---
const appEntities = [
  ...data.wines.map(w => ({ kind: 'glass wine', name: w.name, id: w.id, prices: [w.priceGlass, w.priceBottle].filter(Boolean), aliases: w.aliases ?? [] })),
  ...full.bottles.map(b => ({ kind: 'bottle', name: b.name, id: b.id, prices: [b.priceBottle].filter(Boolean), aliases: b.aliases ?? [] })),
  ...full.beers.map(b => ({ kind: 'beer', name: b.name, id: b.id, prices: [], aliases: b.aliases ?? [] })),
  ...full.fortifieds.map(f => ({ kind: 'fortified', name: f.name, id: f.id, prices: [], aliases: f.aliases ?? [] })),
  ...data.foods.map(f => ({ kind: 'food', name: f.name, id: f.id, prices: f.price ? [Number(f.price)] : [], aliases: [] })),
  ...data.cocktails.map(c => ({ kind: 'cocktail', name: c.name, id: c.id, prices: c.price ? [Number(c.price)] : [], aliases: [] })),
];

const menuItems = Object.entries(parsed.menus).flatMap(([menu, m]) =>
  m.items.map(it => ({ ...it, menu })));

// --- match every menu item to its best app entity and vice versa ---
const matchOf = it => {
  let best = null, score = 0;
  for (const e of appEntities) {
    const s = Math.max(sim(it.name, e.name), ...e.aliases.map(a => sim(it.name, a)), 0);
    if (s > score) { score = s; best = e; }
  }
  return { best, score };
};

// Menu lines that are real but not teachable (soft drinks, add-ons), and
// app-side helper records that aren't menu items.
const IGNORE_MENU = new Set(['redbull energy drink', 'pop', 'pop 3', 'add black truffle']);
const IGNORE_APP_IDS = new Set(['matinee-snack-menu']);

const added = [], renamed = [], priceChanges = [], outOfScope = [];
const matchedAppIds = new Set();
for (const it of menuItems) {
  if (it.outOfScope || IGNORE_MENU.has(norm(it.name))) { outOfScope.push(it); continue; }
  const { best, score } = matchOf(it);
  if (score >= 0.95) {
    matchedAppIds.add(best.id);
    const appP = (best.prices ?? []).map(Number).filter(n => !Number.isNaN(n));
    if (appP.length && it.prices.length &&
        !appP.every(p => it.prices.includes(p))) {
      priceChanges.push({ it, best, appP });
    }
  } else if (score >= 0.8) {
    matchedAppIds.add(best.id);
    renamed.push({ it, best, score });
  } else {
    added.push(it);
  }
}
const removed = appEntities.filter(e => !matchedAppIds.has(e.id) && !IGNORE_APP_IDS.has(e.id));

// --- report ---
const lines = [];
lines.push(`# Menu sync report — ${stamp}`, '');
lines.push('> Human-review document. Apply changes BY HAND to `src/data.js` / `src/data-fullmenu.json`, then `node tools/build_app_data.mjs`.');
lines.push('> Rules: a RENAMED item KEEPS its existing `id` (new spelling goes in `aliases`);');
lines.push('> a removed item is deleted (migrateProgress drops orphaned card progress safely);');
lines.push('> a new item gets a fresh slug id. Never edit an existing card-id namespace.', '');

const sec = (title, rows) => { lines.push(`## ${title} (${rows.length})`, ''); if (!rows.length) lines.push('_none_', ''); };
sec('On the menu, NOT in app data (add?)', added);
for (const it of added) lines.push(`- **${it.name}** — ${it.menu}${it.section ? ` / ${it.section}` : ''}${it.prices.length ? ` — $${it.prices.join(' | ')}` : ''}${it.detail.length ? `<br>  ${it.detail.join(' · ')}` : ''}`);
if (added.length) lines.push('');
sec('In app data, NOT on the menu (remove?)', removed);
for (const e of removed) lines.push(`- **${e.name}** (${e.kind}, id \`${e.id}\`)`);
if (removed.length) lines.push('');
sec('Probable renames / spelling drift (fuzzy ≥0.8)', renamed);
for (const r of renamed) lines.push(`- menu **${r.it.name}** ≈ app **${r.best.name}** (\`${r.best.id}\`, ${r.score.toFixed(2)}) — keep id, add alias`);
if (renamed.length) lines.push('');
sec('Price changes', priceChanges);
for (const p of priceChanges) lines.push(`- **${p.best.name}** (\`${p.best.id}\`): app $${p.appP.join('/')} vs menu $${p.it.prices.join(' | ')}`);
if (priceChanges.length) lines.push('');

lines.push(`## Out of training scope — spirits by the ounce (${outOfScope.length})`, '');
lines.push('_Listed for completeness; the app teaches wine/cocktails/fortifieds, not the spirit list._', '');
for (const it of outOfScope) lines.push(`- ${it.name} — ${it.section ?? '?'}${it.prices.length ? ` — $${it.prices.join(' | ')}` : ''}`);
lines.push('');

const unparsedTotal = Object.values(parsed.menus).reduce((n, m) => n + m.unparsed.length, 0);
lines.push(`## Unparsed lines to eyeball (${unparsedTotal})`, '');
for (const [menu, m] of Object.entries(parsed.menus)) for (const u of m.unparsed) lines.push(`- [${menu}] ${u}`);
lines.push('');

mkdirSync(root + 'docs/menu-sync', { recursive: true });
const dest = `docs/menu-sync/${stamp}-report.md`;
writeFileSync(root + dest, lines.join('\n'));
console.log(`wrote ${dest}: +${added.length} added, -${removed.length} removed, ~${renamed.length} renamed, $${priceChanges.length} price changes, ${unparsedTotal} unparsed`);
