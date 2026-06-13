// "Guest wants the dish but can't have X — what's the call?" (research gap 2).
// Each row is derived 1:1 from the OFFICIAL allergenNote (Food Syllabus June
// 2026); only calls the note clearly states are authored — nothing inferred.
// `answer` is the floor-ready call in guest language; the reveal shows the
// official note verbatim plus the standing confirm line.
export type ModsCall = 'omit' | 'sub' | 'cc-only' | 'no-mods' | 'cannot';

export interface ModsRow {
  foodId: string;
  allergen: string;
  call: ModsCall;
  /** The floor-ready correct option text. */
  answer: string;
  /** The official allergenNote wording backing the call. */
  note: string;
}

const row = (foodId: string, allergen: string, call: ModsCall, answer: string, note: string): ModsRow => ({
  foodId,
  allergen,
  call,
  answer,
  note
});

export const MODS_ROWS: readonly ModsRow[] = [
  row('french-fries', 'eggs', 'sub', 'Sub ketchup for the aioli — and the dish is vegan that way.', 'Sub Ketchup and *this dish is vegan'),
  row('roasted-olives', 'gluten', 'cc-only', "Gluten isn't an ingredient — it's pizza-oven cross-contamination only; flag that risk.", 'Possible cross contamination from pizza oven only — gluten is not an ingredient of the dish'),
  row('tuna-crudo', 'dairy', 'cannot', "Dairy can't come out of this one — steer them elsewhere.", 'Dairy cannot be omitted'),
  row('wagyu-beef-carpaccio', 'dairy', 'omit', 'Dairy can come off — ring it with the allergy note.', 'Dairy can be omitted'),
  row('lamb-sausage', 'dairy', 'omit', 'Dairy can come off — ring it with the allergy note.', 'Dairy can be omitted'),
  row('burrata-cheese', 'gluten', 'sub', 'Sub the sourdough with Hummus Chips.', 'Gluten: can sub bread with Hummus Chips'),
  row('spiced-beet-salad', 'dairy', 'omit', 'Dairy can come off — ring it with the allergy note.', 'Dairy can be omitted; nuts can be omitted'),
  row('spiced-beet-salad', 'tree nuts', 'omit', 'The nuts can come off — ring it with the allergy note.', 'Dairy can be omitted; nuts can be omitted'),
  row('endive', 'dairy', 'omit', 'Dairy can come off — ring it with the allergy note.', 'Dairy can be omitted'),
  row('crispy-smashed-potatoes', 'eggs', 'omit', 'Eggs can come off — ring it with the allergy note.', 'Eggs can be omitted'),
  row('wood-grilled-asparagus', 'dairy', 'cannot', "Dairy can't come out of this one — steer them elsewhere.", 'Dairy, onion, garlic cannot be removed; gluten and crustacean (crab) can be removed'),
  row('wood-grilled-asparagus', 'shellfish', 'omit', 'The crab can come off — ring it with the allergy note.', 'Dairy, onion, garlic cannot be removed; gluten and crustacean (crab) can be removed'),
  row('wood-grilled-asparagus', 'gluten', 'omit', 'Gluten can come off — ring it with the allergy note.', 'Dairy, onion, garlic cannot be removed; gluten and crustacean (crab) can be removed'),
  row('snap-peas', 'gluten', 'omit', 'Gluten can come off — ring it with the allergy note.', 'Dairy, pork, eggs, garlic cannot be removed; gluten can be removed; this dish is not vegetarian'),
  row('snap-peas', 'dairy', 'cannot', "Dairy can't come out of this one — steer them elsewhere.", 'Dairy, pork, eggs, garlic cannot be removed; gluten can be removed; this dish is not vegetarian'),
  row('bigoli', 'dairy', 'omit', 'The cheese can come off — ring it with the allergy note.', "'Seafood' = fish sauce; both the cheese and the fish sauce can be omitted"),
  row('bigoli', 'fish', 'omit', 'The fish sauce can come off — ring it with the allergy note.', "'Seafood' = fish sauce; both the cheese and the fish sauce can be omitted"),
  row('grilled-farm-chicken', 'gluten', 'omit', 'All four flags on this one can come off — gluten included.', 'All listed allergens (gluten, dairy, pork, eggs) can be omitted'),
  row('grilled-farm-chicken', 'dairy', 'omit', 'All four flags on this one can come off — dairy included.', 'All listed allergens (gluten, dairy, pork, eggs) can be omitted'),
  row('wood-grilled-beef-strip-steak', 'dairy', 'omit', 'Dairy can come off — ring it with the allergy note.', 'Dairy and eggs can be omitted'),
  row('wood-grilled-beef-strip-steak', 'eggs', 'omit', 'Eggs can come off — ring it with the allergy note.', 'Dairy and eggs can be omitted'),
  row('wood-roasted-halibut', 'gluten', 'cc-only', 'Gluten can come off, BUT warn them: pizza-oven cross-contamination is still possible.', 'Gluten can be removed but cross contamination still possible from pizza oven'),
  row('wood-roasted-halibut', 'dairy', 'cannot', "Dairy can't come out of this one — steer them elsewhere.", 'Crustaceans, dairy, garlic, onion cannot be removed'),
  // NOTE deliberately absent: a banana-pie/pork row — the official note states
  // the gelatin is pork-BASED but never states whether it can be omitted, and
  // this file authors only calls the note makes (the pork FLAG itself is still
  // drilled by the classic allergen card).
  row('the-banana-pie', 'alcohol', 'omit', 'The alcohol can come off — ring it with the allergy note.', 'Gelatin is pork based; alcohol can be omitted'),
  row('apple-tatin', 'gluten', 'no-mods', 'No mods on this one — steer them to another dessert.', 'No mods'),
  row('apple-tatin', 'dairy', 'no-mods', 'No mods on this one — the Sorbet is the dairy-free dessert.', 'No mods'),
  row('chocolate-pot-de-creme', 'dairy', 'no-mods', 'No mods on this one — the Sorbet is the dairy-free dessert.', 'No mods'),
  row('chocolate-pot-de-creme', 'eggs', 'no-mods', 'No mods on this one — steer them to another dessert.', 'No mods')
];

const byFood = new Map<string, ModsRow[]>();
for (const r of MODS_ROWS) {
  const list = byFood.get(r.foodId) ?? [];
  list.push(r);
  byFood.set(r.foodId, list);
}

export function modsRowsFor(foodId: string): readonly ModsRow[] {
  return byFood.get(foodId) ?? [];
}
export function hasModsRow(foodId: string): boolean {
  return byFood.has(foodId);
}

/** The four standard wrong-call foils, minus whichever family the answer
 * belongs to (so the right call is never duplicated among the choices). */
export const MODS_FOILS: Record<ModsCall, string> = {
  omit: 'It can simply come off — no caveats.',
  sub: 'There’s a straight substitution for it.',
  'cc-only': 'It’s only a cross-contamination risk, not an ingredient.',
  'no-mods': 'No mods on this one — steer them elsewhere.',
  cannot: 'It can’t come out of this dish.'
};
