// Regenerate the frozen card-id snapshot (app/src/lib/engine/__fixtures__/card-ids.json).
// Run after DELIBERATELY adding decks/cards: node scripts/regen-card-ids.mjs
// SAFETY: refuses to write if any EXISTING id was renamed or removed — that would
// silently wipe a real user's Leitner progress (the card-id scheme is frozen).
import { readFileSync, writeFileSync } from 'node:fs';
import { allCards } from '../src/lib/engine/training.js';
import { data } from '../src/lib/data/data.js';

const path = new URL('../src/lib/engine/__fixtures__/card-ids.json', import.meta.url);
const oldIds = JSON.parse(readFileSync(path, 'utf8'));
const newIds = allCards(data).map((c) => c.id).sort();
const oldSet = new Set(oldIds);
const newSet = new Set(newIds);
const added = newIds.filter((id) => !oldSet.has(id));
const removed = oldIds.filter((id) => !newSet.has(id));

console.log(`old: ${oldIds.length}  new: ${newIds.length}`);
console.log(`added (${added.length}):`, added.slice(0, 8), added.length > 8 ? '…' : '');
console.log(`removed (${removed.length}):`, removed);

if (removed.length) {
  console.error('\nREFUSING TO WRITE: existing card ids were changed/removed — that breaks the frozen contract.');
  process.exit(1);
}
writeFileSync(path, JSON.stringify(newIds, null, 2) + '\n');
console.log('\nwrote card-ids.json snapshot.');
