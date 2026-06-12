// Task D — item derivation + pure content accessors.
// Items are DERIVED from the path data (stages.ts) + authored service items;
// dish content comes ONLY from official data.foods fields, and the MC rung
// reuses the frozen v2 engine card (components:<foodId>:pick) as material.
import { data, type Food } from '$lib/data';
import { generateDeck } from '$lib/engine/training.js';
import type { Card } from '$lib/data';
import { mulberry32, shuffled } from '$lib/rng';
import { CHECKPOINT_UNIT_ID, DAY_ONE_UNIT_ID, UNIT_FOOD_IDS, stageById, unitById } from './stages';
import { SERVICE_ITEMS, type ServiceItem } from './service-items';
import type { JourneyItem } from './types';

// ---------------------------------------------------------------- init guard
// Never render empty teach content silently: every dish on the path must exist
// in data.foods WITH its official ingredients. Throws at module init.
const foodById = new Map<string, Food>(data.foods.map((f) => [f.id, f]));

for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
  const food = foodById.get(foodId);
  if (!food) throw new Error(`journey: foodId '${foodId}' missing from data.foods`);
  if (!food.ingredients || food.ingredients.length === 0)
    throw new Error(`journey: food '${foodId}' has no official ingredients`);
}

const serviceById = new Map<string, ServiceItem>(SERVICE_ITEMS.map((s) => [s.id, s]));

// ------------------------------------------------------------ item derivation
const dishItem = (unitId: string, foodId: string): JourneyItem => ({
  id: `dish:${foodId}`,
  kind: 'dish',
  unitId,
  foodId
});

// Items are STATIC after module init — memoized so the gating layer (which
// calls itemsForUnit under every status/progress read) never re-allocates.
const unitItemsCache = new Map<string, readonly JourneyItem[]>();

export function itemsForUnit(unitId: string): readonly JourneyItem[] {
  const cached = unitItemsCache.get(unitId);
  if (cached) return cached;
  unitById(unitId); // throws on unknown units
  let built: readonly JourneyItem[];
  if (unitId === DAY_ONE_UNIT_ID) {
    built = SERVICE_ITEMS.map((s) => ({ id: s.id, kind: 'service', unitId }));
  } else if (unitId === CHECKPOINT_UNIT_ID) {
    built = allStage1Items();
  } else {
    const foodIds = UNIT_FOOD_IDS[unitId];
    if (!foodIds) throw new Error(`journey: unit '${unitId}' has no dish roster`);
    built = foodIds.map((foodId) => dishItem(unitId, foodId));
  }
  unitItemsCache.set(unitId, built);
  return built;
}

let stage1Items: readonly JourneyItem[] | null = null;

/** All 57 Stage-1 items (16 service + 41 dish), home unitIds preserved. */
export function allStage1Items(): readonly JourneyItem[] {
  return (stage1Items ??= stageById('food-runner')
    .units.filter((u) => u.kind === 'lesson')
    .flatMap((u) => itemsForUnit(u.id)));
}

// --------------------------------------------------------------- accessors
export interface McContent {
  prompt: string;
  choices: string[];
  answerIndex: number;
}
/** Allergen framing carried by every dish REVEAL surface (spec: allergen chips
 * + the data.confirm.allergens line wherever a dish answer shows). Service
 * items carry none — the fields stay absent. */
export interface AllergenFraming {
  allergens?: string[];
  allergenNote?: string;
  /** safety framing is non-negotiable on any surface that shows allergens */
  confirmLine?: string;
}
export interface CuedContent extends AllergenFraming {
  prompt: string;
  hint: string;
  answer: string;
}
export interface FreeContent extends AllergenFraming {
  prompt: string;
  answer: string;
  detail?: string;
}
export interface DishTeach {
  kind: 'dish';
  name: string;
  price: string;
  category: string;
  description?: string;
  /** official ingredients grouped into <=4 display chunks, syllabus order kept */
  ingredients: string[][];
  allergens: string[];
  allergenNote?: string;
  menu: string;
  photoId: string;
  /** safety framing is non-negotiable on any surface that shows allergens */
  confirmLine: string;
}
export interface ServiceTeach {
  kind: 'service';
  name: string;
  body: string;
  why: string;
}
export type TeachContent = DishTeach | ServiceTeach;

function foodFor(item: JourneyItem): Food {
  const food = item.foodId ? foodById.get(item.foodId) : undefined;
  if (!food) throw new Error(`journey: item '${item.id}' has no food record`);
  return food;
}

function serviceFor(item: JourneyItem): ServiceItem {
  const s = serviceById.get(item.id);
  if (!s) throw new Error(`journey: item '${item.id}' has no authored service content`);
  return s;
}

// Deterministic per-item shuffle: the answer's position is stable for a given
// item id but varies across items (no always-first tell from the engine card,
// which builds choices as [answer, ...distractors]).
function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// The frozen v2 components deck, generated once and indexed by foodId. Reused
// as MC material only — the engine card ids never become journey item ids.
let componentsCards: Map<string, Card> | null = null;
function componentsCardFor(foodId: string): Card {
  if (!componentsCards) {
    const deck = generateDeck('components', data) as Card[];
    componentsCards = new Map(deck.map((c) => [c.sourceId!, c]));
  }
  const card = componentsCards.get(foodId);
  if (!card) throw new Error(`journey: no components:${foodId}:pick engine card`);
  return card;
}

function toMc(itemId: string, prompt: string, choices: readonly string[], answer: string): McContent {
  const order = shuffled(choices, mulberry32(hashId(itemId)));
  const answerIndex = order.indexOf(answer);
  if (answerIndex === -1) throw new Error(`journey: answer missing from choices for '${itemId}'`);
  return { prompt, choices: order, answerIndex };
}

export function mcFor(item: JourneyItem): McContent {
  if (item.kind === 'service') {
    const s = serviceFor(item);
    return toMc(item.id, s.prompt, s.choices, s.answer);
  }
  const card = componentsCardFor(foodFor(item).id);
  return toMc(item.id, card.prompt, card.choices!, card.answer);
}

/** The dish allergen framing — same sourcing as teachFor. */
function allergenFraming(f: Food): Required<Pick<AllergenFraming, 'allergens' | 'confirmLine'>> &
  AllergenFraming {
  return {
    allergens: f.allergens ?? [],
    ...(f.allergenNote ? { allergenNote: f.allergenNote } : {}),
    confirmLine: data.confirm.allergens
  };
}

export function cuedFor(item: JourneyItem): CuedContent {
  if (item.kind === 'service') {
    const s = serviceFor(item);
    return { prompt: s.prompt, hint: s.hint, answer: s.answer };
  }
  const f = foodFor(item);
  const ingredients = f.ingredients!;
  const letters = ingredients.map((i) => i[0].toUpperCase()).join(' · ');
  return {
    prompt: `What's in the ${f.name}?`,
    hint: `${ingredients.length} components — ${letters}`,
    answer: ingredients.join(', '),
    ...allergenFraming(f)
  };
}

export function freeFor(item: JourneyItem): FreeContent {
  if (item.kind === 'service') {
    const s = serviceFor(item);
    return { prompt: s.prompt, answer: s.answer };
  }
  const f = foodFor(item);
  return {
    prompt: `Describe the ${f.name} to a guest — name + key components.`,
    answer: f.ingredients!.join(', '),
    ...(f.description ? { detail: f.description } : {}),
    ...allergenFraming(f)
  };
}

/** The Romance drill's reveal surface — everything the runner needs to check
 * a spoken "This is our X…" line against the official truth. */
export interface RomanceContent extends AllergenFraming {
  name: string;
  category: string;
  price: string;
  /** The pass bar: the official FIRST-3 ingredients (the Playbook's bold-first-3
   * rule) — fewer when the dish only has 1-2 official components. */
  romanceTargets: string[];
  /** The official description — it already reads as the romance sentence. */
  modelLine: string;
  /** Full official ingredients, syllabus order. */
  ingredients: string[];
}

export function romanceFor(item: JourneyItem): RomanceContent {
  if (item.kind !== 'dish')
    throw new Error(`journey: romanceFor is dish-only — '${item.id}' has no plate to romance`);
  const f = foodFor(item);
  // Same hard-fail philosophy as the module-init guard: never hand the drill
  // an empty model line silently (every official path dish has a description).
  if (!f.description)
    throw new Error(`journey: food '${f.id}' has no official description for the romance line`);
  return {
    name: f.name,
    category: f.category,
    price: f.price,
    romanceTargets: f.ingredients!.slice(0, 3),
    modelLine: f.description,
    ingredients: f.ingredients!.slice(),
    ...allergenFraming(f)
  };
}

/** Group into <=4 chunks; order preserved; sizes differ by at most 1. */
function chunkEvenly(items: readonly string[], maxChunks = 4): string[][] {
  if (items.length <= maxChunks) return items.map((i) => [i]);
  const base = Math.floor(items.length / maxChunks);
  const extra = items.length % maxChunks;
  const out: string[][] = [];
  let at = 0;
  for (let c = 0; c < maxChunks; c++) {
    const size = base + (c < extra ? 1 : 0);
    out.push(items.slice(at, at + size));
    at += size;
  }
  return out;
}

export function teachFor(item: JourneyItem): TeachContent {
  if (item.kind === 'service') {
    const s = serviceFor(item);
    return { kind: 'service', name: s.title, body: s.answer, why: s.why };
  }
  const f = foodFor(item);
  return {
    kind: 'dish',
    name: f.name,
    price: f.price,
    category: f.category,
    ...(f.description ? { description: f.description } : {}),
    ingredients: chunkEvenly(f.ingredients!),
    allergens: f.allergens ?? [],
    ...(f.allergenNote ? { allergenNote: f.allergenNote } : {}),
    menu: f.menu,
    photoId: f.id,
    confirmLine: data.confirm.allergens
  };
}
