// app/src/lib/engine/basics.js — the "Floor Basics" study on-ramp (spec §6).
// A curated ~54-64 high-yield card set a new learner studies FIRST. Authored in
// human terms (guest asks, wine ids, dish ids) and resolved to card ids through the
// generators' additive sourceId field — never hardcoded slug strings, so it survives
// data edits. A test guard (basics.test.ts) asserts the resolved set stays valid.

import { allCards, slug } from './training.js';

export const FLOOR_BASICS = {
  // The 10 highest-frequency guest asks (the substitution translator core).
  translatorAsks: [
    'Cabernet Sauvignon', 'Merlot', 'Malbec', 'Sauvignon Blanc', 'Pinot Grigio / Pinot Gris',
    'Chardonnay', 'Pinot Noir', 'Riesling', 'Prosecco / Champagne', 'Rosé'
  ],
  // One wine-identity card per family (5) — the anchor of each structure lane.
  identityWineIds: [
    'blue-mountain-brut',                 // Bubbles & Rosé
    'hiedler-loss',                       // Bright & Crisp Whites
    'bodega-cerron-remordimiento-blanco', // Round Whites
    'deinhard-deidesheim',                // Light Reds
    'st-john-claret'                      // Structured Reds
  ],
  // The structure levers (acidity/body/tannin) on two anchor wines — all their
  // structure cards (recall + any discriminator).
  structureWineIds: ['st-john-claret', 'hiedler-loss'],
  // The marquee dishes across the families (9) — the pairings a server meets first.
  pairingFoodIds: [
    'french-fries', 'garlic-bread', 'margherita', 'wood-grilled-beef-strip-steak',
    'grilled-farm-chicken', 'tuna-crudo', 'burrata-cheese', 'wood-roasted-halibut', 'grilled-lamb-saddle'
  ],
  // The 5 genuinely hard names to say out loud.
  pronunciationWineIds: [
    'hiedler-loss', 'wagner-stempel-weissburgunder', 'deinhard-deidesheim',
    'ca-del-baio-langhe', 'bodega-cerron-remordimiento-tinto'
  ],
  // One pairing-LEVER card per lever a new server meets first (6) — the why behind
  // the marquee pours, so the language lands alongside the matches.
  principleFoodIds: [
    'french-fries', '26oz-wood-grilled-beef-ribeye', 'fennel-salami',
    'bibb-lettuce', 'italian-pork-sausage', 'tuna-crudo'
  ],
  // Task 2 — food-runner week picks: the 10 dishes a runner describes first (what's
  // IN them) and the 8 highest-stakes allergen calls.
  componentsFoodIds: [
    'french-fries', 'garlic-bread', 'hummus-chips', 'burrata-cheese', 'margherita',
    'tuna-crudo', 'ricotta-dumplings', 'wood-grilled-beef-strip-steak',
    'grilled-farm-chicken', 'oysters-1-2-dozen'
  ],
  allergensFoodIds: [
    'french-fries', 'hummus-chips', 'cashews', 'shrimp-crab', 'snap-peas',
    'burrata-cheese', 'wood-grilled-asparagus', 'bread-butter'
  ]
};

// Resolve the human-readable allow-list to the live set of card ids. Unresolved
// keys are silently dropped (the test guard catches drift if the count falls out
// of range). Pure: data -> Set<string>.
export function basicsIdSet(data) {
  const asks = new Set(FLOOR_BASICS.translatorAsks.map(slug));
  const ident = new Set(FLOOR_BASICS.identityWineIds);
  const structW = new Set(FLOOR_BASICS.structureWineIds);
  const pairF = new Set(FLOOR_BASICS.pairingFoodIds);
  const pronW = new Set(FLOOR_BASICS.pronunciationWineIds);
  const prinF = new Set(FLOOR_BASICS.principleFoodIds);
  const compF = new Set(FLOOR_BASICS.componentsFoodIds);
  const algF = new Set(FLOOR_BASICS.allergensFoodIds);
  const out = new Set();
  for (const c of allCards(data)) {
    if (c.deck === 'translator' && asks.has(c.sourceId)) out.add(c.id);
    else if (c.deck === 'wine-identity' && c.id.endsWith(':grape') && ident.has(c.sourceId)) out.add(c.id);
    else if (c.deck === 'structure' && structW.has(c.sourceId)) out.add(c.id);
    else if (c.deck === 'pairing' && pairF.has(c.sourceId)) out.add(c.id);
    else if (c.deck === 'pairing-principle' && prinF.has(c.sourceId)) out.add(c.id);
    else if (c.deck === 'pronunciation' && pronW.has(c.sourceId)) out.add(c.id);
    else if (c.deck === 'components' && compF.has(c.sourceId)) out.add(c.id);
    else if (c.deck === 'allergens' && algF.has(c.sourceId)) out.add(c.id);
  }
  return out;
}
