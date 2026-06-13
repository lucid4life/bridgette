// Playbook reference data (superprompt Phase 2 — Playbook completion): the
// allergen legend and the table map. Sourced from the official allergen
// vocabulary (data.foods allergens) and the Service Guide / Onboarding
// extracts (seat-numbering rule + table-number ranges). The guest-ask
// translator is read live from data.translator.

/** The 13 allergen tokens the menu uses, in the order they appear across the
 * cards, each with a plain one-line read. The confirm-with-the-kitchen rule
 * (data.confirm.allergens) rides separately and is non-negotiable. */
export interface AllergenLegendRow {
  token: string;
  /** what it means on the floor — what to actually watch for */
  read: string;
}

export const ALLERGEN_LEGEND: readonly AllergenLegendRow[] = [
  { token: 'gluten', read: 'wheat — bread, pasta, dough, breadcrumbs, dus/flour. Pizza-oven cross-contamination counts.' },
  { token: 'dairy', read: 'milk, butter, cream, cheese, yogurt/labneh, aioli made with butter.' },
  { token: 'eggs', read: 'aioli, mayo, fresh pasta dough, custards, a fried egg on top.' },
  { token: 'shellfish', read: 'crab, shrimp, lobster, oysters, octopus — molluscs and crustaceans both.' },
  { token: 'fish', read: 'the fish itself (trout, halibut, tuna) and fish sauce / anchovy.' },
  { token: 'tree nuts', read: 'almond, pine nut, cashew, walnut — and nut-based dressings.' },
  { token: 'sesame', read: 'tahini, sesame seed, sesame oil — common in the dressings.' },
  { token: 'soy', read: 'tamari, miso, soy sauce — hides in glazes and relishes.' },
  { token: 'pork', read: 'salami, sausage, guanciale, smoked tallow — and pork-based gelatin.' },
  { token: 'garlic', read: 'fresh garlic, roasted-garlic aioli, garlic purée, garlic powder in rubs.' },
  { token: 'onion', read: 'onion and shallot — in sofrito, dressings, spice rubs.' },
  { token: 'alcohol', read: 'wine, vodka, Armagnac in a sauce or a dessert — usually omittable, ask.' },
  { token: 'gelatin', read: 'a setting agent in some desserts — ours is pork-based.' }
];

/** The seat-numbering rule (Service Guide) + the table-number ranges
 * (Onboarding p.16). Day-one reference — "run food to the right seat at the
 * correct table" is half the two-week bar. */
export const SEAT_RULES: readonly string[] = [
  'Seat 1 is always to your LEFT as you approach the table; seats go clockwise.',
  'Middle-of-room tables: stand so seat 1 is on the left with its back to the kitchen.',
  'Seat 1 is always on the banquette.',
  'Shared dishes are rung under seat 0.',
  'Deliver by seat number — never auction off the food.'
];

export interface TableZone {
  range: string;
  zone: string;
  note?: string;
}

export const TABLE_MAP: readonly TableZone[] = [
  { range: '101–108', zone: 'bar top', note: '101 nearest the front' },
  { range: '111', zone: 'communal table', note: 'the long bar counter element' },
  { range: '121–126', zone: 'bar tables', note: 'two-tops along the wall opposite the bar' },
  { range: '131–135', zone: 'loft', note: 'booths / 2-tops by the front door; 131 seats ~7' },
  { range: '141–144', zone: 'patio' },
  { range: '201–212', zone: 'east section' },
  { range: '221 · 222', zone: 'high tops', note: 'east' },
  { range: '301–309', zone: 'west — edge', note: '302 seats 5' },
  { range: '311–316 · 321–326', zone: 'west — banquette rows', note: 'two-tops flanking the green banquettes' },
  { range: '401 (PDR)', zone: 'private dining room', note: 'seats ~14; reads 402 on the floor plan — confirm' }
];
