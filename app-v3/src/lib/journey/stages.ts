// Task D — the learning path data: Stage 1 "Food Runner" + locked stages 2-5.
// Unit ids/titles and dish rosters are LOCKED by the Phase-1 spec
// (docs/handoffs/2026-06-11-v3-phase1-spec.md). Menu truth lives in $lib/data;
// this file only maps which official dish goes in which unit.
import { data } from '$lib/data';
import type { Stage, Unit } from './types';

export const DAY_ONE_UNIT_ID = 'day-one';
export const CHECKPOINT_UNIT_ID = 'checkpoint-food';
export const ALLERGEN_CHECKPOINT_UNIT_ID = 'checkpoint-allergens';

/** Dish rosters per lesson unit (day-one and the checkpoint mint no dish rows). */
export const UNIT_FOOD_IDS: Record<string, readonly string[]> = {
  snacks: ['french-fries', 'hummus-chips', 'garlic-bread', 'cashews'],
  'snacks-2': ['eggplant-fries', 'roasted-olives', 'bread-butter'],
  'small-plates': [
    'oysters-1-2-dozen',
    'tuna-crudo',
    'wagyu-beef-carpaccio',
    'lamb-sausage',
    'burrata-cheese',
    'grilled-octopus-salad',
    'mushrooms-on-toast'
  ],
  vegetables: [
    'spiced-beet-salad',
    'endive',
    'crispy-smashed-potatoes',
    'wood-grilled-asparagus',
    'snap-peas',
    'smashed-cucumbers',
    'bibb-lettuce'
  ],
  pizza: ['margherita', 'chicken-sausage', 'five-cheese', 'fennel-salami', 'italian-sausage'],
  pasta: ['italian-pork-sausage', 'ricotta-dumplings', 'shrimp-crab', 'bigoli', 'rigatoni'],
  mains: [
    'grilled-farm-chicken',
    'maple-bbq-rainbow-trout',
    'wood-grilled-beef-strip-steak',
    'wood-roasted-halibut',
    'grilled-lamb-saddle',
    'wood-roasted-half-duck',
    '26oz-wood-grilled-beef-ribeye'
  ],
  dessert: ['the-banana-pie', 'apple-tatin', 'chocolate-pot-de-creme']
};

// ---- Stage 2 (Allergen Guardian) by-allergen-family rosters ----
// Each flagged path dish is assigned to ONE family — its most severe allergen
// (so units don't overlap and gating stays clean), severity high→low. The
// allergen DRILL (/allergens) and the safe-call CHECKPOINT cover the
// every-carrier "sweep" framing; the path units teach flags in severity tiers.
const ALLERGEN_SEVERITY: readonly string[] = [
  'shellfish', 'fish', 'tree nuts', 'sesame', 'soy', // cross-contamination / anaphylaxis tier
  'pork', 'gelatin', 'alcohol', // dietary / religious tier
  'gluten', 'dairy', 'eggs', 'garlic', 'onion' // common-cooking tier
];
const ALLERGEN_FAMILY: Record<string, string> = {
  shellfish: 'seafood', fish: 'seafood',
  'tree nuts': 'nuts', sesame: 'nuts', soy: 'nuts',
  pork: 'diet', gelatin: 'diet', alcohol: 'diet',
  gluten: 'common', dairy: 'common', eggs: 'common', garlic: 'common', onion: 'common'
};
const ALLERGEN_UNIT_OF_FAMILY: Record<string, string> = {
  seafood: 'allergens-seafood',
  nuts: 'allergens-nuts',
  diet: 'allergens-diet',
  common: 'allergens-common'
};

/** foodId rosters per Stage-2 allergen unit, computed once from the official
 * flags: each flagged path dish lands in its most-severe allergen's family. */
export const UNIT_ALLERGEN_IDS: Record<string, readonly string[]> = (() => {
  const out: Record<string, string[]> = {
    'allergens-seafood': [], 'allergens-nuts': [], 'allergens-diet': [], 'allergens-common': []
  };
  const pathFoodIds = new Set(Object.values(UNIT_FOOD_IDS).flat());
  const foodById = new Map(data.foods.map((f) => [f.id, f]));
  for (const id of pathFoodIds) {
    const flags = foodById.get(id)?.allergens ?? [];
    if (flags.length === 0) continue; // a flagless dish has nothing to guard
    const severest = ALLERGEN_SEVERITY.find((a) => flags.includes(a));
    if (!severest) continue;
    out[ALLERGEN_UNIT_OF_FAMILY[ALLERGEN_FAMILY[severest]]].push(id);
  }
  return out;
})();

const lesson = (id: string, title: string, blurb: string): Unit => ({
  id,
  title,
  blurb,
  kind: 'lesson'
});

const FOOD_RUNNER_UNITS: Unit[] = [
  lesson(
    DAY_ONE_UNIT_ID,
    'Day one',
    'seat numbers, the table map, and how a plate finds the right guest'
  ),
  lesson('snacks', 'Snacks', 'the first things on the table — fries, hummus, garlic bread, cashews'),
  lesson('snacks-2', 'Snacks II', 'three more openers — eggplant fries, warm olives, bread & butter'),
  lesson(
    'small-plates',
    'Small plates',
    'the shareable starters, oysters to octopus — what lands with each one'
  ),
  lesson('vegetables', 'Vegetables', 'seven veg plates with surprises underneath — know what they are'),
  lesson('pizza', 'Pizza', 'five pizzas — what each one carries when a guest asks'),
  lesson('pasta', 'Pasta', "five pastas — what's in the bowl before it hits the table"),
  lesson('mains', 'Mains', 'the big plates off the wood grill — steak, duck, halibut and friends'),
  lesson('dessert', 'Dessert', 'three desserts worth one more course — sell them by name'),
  {
    id: CHECKPOINT_UNIT_ID,
    title: 'Shift check: Food',
    blurb: 'the whole food menu plus day-one service, cold — like a real shift',
    kind: 'checkpoint'
  }
];

export const STAGES: Stage[] = [
  {
    id: 'food-runner',
    title: 'Food Runner',
    track: 'food',
    blurb: 'every dish on the menu — what it is, what comes with it, how to land it',
    units: FOOD_RUNNER_UNITS
  },
  {
    id: 'allergen-guardian',
    title: 'Allergen Guardian',
    track: 'allergens',
    blurb: 'the flags every dish carries — keep every guest safe at every seat',
    units: [
      lesson('allergens-seafood', 'Seafood flags', 'every dish carrying shellfish or fish — the ones you can never wing'),
      lesson('allergens-nuts', 'Nuts, sesame & soy', 'the cross-contamination flags hiding in the dressings and glazes'),
      lesson('allergens-diet', 'Pork, gelatin & alcohol', 'the dietary and religious flags — and which can come off'),
      lesson('allergens-common', 'Gluten, dairy & eggs', 'the everyday flags on the most dishes — know them cold'),
      {
        id: ALLERGEN_CHECKPOINT_UNIT_ID,
        title: 'Shift check: Allergens',
        blurb: 'every flag, plus the safe call for an allergic guest — cold',
        kind: 'checkpoint'
      }
    ]
  },
  {
    id: 'behind-the-bar',
    title: 'Behind the Bar',
    track: 'bar',
    blurb: 'the cocktail list — builds, flavours, and what to say setting one down',
    units: [],
    locked: true
  },
  {
    id: 'wine',
    title: 'Wine',
    track: 'wine',
    blurb: 'the by-the-glass pours — grape, place, and a ten-second story for each',
    units: [],
    locked: true
  },
  {
    id: 'pairings',
    title: 'Pairings',
    track: 'pairings',
    blurb: 'match the dish to the pour — and say why like you mean it',
    units: [],
    locked: true
  }
];

export function stageById(stageId: string): Stage {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) throw new Error(`journey: unknown stage '${stageId}'`);
  return stage;
}

/** Resolve a unit anywhere on the path, with its stage and position in it. */
export function unitById(unitId: string): { unit: Unit; stage: Stage; index: number } {
  for (const stage of STAGES) {
    const index = stage.units.findIndex((u) => u.id === unitId);
    if (index !== -1) return { unit: stage.units[index], stage, index };
  }
  throw new Error(`journey: unknown unit '${unitId}'`);
}
