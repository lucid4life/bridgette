// "A guest asks: what's …?" — the menu's fancy words, with the answers the
// OFFICIAL dish descriptions themselves give (research gap 6: the descriptions
// define these inline; guests ask them constantly). Definitions are harvested
// verbatim-or-tightened from data.foods descriptions — never invented. Terms
// the syllabus does not define are NOT here.
export interface GlossaryRow {
  term: string;
  /** The official definition, tightened to one guest-ready sentence. */
  definition: string;
  /** Dishes whose descriptions carry/define the term. */
  dishes: string[];
}

export const GLOSSARY: readonly GlossaryRow[] = [
  {
    term: 'burrata',
    definition:
      'A soft-centered variation of mozzarella — curds stretched around a soft cheese center, runny inside, chewy outside.',
    dishes: ['burrata-cheese']
  },
  {
    term: 'bigoli',
    definition: "A thick, spaghetti-style pasta from Italy's Veneto region.",
    dishes: ['bigoli']
  },
  {
    term: 'linguini',
    definition:
      'A long, flat pasta similar to spaghetti but slightly wider and flatter.',
    dishes: ['shrimp-crab']
  },
  {
    term: 'vadouvan',
    definition: 'A French curry powder with a large amount of garlic and shallot.',
    dishes: ['wood-grilled-asparagus']
  },
  {
    term: "'nduja",
    definition: 'A spicy, spreadable salami (here blended into a creamy dressing).',
    dishes: ['snap-peas']
  },
  {
    term: 'labneh',
    definition: 'Thickened yogurt (served here as roasted-garlic labneh).',
    dishes: ['lamb-sausage', 'tuna-crudo']
  },
  {
    term: 'tonnato',
    definition:
      'A creamy blend of garlic labneh, aioli, capers, lemon juice, and smoked tuna.',
    dishes: ['tuna-crudo']
  },
  {
    term: 'puttanesca',
    definition:
      'The classic Italian tomato-olive-caper-garlic flavor family — ours runs tomato, olive, caper, garlic, and fish sauce.',
    dishes: ['bigoli', 'tuna-crudo']
  },
  {
    term: 'Castelvetrano olives',
    definition: 'Small Italian green olives with a mild brininess and buttery finish.',
    dishes: ['roasted-olives']
  },
  {
    term: 'smoked tallow',
    definition: 'Our beef trim rendered down into a fat, then smoked.',
    dishes: ['bread-butter']
  },
  {
    term: 'pomme aligot',
    definition:
      'A French dish from the Aubrac region — mashed potatoes enriched with a generous amount of cheese.',
    dishes: ['26oz-wood-grilled-beef-ribeye']
  },
  {
    term: 'tatin',
    definition: 'A classic French upside-down caramelized fruit tart.',
    dishes: ['apple-tatin']
  },
  {
    term: 'white vinegar powder',
    definition: 'Dehydrated white vinegar — the salt-and-vinegar dust on the cashews.',
    dishes: ['cashews']
  },
  {
    term: 'fennel salami',
    definition:
      'Pork salami seasoned with toasted fennel seed, cayenne, chili flakes, Hungarian paprika, salt, and red wine.',
    dishes: ['fennel-salami']
  },
  {
    term: 'the Sorbet',
    definition:
      "A rotating flavour from Noto Gelato in Bridgeland — our off-menu dairy-free dessert option (ask the Chef for this week's flavour).",
    dishes: ['sorbet']
  }
];
