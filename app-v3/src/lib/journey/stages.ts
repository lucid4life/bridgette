// Task D — the learning path data: Stage 1 "Food Runner" + locked stages 2-5.
// Unit ids/titles and dish rosters are LOCKED by the Phase-1 spec
// (docs/handoffs/2026-06-11-v3-phase1-spec.md). Menu truth lives in $lib/data;
// this file only maps which official dish goes in which unit.
import { data } from '$lib/data';
import type { Stage, Unit } from './types';

export const DAY_ONE_UNIT_ID = 'day-one';
export const CHECKPOINT_UNIT_ID = 'checkpoint-food';
export const ALLERGEN_CHECKPOINT_UNIT_ID = 'checkpoint-allergens';
export const BAR_ARC_UNIT_ID = 'bar-arc';
export const BAR_CHECKPOINT_UNIT_ID = 'checkpoint-bar';
export const WINE_CHECKPOINT_UNIT_ID = 'checkpoint-wine';
export const PAIRINGS_CHECKPOINT_UNIT_ID = 'checkpoint-pairings';

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

// ---- Stage 3 (Behind the Bar) by-flavour-family rosters ----
// Each cocktail with an official build lands in ONE module by its menu category,
// grouped into four flavour rooms (non-overlapping). Cocktails with NO official
// build (Spicy Sandia, Lovers Mountain — newer than the Jan-2025 syllabus) are
// excluded from build-recall outright (logged: open-questions item 18); they
// still live in the Playbook + pairing material.
const BAR_MODULE_OF_CATEGORY: Record<string, string> = {
  'Bright, spicy, smoky': 'bar-bright',
  'Fruity, tropical, sparkling': 'bar-bright',
  'Floral, tea, citrus': 'bar-floral',
  'Bitter, aperitivo, amaro': 'bar-floral',
  'Rich, spirit-forward': 'bar-spirit',
  'Zero-proof cocktail': 'bar-zero'
};

/** cocktailId rosters per Stage-3 build module, computed once from the official
 * builds: a cocktail with no `build[]` mints no build-recall item. */
export const UNIT_BUILD_IDS: Record<string, readonly string[]> = (() => {
  const out: Record<string, string[]> = {
    'bar-bright': [], 'bar-floral': [], 'bar-spirit': [], 'bar-zero': []
  };
  for (const c of data.cocktails) {
    if (!c.build || c.build.length === 0) continue; // no official build → no build item
    const unit = BAR_MODULE_OF_CATEGORY[c.category];
    // Never silently drop a drillable cocktail: a built drink in an unmapped
    // category is a content error (a new flavour family was added) — fail loud.
    if (!unit)
      throw new Error(
        `stages: cocktail '${c.id}' has an official build but category '${c.category}' maps to no bar module`
      );
    out[unit].push(c.id);
  }
  return out;
})();

// ---- Stage 4 (Wine) by-family rosters ----
// The 5 wine families ARE the 5 modules (non-overlapping by definition); each
// by-the-glass pour lands in its family's module, in data order.
const WINE_MODULE_OF_FAMILY: Record<string, string> = {
  'Bubbles & Rosé': 'wine-bubbles',
  'Bright & Crisp Whites': 'wine-bright',
  'Round Whites': 'wine-round',
  'Light Reds': 'wine-light',
  'Structured Reds': 'wine-structured'
};

/** wineId rosters per Stage-4 family module, computed once from data.wines. */
export const UNIT_WINE_IDS: Record<string, readonly string[]> = (() => {
  const out: Record<string, string[]> = {
    'wine-bubbles': [], 'wine-bright': [], 'wine-round': [], 'wine-light': [], 'wine-structured': []
  };
  for (const w of data.wines) {
    const unit = WINE_MODULE_OF_FAMILY[w.family];
    // Never silently drop a glass pour: a wine in an unmapped family is a content
    // error (a family was renamed/added) — fail loud, like the bar rosters.
    if (!unit)
      throw new Error(`stages: wine '${w.id}' has family '${w.family}' that maps to no wine module`);
    out[unit].push(w.id);
  }
  return out;
})();

// ---- Stage 5 (Pairings) rosters ----
// The same 41 path dishes, re-anchored as dish→pour pairings. Grouped into four
// menu-spanning modules (NOT by lever) so each module mixes levers — this stage
// is about DISCRIMINATING the right pour across the menu, so the modules stay
// interleaved. Computed from UNIT_FOOD_IDS so the dish set never drifts.
const PAIRING_MODULE_OF_FOOD_UNIT: Record<string, string> = {
  snacks: 'pair-snacks',
  'snacks-2': 'pair-snacks',
  'small-plates': 'pair-snacks',
  vegetables: 'pair-veg-pizza',
  pizza: 'pair-veg-pizza',
  pasta: 'pair-pasta-mains',
  mains: 'pair-pasta-mains',
  dessert: 'pair-dessert'
};

/** foodId rosters per Stage-5 pairing module, computed from the dish units. */
export const UNIT_PAIRING_IDS: Record<string, readonly string[]> = (() => {
  const out: Record<string, string[]> = {
    'pair-snacks': [], 'pair-veg-pizza': [], 'pair-pasta-mains': [], 'pair-dessert': []
  };
  for (const [foodUnit, foodIds] of Object.entries(UNIT_FOOD_IDS)) {
    const unit = PAIRING_MODULE_OF_FOOD_UNIT[foodUnit];
    if (!unit) throw new Error(`stages: dish unit '${foodUnit}' maps to no pairing module`);
    for (const id of foodIds) out[unit].push(id);
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
    'Seats & service',
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
    blurb: 'the whole food menu plus the floor basics, cold — like a real shift',
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
    units: [
      lesson(BAR_ARC_UNIT_ID, 'Running drinks', 'the arc of bar service — first in first out, romance at the seat, how a glass is handled'),
      lesson('bar-bright', 'Bright & fruity', 'the agave-bright and tropical-sparkling crowd-pleasers — builds you reach for most'),
      lesson('bar-floral', 'Floral & bitter', 'the tea-and-citrus aromatics and the amaro/aperitivo lane — builds and who they suit'),
      lesson('bar-spirit', 'Spirit-forward', 'the rich, after-dinner pours — bourbon, cognac, rye and what carries them'),
      lesson('bar-zero', 'Zero-proof', 'the no-alcohol cocktails — the call for a guest who is not drinking tonight'),
      {
        id: BAR_CHECKPOINT_UNIT_ID,
        title: 'Shift check: Bar',
        blurb: 'every build plus the floor ritual, cold — like a real bar shift',
        kind: 'checkpoint'
      }
    ]
  },
  {
    id: 'wine',
    title: 'Wine',
    track: 'wine',
    blurb: 'the by-the-glass pours — grape, place, and a ten-second story for each',
    units: [
      lesson('wine-bubbles', 'Bubbles & rosé', 'the sparkling and rosé openers — crisp, salty, made for the start of a meal'),
      lesson('wine-bright', 'Bright & crisp whites', 'the high-acid whites — your pick for green, tangy, spicy and seafood plates'),
      lesson('wine-round', 'Round whites', 'the softer, fuller whites — pear and lemon with no sharp edges'),
      lesson('wine-light', 'Light reds', 'the soft, lighter reds — cherry and earth, friendly even with fish'),
      lesson('wine-structured', 'Structured reds', 'the grippy, full reds — the steak-and-lamb pours, grape, place and structure'),
      {
        id: WINE_CHECKPOINT_UNIT_ID,
        title: 'Shift check: Wine',
        blurb: 'every pour — grape, place and the ten-second pitch, cold',
        kind: 'checkpoint'
      }
    ]
  },
  {
    id: 'pairings',
    title: 'Pairings',
    track: 'pairings',
    blurb: 'match the dish to the pour — and say why like you mean it',
    units: [
      lesson('pair-snacks', 'Snacks & small plates', 'the openers — what pours with fries, oysters, crudo and the share plates, and why'),
      lesson('pair-veg-pizza', 'Vegetables & pizza', 'the green and the cheesy — acid, salt and intensity calls across the veg and pies'),
      lesson('pair-pasta-mains', 'Pasta & mains', 'the big plates — tannin for the red meat, fresh for the spice, and the why for each'),
      lesson('pair-dessert', 'Dessert', 'the one rule that flips: the pour has to be sweeter than the plate'),
      {
        id: PAIRINGS_CHECKPOINT_UNIT_ID,
        title: 'Shift check: Pairings',
        blurb: 'pour the room — the call and the why for every dish, cold',
        kind: 'checkpoint'
      }
    ]
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
