// Romance overlay + the photo/romance wiring on the dish accessors.
// The lines are guest-facing (said at the drop), so the guardrails matter:
// coverage for every path dish, >=3 real components named, and none of the
// banned/oversell words the research playbook rules out.
import { describe, expect, it } from 'vitest';
import { data } from '$lib/data';
import { UNIT_FOOD_IDS } from './stages';
import { ROMANCE } from './romance';
import {
  allStage1Items,
  allergenMcFor,
  cuedFor,
  freeFor,
  itemsForUnit,
  mcFor,
  romanceFor,
  romanceGuide
} from './items';
import type { JourneyItem } from './types';

const PATH_FOOD_IDS = Object.values(UNIT_FOOD_IDS).flat();
const food = (id: string) => data.foods.find((f) => f.id === id)!;
const dishItem = (foodId: string): JourneyItem =>
  allStage1Items().find((i) => i.foodId === foodId)!;

// Oversell / cliché / unsafe terms the romance must never use (research playbook).
const BANNED = [
  'delicious',
  'tasty',
  'yummy',
  'scrumptious',
  'appetizing',
  'to die for',
  'cooked to perfection',
  'melt-in-your-mouth',
  'simple yet elegant',
  'decadent',
  'sinful',
  'mouth-watering',
  'om nom'
];

const sigWords = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[()'’.,:;-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);

/** How many of the dish's official ingredients the line actually names — an
 * ingredient counts if any of its significant (>=4-char) words appears. */
function ingredientsNamed(romance: string, ingredients: string[]): number {
  const hay = romance.toLowerCase();
  let n = 0;
  for (const ing of ingredients) {
    if (sigWords(ing).some((w) => hay.includes(w))) n++;
  }
  return n;
}

/** Components named, counting the dish-name hero as component #1 (the formula
 * names the dish first — usually the lead ingredient) when its word appears and
 * isn't already one of the official ingredients (avoids double-counting). */
function namedComponentCount(romance: string, name: string, ingredients: string[]): number {
  const hay = romance.toLowerCase();
  const ingHay = ingredients.join(' ').toLowerCase();
  const heroNamed = sigWords(name).some((w) => hay.includes(w) && !ingHay.includes(w));
  return ingredientsNamed(romance, ingredients) + (heroNamed ? 1 : 0);
}

describe('ROMANCE overlay', () => {
  it('covers every path dish with a non-empty one-sentence line', () => {
    for (const id of PATH_FOOD_IDS) {
      const line = ROMANCE[id];
      expect(line, id).toBeTruthy();
      expect(line.trim().length, id).toBeGreaterThan(30);
      // a single recital, ending on a full stop
      expect(line.trimEnd().endsWith('.'), `${id}: "${line}"`).toBe(true);
    }
  });

  it('names at least three real components (or all, for sub-three dishes)', () => {
    for (const id of PATH_FOOD_IDS) {
      const f = food(id);
      const ings = f.ingredients ?? [];
      const need = Math.min(3, ings.length);
      const named = namedComponentCount(ROMANCE[id], food(id).name, ings);
      expect(named, `${id}: named ${named} (need ${need}) — "${ROMANCE[id]}"`).toBeGreaterThanOrEqual(need);
    }
  });

  it('never uses a banned / oversell word', () => {
    for (const id of Object.keys(ROMANCE)) {
      const hay = ROMANCE[id].toLowerCase();
      for (const bad of BANNED) {
        expect(hay.includes(bad), `${id} uses banned "${bad}"`).toBe(false);
      }
    }
  });

  // Generic cooking/serving vocabulary the romance may use without it being a
  // dish ingredient — technique, texture, and connective words from the research
  // playbook. Anything NOT here and NOT grounded in the dish's own data is a red
  // flag (a possible invented component) — the §6 guardrail, as a regression net.
  const VOCAB = new Set([
    // connectors / framing
    'here', 'here’s', "here's", 'this', 'that', 'with', 'over', 'under', 'into', 'from', 'then',
    'plus', 'your', 'like', 'alongside', 'served', 'side', 'have', 'about', 'what', 'when', 'ask',
    'our', 'the', 'and', 'for', 'without', 'every', 'them', 'each',
    // technique
    'house', 'house-made', 'wood', 'wood-fired', 'wood-roasted', 'fire', 'fired', 'oven', 'grill',
    'grilled', 'char-grilled', 'roasted', 'slow-roasted', 'fried', 'baked', 'braised', 'slow-braised',
    'smoked', 'cured', 'glazed', 'marinated', 'caramelized', 'seared', 'pan-seared', 'blistered',
    'charred', 'blackened', 'sauteed', 'sautéed', 'deglazed', 'boiled', 'breaded', 'poached', 'whipped',
    'shaved', 'sliced', 'piped', 'folded', 'tossed', 'dressed', 'drizzle', 'drizzled', 'dusted',
    'crowned', 'topped', 'layered', 'stacked', 'wrapped', 'basted', 'scooped', 'rolled', 'resting',
    'pooled', 'lifted', 'finished', 'finishing', 'finish', 'aerated', 'enriched', 'studded', 'spiced',
    // texture / sensory
    'crisp', 'crispy', 'tender', 'silky', 'creamy', 'buttery', 'golden', 'milky', 'bright', 'sweet',
    'cool', 'warm', 'crunchy', 'crystal', 'crystal-crunchy', 'crunch', 'soft', 'runny', 'molten',
    'pillowy', 'spicy', 'smoky', 'briny', 'nutty', 'herby', 'herbaceous', 'aromatic', 'fresh', 'rich',
    'robust', 'sunny', 'glossy', 'velvety', 'thin', 'just-torn', 'torn', 'just', 'stretchy', 'amber', 'savory', 'cracked',
    // structural / serving nouns
    'plate', 'shell', 'half', 'half-dozen', 'dozen', 'bite', 'sized', 'snap', 'drop', 'week', 'piece',
    'generous', 'grating', 'splash', 'squeeze', 'kick', 'swirl', 'scatter', 'whisper', 'thread', 'chip',
    'chip’s', "chip's", 'snap', 'pieces', 'chunks', 'leaves', 'leaf', 'cold', 'ice-cold', 'flavour',
    'rotating', 'dipping', 'crowned', 'two', 'ways', 'three', 'bone-in', 'thin-shaved',
    // more generic technique/texture/structural words used across the set
    'puffed', 'high', 'shavings', 'piled', 'five', 'base', 'melted', 'through', 'grated',
    'tubes', 'earthy', 'cooked',
    // generic descriptors true of a dish but not always in its own data row
    // (e.g. "Italian burrata", "house-made" sourdough/pomodoro)
    'italian', 'made'
  ]);

  it('names nothing ungrounded — every word is a dish ingredient/description word or cooking vocab', () => {
    const ungrounded: string[] = [];
    for (const id of PATH_FOOD_IDS) {
      const f = food(id);
      const corpus = [f.name, (f.ingredients ?? []).join(' '), f.description ?? '', f.menu ?? '']
        .join(' ')
        .toLowerCase();
      const has = (w: string) =>
        corpus.includes(w) ||
        (w.length > 4 && corpus.includes(w.replace(/s$/, ''))) ||
        (w.length > 5 && corpus.includes(w.slice(0, 5)));
      for (const w of sigWords(ROMANCE[id])) {
        if (VOCAB.has(w) || has(w)) continue;
        ungrounded.push(`${id}: "${w}"`);
      }
    }
    expect(ungrounded, `ungrounded words (possible invented components):\n${ungrounded.join('\n')}`).toEqual([]);
  });

  it('never makes an absolute allergen-safe / health claim', () => {
    for (const id of Object.keys(ROMANCE)) {
      const hay = ROMANCE[id].toLowerCase();
      for (const bad of ['allergen-free', 'gluten-free', 'safe for', 'healthy', 'won’t bother', "won't bother"]) {
        expect(hay.includes(bad), `${id} makes a claim: "${bad}"`).toBe(false);
      }
    }
  });
});

describe('dish accessors carry the plate + romance', () => {
  it('cuedFor(dish) carries photoId/photoName + the romance line', () => {
    for (const id of PATH_FOOD_IDS) {
      const c = cuedFor(dishItem(id));
      expect(c.photoId, id).toBe(id);
      expect(c.photoName, id).toBe(food(id).name);
      expect(c.romance, id).toBe(ROMANCE[id]);
    }
  });

  it('freeFor(dish) carries photoId/photoName + the romance line', () => {
    for (const id of PATH_FOOD_IDS) {
      const f = freeFor(dishItem(id));
      expect(f.photoId, id).toBe(id);
      expect(f.photoName, id).toBe(food(id).name);
      expect(f.romance, id).toBe(ROMANCE[id]);
    }
  });

  it('mcFor(dish) + allergenMcFor(dish) carry the plate (food-anchored)', () => {
    const c = mcFor(dishItem('tuna-crudo'));
    expect(c.photoId).toBe('tuna-crudo');
    expect(c.photoName).toBe(food('tuna-crudo').name);
    const a = allergenMcFor(dishItem('tuna-crudo'));
    expect(a.photoId).toBe('tuna-crudo');
  });

  it('romanceFor(dish) carries the romance + keeps the official description as modelLine', () => {
    const r = romanceFor(dishItem('grilled-octopus-salad'));
    expect(r.romance).toBe(ROMANCE['grilled-octopus-salad']);
    expect(r.modelLine).toBe(food('grilled-octopus-salad').description);
  });

  it('service items carry no plate or romance', () => {
    const c = cuedFor(itemsForUnit('day-one')[0]);
    expect(c.photoId).toBeUndefined();
    expect((c as { romance?: string }).romance).toBeUndefined();
  });
});

describe('romanceGuide', () => {
  it('groups every romanced dish by menu category, with a plate + line each', () => {
    const groups = romanceGuide();
    const ids = groups.flatMap((g) => g.dishes.map((d) => d.id));
    // every path dish is present
    for (const id of PATH_FOOD_IDS) expect(ids, id).toContain(id);
    // no dish appears twice; every entry is complete
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of groups) {
      expect(g.dishes.length).toBeGreaterThan(0);
      for (const d of g.dishes) {
        expect(d.romance).toBe(ROMANCE[d.id]);
        expect(d.photoId).toBe(d.id);
        expect(d.category).toBe(g.category);
      }
    }
  });
});
