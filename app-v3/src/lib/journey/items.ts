// Task D — item derivation + pure content accessors.
// Items are DERIVED from the path data (stages.ts) + authored service items;
// dish content comes ONLY from official data.foods fields. The dish MC rung is
// MINTED NATIVELY (componentsMcFor + key-components.ts) so it can vary by round
// and never quiz a base/given like "Pizza Dough"; the frozen v2 engine card
// (components:<foodId>:pick) and its ids are untouched (build/wine/pairing/
// allergen MCs still lift from their frozen decks).
import { data, type Food, type Cocktail, type Wine } from '$lib/data';
import { generateDeck } from '$lib/engine/training.js';
import { LEVERS } from '$lib/engine/pairing.js';
import type { Card } from '$lib/data';
import { mulberry32, shuffled } from '$lib/rng';
import {
  BAR_ARC_UNIT_ID,
  DAY_ONE_UNIT_ID,
  STAGES,
  UNIT_ALLERGEN_IDS,
  UNIT_BUILD_IDS,
  UNIT_FOOD_IDS,
  UNIT_PAIRING_IDS,
  UNIT_WINE_IDS,
  stageById,
  unitById
} from './stages';
import { SERVICE_ITEMS, type ServiceItem } from './service-items';
import { BAR_SERVICE_ITEMS } from './bar-items';
import { GIVEN_RAW, KEY_COMPONENTS } from './key-components';
import { ROMANCE } from './romance';
import type { JourneyItem } from './types';

// ---------------------------------------------------------------- init guard
// Never render empty teach content silently: every dish on the path must exist
// in data.foods WITH its official ingredients. Throws at module init.
const foodById = new Map<string, Food>(data.foods.map((f) => [f.id, f]));
const cocktailById = new Map<string, Cocktail>(data.cocktails.map((c) => [c.id, c]));
const wineById = new Map<string, Wine>(data.wines.map((w) => [w.id, w]));
// LEVERS is a frozen .js literal; typed as a lookup table for the pairing accessors.
const LEVER_TABLE = LEVERS as Record<string, { id: string; label: string; script: string }>;

for (const foodId of Object.values(UNIT_FOOD_IDS).flat()) {
  const food = foodById.get(foodId);
  if (!food) throw new Error(`journey: foodId '${foodId}' missing from data.foods`);
  if (!food.ingredients || food.ingredients.length === 0)
    throw new Error(`journey: food '${foodId}' has no official ingredients`);
  // romanceFor (the /romance drill, /test, and the Romance Exam) reads the
  // official description as the model line — fail loud at init, not at the
  // first card, if a path dish ever ships without one.
  if (!food.description)
    throw new Error(`journey: food '${foodId}' has no official description`);
  // §0b: every path dish carries a memory hook (the romance/exam/teach reveals
  // surface it). Required for PATH dishes only (off-menu foods carry none) —
  // fail loud at init so a new dish can't silently ship hookless.
  if (!food.memoryHook)
    throw new Error(`journey: food '${foodId}' has no memory hook`);
  // Every path dish carries a guest-facing romance line (the say-it-at-the-drop
  // recital surfaced on the dish reveal, the /romance drill + exam, and the study
  // guide). Authored in journey/romance.ts — fail loud at init so a new path dish
  // can't silently ship without one.
  if (!ROMANCE[foodId] || !ROMANCE[foodId].trim())
    throw new Error(`journey: food '${foodId}' has no authored romance line`);
}

// Same hard-fail philosophy for Stage 3: every cocktail on a build module must
// exist in data.cocktails WITH an official build (UNIT_BUILD_IDS already excludes
// build-less drinks, so this also guards the roster and the frozen builds deck
// from drifting apart).
for (const cocktailId of Object.values(UNIT_BUILD_IDS).flat()) {
  const c = cocktailById.get(cocktailId);
  if (!c) throw new Error(`journey: cocktailId '${cocktailId}' missing from data.cocktails`);
  if (!c.build || c.build.length === 0)
    throw new Error(`journey: cocktail '${cocktailId}' has no official build`);
}

// Stage 4: every wine on a family module must exist in data.wines with the
// fields its teach/recall needs (grape, region, the ten-second story).
for (const wineId of Object.values(UNIT_WINE_IDS).flat()) {
  const w = wineById.get(wineId);
  if (!w) throw new Error(`journey: wineId '${wineId}' missing from data.wines`);
  if (!w.grape || !w.region || !w.tenSecond)
    throw new Error(`journey: wine '${wineId}' is missing grape/region/tenSecond`);
  // The teach card decodes price as a 3-part "5oz | 8oz | bottle" ladder — a
  // malformed price would render a garbled string, so fail loud at init instead.
  if (w.price.split('|').length !== 3)
    throw new Error(`journey: wine '${wineId}' price '${w.price}' is not a 3-part 5oz|8oz|bottle ladder`);
}

// Stage 5: every dish on a pairing module must carry its official pour, a valid
// WSET lever, and a structural why — the MC reuses the pour; cued/free/teach
// teach the lever + the why. Requiring all three keeps a future leverless/whyless
// dish from silently shipping a hollow "the pour, and nothing about why" card.
for (const foodId of Object.values(UNIT_PAIRING_IDS).flat()) {
  const f = foodById.get(foodId);
  if (!f) throw new Error(`journey: pairing foodId '${foodId}' missing from data.foods`);
  if (!f.wine) throw new Error(`journey: pairing dish '${foodId}' has no official wine pour`);
  if (!f.lever || !LEVER_TABLE[f.lever])
    throw new Error(`journey: pairing dish '${foodId}' has no valid WSET lever ('${f.lever}')`);
  if (!f.why) throw new Error(`journey: pairing dish '${foodId}' has no structural why`);
}

// Day-one + the bar arc-of-service module are the two authored-content units;
// their items share the service:* namespace + accessors, so the lookup merges
// both arrays (ids are disjoint by prefix: service:<slug> vs service:bar-<slug>).
const serviceById = new Map<string, ServiceItem>(
  [...SERVICE_ITEMS, ...BAR_SERVICE_ITEMS].map((s) => [s.id, s])
);

// ------------------------------------------------------------ item derivation
const dishItem = (unitId: string, foodId: string): JourneyItem => ({
  id: `dish:${foodId}`,
  kind: 'dish',
  unitId,
  foodId
});

const allergenItem = (unitId: string, foodId: string): JourneyItem => ({
  id: `allergen:${foodId}`,
  kind: 'allergen',
  unitId,
  foodId
});

/** The first-shift priority cocktails — the drinks made earliest on the rail,
 * surfaced as a pinned pre-shift drill (/build?shift=1) reachable before the bar
 * stage unlocks. Kept here so the route and Today share ONE list. */
export const FIRST_SHIFT_COCKTAIL_IDS = [
  'heartbreak-mountain',
  'eat-apres-love',
  'cruel-summer',
  'rolling-canoe',
  'paradise-city',
  'cloud-9',
  'spaghetti-western'
] as const;

const buildItem = (unitId: string, cocktailId: string): JourneyItem => ({
  id: `build:${cocktailId}`,
  kind: 'build',
  unitId,
  cocktailId
});

const wineItem = (unitId: string, wineId: string): JourneyItem => ({
  id: `wine:${wineId}`,
  kind: 'wine',
  unitId,
  wineId
});

// Pairing items are DISH-anchored (the call is "what pours with this dish") — they
// reuse foodId, namespaced apart from dish:/allergen: by the pairing: prefix.
const pairingItem = (unitId: string, foodId: string): JourneyItem => ({
  id: `pairing:${foodId}`,
  kind: 'pairing',
  unitId,
  foodId
});

// Items are STATIC after module init — memoized so the gating layer (which
// calls itemsForUnit under every status/progress read) never re-allocates.
const unitItemsCache = new Map<string, readonly JourneyItem[]>();

/** Items of a unit, dispatched by unit kind + roster (stage-generic):
 *  - checkpoint → the union of its stage's lesson units' items
 *  - day-one → the authored service calls
 *  - a dish-roster unit → dish:<foodId> items
 *  - an allergen-roster unit → allergen:<foodId> items */
export function itemsForUnit(unitId: string): readonly JourneyItem[] {
  const cached = unitItemsCache.get(unitId);
  if (cached) return cached;
  const { unit, stage } = unitById(unitId); // throws on unknown units
  let built: readonly JourneyItem[];
  if (unit.kind === 'checkpoint') {
    built = stage.units.filter((u) => u.kind === 'lesson').flatMap((u) => itemsForUnit(u.id));
  } else if (unitId === DAY_ONE_UNIT_ID) {
    built = SERVICE_ITEMS.map((s) => ({ id: s.id, kind: 'service', unitId }));
  } else if (unitId === BAR_ARC_UNIT_ID) {
    built = BAR_SERVICE_ITEMS.map((s) => ({ id: s.id, kind: 'service', unitId }));
  } else if (UNIT_FOOD_IDS[unitId]) {
    built = UNIT_FOOD_IDS[unitId].map((foodId) => dishItem(unitId, foodId));
  } else if (UNIT_ALLERGEN_IDS[unitId]) {
    built = UNIT_ALLERGEN_IDS[unitId].map((foodId) => allergenItem(unitId, foodId));
  } else if (UNIT_BUILD_IDS[unitId]) {
    built = UNIT_BUILD_IDS[unitId].map((cocktailId) => buildItem(unitId, cocktailId));
  } else if (UNIT_WINE_IDS[unitId]) {
    built = UNIT_WINE_IDS[unitId].map((wineId) => wineItem(unitId, wineId));
  } else if (UNIT_PAIRING_IDS[unitId]) {
    built = UNIT_PAIRING_IDS[unitId].map((foodId) => pairingItem(unitId, foodId));
  } else {
    throw new Error(`journey: unit '${unitId}' has no item roster`);
  }
  unitItemsCache.set(unitId, built);
  return built;
}

let allItemsCache: readonly JourneyItem[] | null = null;
/** Every lesson item across all stages that have content — the resolution
 * universe for /review, /preshift, /progress (which speak store ids). */
export function allItems(): readonly JourneyItem[] {
  return (allItemsCache ??= STAGES.flatMap((s) =>
    s.units.filter((u) => u.kind === 'lesson').flatMap((u) => itemsForUnit(u.id))
  ));
}

/** Menu categories present among the path dishes, in path (menu) order — for
 * the drill category filters ("drill just the pastas"). */
let pathCats: string[] | null = null;
export function pathCategories(): string[] {
  if (!pathCats) {
    const seen: string[] = [];
    for (const item of allStage1Items()) {
      if (item.kind !== 'dish') continue;
      const cat = foodFor(item).category;
      if (!seen.includes(cat)) seen.push(cat);
    }
    pathCats = seen;
  }
  return pathCats;
}

/** The menu category of a food-backed item (dish/allergen/pairing → data.foods)
 * or a build item (→ data.cocktails). For drill interleaving + category chips. */
export function categoryOf(item: JourneyItem): string {
  if (item.foodId) return foodById.get(item.foodId)?.category ?? '';
  if (item.cocktailId) return cocktailById.get(item.cocktailId)?.category ?? '';
  if (item.wineId) return wineById.get(item.wineId)?.family ?? '';
  return '';
}

/** Filter food-backed items (dish or allergen) to a single menu category
 * (null/undefined → unchanged). */
export function filterByCategory(
  items: readonly JourneyItem[],
  category: string | null
): readonly JourneyItem[] {
  if (!category) return items;
  return items.filter((i) => !!i.foodId && categoryOf(i) === category);
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
  /** The dish plate for the prompt (food-anchored kinds only): photoId = food id
   * (gates on PHOTO_IDS in DishPhoto), photoName for the alt + placeholder. The
   * route decides whether to render it — practice surfaces pass it through; the
   * graded mock test does not (D5: never inflate a readiness score). */
  photoId?: string;
  photoName?: string;
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
  /** dish plate for the prompt (food-anchored kinds) — see McContent */
  photoId?: string;
  photoName?: string;
  /** the say-it-like-this romance line (dish reveals only) */
  romance?: string;
}
export interface FreeContent extends AllergenFraming {
  prompt: string;
  answer: string;
  detail?: string;
  /** dish plate for the prompt (food-anchored kinds) — see McContent */
  photoId?: string;
  photoName?: string;
  /** the say-it-like-this romance line (dish reveals only) */
  romance?: string;
}

/** The plate fields a food-anchored card hands its prompt: photoId = food id
 * (DishPhoto gates on PHOTO_IDS, branded placeholder otherwise), photoName for
 * the image alt. Spread into the dish/allergen/pairing accessor returns. */
function photoOf(f: Food): { photoId: string; photoName: string } {
  return { photoId: f.id, photoName: f.name };
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
  /** Optional memory hook (§0b) — a vivid name→components mnemonic, when authored. */
  memoryHook?: string;
  /** the guest-facing romance recital (the say-it-at-the-drop line) — shown as
   * the model on the dish teach/description card. */
  romance?: string;
}
export interface ServiceTeach {
  kind: 'service';
  name: string;
  body: string;
  why: string;
}
/** Stage 3 — the cocktail teach surface: the official build + how it drinks +
 * what to say setting it down, with the bar-confirm safety line. */
export interface BuildTeach {
  kind: 'build';
  name: string;
  price: string;
  category: string;
  description?: string;
  /** menu section: Cross-Venue Classics | Calgary Exclusives | NA Cocktails */
  section?: string;
  /** official build, syllabus order (clean component names) */
  build: string[];
  /** measured build lines ("Beefeater Gin — 1.5 oz") — the make-it recipe */
  spec?: string[];
  /** build technique (shake/stir/build, strain, keg-pour) */
  method?: string;
  glass?: string;
  /** ice / how it's served (king cube, rocks, up) */
  ice?: string;
  garnish?: string;
  flavorTags: string[];
  /** the dishes this drink pours alongside (cocktail.pair, comma-joined string) */
  pair: string;
  /** the floor-ready "what to say" line */
  say: string;
  allergens: string[];
  allergenNote?: string;
  /** safety framing is non-negotiable on any surface that shows allergens */
  confirmLine: string;
}
/** Stage 4 — the by-the-glass pour teach surface: identity (grape/place),
 * structure, pronunciation, the ten-second story, and what it pours with. */
export interface WineTeach {
  kind: 'wine';
  name: string;
  price: string;
  grape: string;
  region: string;
  country: string;
  family: string;
  climate: string;
  structure: { acidity: string; body: string; tannin: string; sweetness: string };
  /** pronunciation respelling shown on the speak chip */
  respell: string;
  /** the spoken form fed to the Web-Speech fallback */
  say: string;
  /** wineId — the /audio/<wineId>.mp3 clip key */
  audioId: string;
  tenSecond: string;
  profile: string;
  /** dishes this pour sings with (wine.pair) */
  pair: string[];
  mnemonic?: string;
}
/** Stage 5 — the pairing teach surface: the dish → its pour + the WSET lever
 * that makes it work + the why, plus the non-drinker cocktail call. */
export interface PairingTeach {
  kind: 'pairing';
  name: string;
  category: string;
  /** the by-the-glass pour for this dish */
  wine: string;
  /** the lever's floor-ready label + script (when the dish carries a lever) */
  leverLabel?: string;
  leverScript?: string;
  /** the dish's own structural reason */
  why: string;
  /** the non-drinker call */
  cocktail?: string;
  zero?: string;
}
export type TeachContent = DishTeach | ServiceTeach | BuildTeach | WineTeach | PairingTeach;

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

function cocktailFor(item: JourneyItem): Cocktail {
  const c = item.cocktailId ? cocktailById.get(item.cocktailId) : undefined;
  if (!c) throw new Error(`journey: item '${item.id}' has no cocktail record`);
  return c;
}

function wineFor(item: JourneyItem): Wine {
  const w = item.wineId ? wineById.get(item.wineId) : undefined;
  if (!w) throw new Error(`journey: item '${item.id}' has no wine record`);
  return w;
}

/** The standing bar-confirm safety line — drinks are confirmed with the BAR, not
 * the kitchen (mirrors data.confirm.allergens' phrasing for the bar counter; the
 * frozen builds/allergens engine cards already end every flagged drink with the
 * equivalent rule). Shown on every build reveal. */
export const BAR_CONFIRM = 'Always confirm allergens with the bar. Never guess — this is safety-critical.';

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

// The frozen v2 builds deck (Stage 3 — cocktail rows only), indexed by cocktailId.
// Now used ONLY as a PRESENCE GATE (hasBuildDeck): the build MC content is minted
// natively in buildMcFor (the deck's prompt/choices/answer are no longer read),
// exactly as dish:* mints components natively. A drink with no official build mints
// no card (Spicy Sandia / Lovers Mountain) — callers guard with hasBuildDeck.
let buildsCards: Map<string, Card> | null = null;
function buildsCardFor(cocktailId: string): Card | undefined {
  if (!buildsCards) {
    const deck = generateDeck('builds', data) as Card[];
    buildsCards = new Map(deck.map((c) => [c.sourceId!, c]));
  }
  return buildsCards.get(cocktailId);
}

/** True when the cocktail has a frozen builds card to quiz from (a drink with no
 * official build mints none). Mirrors hasAllergenMc — rosters already exclude the
 * build-less drinks, this is the belt-and-suspenders guard for callers. */
export function hasBuildDeck(item: JourneyItem): boolean {
  return item.kind === 'build' && !!item.cocktailId && !!buildsCardFor(item.cocktailId);
}

// The frozen v2 wine-identity deck (Stage 4), the name→identity direction
// (wine-identity:<wineId>:grape — "X: what grape and region?"), indexed by
// wineId. Reused as MC material only, like the components/builds decks.
let wineIdentityCards: Map<string, Card> | null = null;
function wineIdentityCardFor(wineId: string): Card | undefined {
  if (!wineIdentityCards) {
    const deck = generateDeck('wine-identity', data) as Card[];
    wineIdentityCards = new Map(
      deck.filter((c) => c.id.endsWith(':grape')).map((c) => [c.sourceId!, c])
    );
  }
  return wineIdentityCards.get(wineId);
}

// The frozen v2 pairing deck (Stage 5 — dish→best by-the-glass pour), indexed by
// foodId. Reused as MC material only, like the components/builds/wine-identity decks.
let pairingCards: Map<string, Card> | null = null;
function pairingCardFor(foodId: string): Card | undefined {
  if (!pairingCards) {
    const deck = generateDeck('pairing', data) as Card[];
    pairingCards = new Map(deck.filter((c) => c.sourceKind === 'food').map((c) => [c.sourceId!, c]));
  }
  return pairingCards.get(foodId);
}

/** The lever's floor-ready label + script for a dish (when it carries one). */
function leverOf(f: Food): { label: string; script: string } | undefined {
  return f.lever ? LEVER_TABLE[f.lever] : undefined;
}

export interface PairingMcContent extends McContent {
  /** the lever + the dish's why, taught on the reveal */
  why: string;
}

/** The pairing MC (Stage 5 path + pairings checkpoint). Recognition rung: given
 * the dish, name the best by-the-glass pour (the frozen pairing card); the reveal
 * teaches the lever that makes it work + the dish's structural why. */
export function pairingMcFor(item: JourneyItem, round = 0): PairingMcContent {
  if (item.kind !== 'pairing')
    throw new Error(`journey: pairingMcFor needs a pairing item — '${item.id}' is not a dish pairing`);
  const f = foodFor(item);
  const card = pairingCardFor(f.id);
  if (!card) throw new Error(`journey: '${item.id}' has no pairing engine card (dish has no pour)`);
  const lever = leverOf(f);
  const why = lever ? `${lever.label} — ${lever.script}${f.why ? ` ${f.why}` : ''}` : (f.why ?? '');
  // One true pour (card.answer) — can't rotate — but the WRONG pours rotate by
  // round (other dishes' pours, same dish-category first), 5 options.
  const distractors = pickPairingDistractors(f, card.answer, round, 4);
  return {
    ...toMc(`${item.id}:pairing:${round}`, card.prompt, [card.answer, ...distractors], card.answer),
    ...photoOf(f),
    why
  };
}

export interface WineMcContent extends McContent {
  /** the ten-second story, taught on the reveal */
  why: string;
}

/** The wine identity MC (Stage 4 path recognition rung): given the pour's name,
 * name the grape + region (the frozen wine-identity card); the reveal teaches the
 * ten-second story. The path's mc→cued→free ladder grades on this MC at the mc
 * rung; the checkpoint serves the free rung (cold grape+region+pitch recall). */
export function wineMcFor(item: JourneyItem, round = 0): WineMcContent {
  if (item.kind !== 'wine')
    throw new Error(`journey: wineMcFor needs a wine item — '${item.id}' is not a by-the-glass pour`);
  const w = wineFor(item);
  const card = wineIdentityCardFor(w.id);
  if (!card)
    throw new Error(`journey: '${item.id}' has no wine-identity engine card`);
  // One true grape+region (card.answer) — can't rotate — but the WRONG identities
  // rotate by round (other wines, same family first), 5 options.
  const distractors = pickWineDistractors(w, card.answer, round, 4);
  return {
    ...toMc(`${item.id}:wine:${round}`, card.prompt, [card.answer, ...distractors], card.answer),
    why: w.tenSecond || w.profile || ''
  };
}

function toMc(itemId: string, prompt: string, choices: readonly string[], answer: string): McContent {
  const order = shuffled(choices, mulberry32(hashId(itemId)));
  const answerIndex = order.indexOf(answer);
  if (answerIndex === -1) throw new Error(`journey: answer missing from choices for '${itemId}'`);
  return { prompt, choices: order, answerIndex };
}

/** The per-round shuffle seed for a single-fact MC: round 0 keeps the original
 * seed (so a fresh showing is byte-identical to before), round>0 re-orders. */
function roundSeed(base: string, round: number): string {
  return round ? `${base}:${round}` : base;
}

/**
 * The MC content for any item's recognition rung. `round` (default 0) varies the
 * question across showings so pretest, the criterion quiz, and each recycle never
 * repeat the same screen: dish + build MCs ROTATE which component is asked and
 * draw fresh distractors; single-fact MCs (allergen/wine/pairing/service) re-seed
 * the choice ORDER. round 0 reproduces the original content (back-compatible).
 */
export function mcFor(item: JourneyItem, round = 0): McContent {
  if (item.kind === 'service') {
    const s = serviceFor(item);
    return toMc(roundSeed(item.id, round), s.prompt, s.choices, s.answer);
  }
  // Allergen items (Stage 2) grade on the flag MC; the learn session reads this
  // for correctness, so the dispatch has to be here, not just in the route.
  if (item.kind === 'allergen') return allergenMcFor(item, round);
  // Build items (Stage 3) grade on the builds MC — same dispatch-in-mcFor rule.
  if (item.kind === 'build') return buildMcFor(item, round);
  // Wine items (Stage 4) grade on the identity MC.
  if (item.kind === 'wine') return wineMcFor(item, round);
  // Pairing items (Stage 5) grade on the dish→pour MC.
  if (item.kind === 'pairing') return pairingMcFor(item, round);
  // Dish items (Stage 1) — minted natively so the answer rotates by round and a
  // base/given (e.g. "Pizza Dough") is never the call. The plate rides along for
  // the prompt (food-anchored); the route decides whether to show it.
  return { ...componentsMcFor(item, round), ...photoOf(foodFor(item)) };
}

export interface BuildMcContent extends McContent {
  /** the official build (+ allergen line when flagged) for the reveal teach-back */
  why: string;
  /** safety framing is non-negotiable on any surface that shows a drink */
  confirmLine: string;
}

/** The cocktail build MC (Stage 3 path + bar checkpoint). Question/choices come
 * from the frozen builds card ("Which of these is IN the X?"); the reveal teaches
 * the full official build and, when the drink is flagged, its allergens + the
 * standing bar-confirm line. Both the path unit and the checkpoint grade on this. */
export function buildMcFor(item: JourneyItem, round = 0): BuildMcContent {
  if (item.kind !== 'build')
    throw new Error(`journey: buildMcFor needs a build item — '${item.id}' is not a cocktail build`);
  const c = cocktailFor(item);
  if (!c.build || c.build.length === 0)
    throw new Error(`journey: '${item.id}' has no official build — check hasBuildDeck first`);
  // Minted natively from the official build (the frozen builds card is NOT used
  // here): the asked component ROTATES by round + fresh distractors, exactly like
  // the dish components MC, so pretest / quiz / recycle never repeat. 5 options.
  const pool = buildPool(c);
  const answer = pool[((round % pool.length) + pool.length) % pool.length];
  const distractors = pickBuildDistractors(c, answer, round, N_BUILD_OPTIONS - 1);
  const flags = c.allergens ?? [];
  let why = `Official build: ${c.build.join(', ')}.`;
  if (flags.length > 0) {
    const note = c.allergenNote ? ` ${c.allergenNote}${/[.!?]$/.test(c.allergenNote) ? '' : '.'}` : '';
    why += ` Contains ${flags.join(', ')}.${note}`;
  }
  return {
    ...toMc(`${item.id}:build:${round}`, `Which of these is IN the ${c.name}?`, [answer, ...distractors], answer),
    why,
    confirmLine: BAR_CONFIRM
  };
}

// ----------------------------------------------------- Test-Prep accessors
// The frozen v2 allergens deck (food rows only — the same deck also mints
// cocktail cards), indexed by foodId. Reused as MC material only, like the
// components deck above.
let allergensCards: Map<string, Card> | null = null;
function allergenCardFor(foodId: string): Card | undefined {
  if (!allergensCards) {
    const deck = generateDeck('allergens', data) as Card[];
    allergensCards = new Map(
      deck.filter((c) => c.sourceKind === 'food').map((c) => [c.sourceId!, c])
    );
  }
  return allergensCards.get(foodId);
}

// The standing v2 compliance sentence every food allergens card's why ends
// with (training.js KITCHEN_CONFIRM, frozen byte-for-byte). v3 shows ONE
// standard safety line everywhere (data.confirm.allergens), so allergenMcFor
// lifts this tail off the why and carries the app-wide confirmLine instead —
// the flags + note content is reused verbatim.
const ENGINE_KITCHEN_CONFIRM =
  'Always confirm allergens with the kitchen before promising a guest.';

export interface AllergenMcContent extends McContent {
  /** The card's flags + note (its frozen v2 confirm tail replaced by confirmLine). */
  why: string;
  /** safety framing is non-negotiable on any surface that shows allergens */
  confirmLine: string;
}

/** Allergen MC works for both dish items (Stage 1 mock test) and allergen
 * items (Stage 2 path) — both carry a foodId; the question is the same flag MC. */
function isFoodItem(item: JourneyItem): boolean {
  return item.kind === 'dish' || item.kind === 'allergen';
}

/** True when the dish has a frozen allergens card to quiz from (a dish with no
 * flags mints none — callers skip those; today every path dish has one). */
export function hasAllergenMc(item: JourneyItem): boolean {
  return isFoodItem(item) && !!item.foodId && !!allergenCardFor(item.foodId);
}

export function allergenMcFor(item: JourneyItem, round = 0): AllergenMcContent {
  if (!isFoodItem(item))
    throw new Error(`journey: allergenMcFor needs a dish/allergen item — '${item.id}' carries no flags`);
  const f = foodFor(item);
  const card = allergenCardFor(f.id);
  if (!card)
    throw new Error(
      `journey: '${item.id}' has no allergens engine card (no flags) — check hasAllergenMc first`
    );
  if (!card.why || !card.why.endsWith(ENGINE_KITCHEN_CONFIRM))
    throw new Error(`journey: allergens card '${card.id}' lost its confirm tail — deck shape drifted`);
  const why = card.why.slice(0, card.why.length - ENGINE_KITCHEN_CONFIRM.length).trim();
  // Mint the QUESTION natively so each round differs: a dish carries SEVERAL flags,
  // so rotate WHICH flag is the answer (each is genuinely carried) + fresh
  // distractor allergens the dish does NOT carry, 5 options. The `why` (the dish's
  // FULL flags + note — the safety teach-back) and confirmLine are unchanged.
  const flags = f.allergens ?? [];
  const answer = flags[((round % flags.length) + flags.length) % flags.length];
  const distractors = pickAllergenDistractors(f, answer, round, 4);
  return {
    ...toMc(`${item.id}:allergen:${round}`, card.prompt, [answer, ...distractors], answer),
    ...photoOf(f),
    why,
    confirmLine: data.confirm.allergens
  };
}

export interface ReverseMcContent extends McContent {
  /** The dish's most distinctive official component — the prompt's subject. */
  component: string;
}

/** Generic pantry tokens never asked about when the dish has a rarer, more
 * tellable component (they'd make "which dish?" unanswerable anyway). */
const GENERIC_COMPONENTS = new Set([
  'salt',
  'sea salt',
  'flaky salt',
  'olive oil',
  'extra virgin olive oil',
  'evoo'
]);

// ------------------------------------------------------- word normalization
// Every string comparison reverse minting makes (rarity counting, ingredient
// exclusion, name-leak checks) runs through ONE rule: the frozen engine's
// wordSet split (lowercase, non-alphanumeric boundaries — training.js) plus a
// simple plural fold, trailing 's' stripped per word — so 'Chive' and 'Chives'
// are the same token everywhere.
const foldPlural = (w: string): string =>
  w.length > 1 && w.endsWith('s') ? w.slice(0, -1) : w;
/** Lowercased, plural-folded words of a string (engine word rule + 's' strip). */
export function normWords(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(foldPlural);
}
/** Canonical comparison key for a whole ingredient token. */
export function normKey(s: string): string {
  return normWords(s).join(' ');
}

// The reverse-lookup universe: the 41 path dishes + how many of them carry
// each ingredient token (normalized — see normKey). Derived once — path data
// is static.
let reverseUniverse: { dishes: Food[]; freq: Map<string, number> } | null = null;
function getReverseUniverse(): { dishes: Food[]; freq: Map<string, number> } {
  if (!reverseUniverse) {
    const dishes = Object.values(UNIT_FOOD_IDS)
      .flat()
      .map((id) => foodById.get(id)!);
    const freq = new Map<string, number>();
    for (const d of dishes)
      for (const ing of d.ingredients!) {
        const k = normKey(ing);
        freq.set(k, (freq.get(k) ?? 0) + 1);
      }
    reverseUniverse = { dishes, freq };
  }
  return reverseUniverse;
}

// ------------------------------------------------- dish components MC (variety)
// The dish recognition rung ("Which of these is IN the <dish>?") is minted HERE,
// natively from the official ingredients — NOT lifted from the frozen v2 card —
// so it can (a) never quiz a base/given like "Pizza Dough", and (b) vary by
// `round`: each showing (pretest / quiz / recycle) ROTATES which distinctive
// component is asked and draws a fresh distractor window. Five options. The
// frozen engine deck + its card ids are untouched.
const N_DISH_OPTIONS = 5;
const GIVEN_KEYS = new Set(GIVEN_RAW.map(normKey));

/** A base/given/generic that must never be the tested answer or a distractor. */
function isGivenComponent(ing: string): boolean {
  return GENERIC_COMPONENTS.has(ing.toLowerCase()) || GIVEN_KEYS.has(normKey(ing));
}

/** A dish's distinctive, quiz-worthy components, RANKED best-first. The verified
 * agent audit (key-components.ts) wins; else an algorithmic fallback ranks the
 * non-given, non-name-leak ingredients by menu-wide rarity (rarer = more
 * tellable). Always returns >= 1 (never throws) — every path dish has one.
 * Exported for the fallback regression test. */
export function distinctivePool(f: Food): string[] {
  const ings = f.ingredients ?? [];
  const nameWords = new Set(normWords(f.name));
  const isNameLeak = (i: string): boolean => normWords(i).some((w) => nameWords.has(w));
  const ok = (i: string): boolean => !isGivenComponent(i) && !isNameLeak(i);

  // Authored ranking — keep only entries still backed by a real, non-given,
  // non-name-leak ingredient (so a data drift shrinks the pool, never poisons it).
  const authored = KEY_COMPONENTS[f.id];
  if (authored && authored.length) {
    const byKey = new Map(ings.map((i) => [normKey(i), i] as const));
    const valid: string[] = [];
    for (const a of authored) {
      const real = byKey.get(normKey(a)); // map the authored token → the verbatim data string
      if (real && ok(real) && !valid.includes(real)) valid.push(real);
    }
    if (valid.length) return valid;
  }
  // Fallback (off-path / unaudited dishes): rank the eligible ingredients by
  // global rarity, rarest first. Relax the NAME-LEAK rule before the GIVEN rule
  // (a leak only gives the answer away; a given is uninformative), so a base/given
  // is the answer ONLY when the dish has no non-given ingredient at all — the
  // "never quiz a given" invariant holds even under data drift.
  const { freq } = getReverseUniverse();
  const eligible = ings.filter(ok);
  const nonGiven = ings.filter((i) => !isGivenComponent(i));
  const pool = eligible.length ? eligible : nonGiven.length ? nonGiven : ings.slice();
  return [...pool].sort((a, b) => (freq.get(normKey(a)) ?? 99) - (freq.get(normKey(b)) ?? 99));
}

/** Take `n` items from an ordered candidate list through a `round`-stepped window
 * — consecutive rounds get disjoint sets until the pool wraps, so no two rounds
 * show the same distractors. Shared by every MC distractor picker. */
function windowed(ordered: readonly string[], round: number, n: number): string[] {
  if (ordered.length <= n) return [...ordered];
  const start = (round * n) % ordered.length;
  const out: string[] = [];
  for (let k = 0; k < ordered.length && out.length < n; k++) out.push(ordered[(start + k) % ordered.length]);
  return out;
}

/** Distractors for a dish MC: ingredients of OTHER path dishes (never in this
 * dish, never a given/generic), deduped by normKey, same-category first for
 * tougher discrimination — drawn through a `round`-rotated window so each round
 * shows a DIFFERENT set. */
function pickDishDistractors(f: Food, answer: string, round: number, n: number): string[] {
  const { dishes } = getReverseUniverse();
  const mine = new Set((f.ingredients ?? []).map(normKey));
  const seen = new Set<string>([normKey(answer)]);
  const sameCat: string[] = [];
  const crossCat: string[] = [];
  for (const d of dishes) {
    if (d.id === f.id) continue;
    for (const ing of d.ingredients ?? []) {
      const k = normKey(ing);
      if (mine.has(k) || seen.has(k) || isGivenComponent(ing)) continue;
      seen.add(k);
      (d.category === f.category ? sameCat : crossCat).push(ing);
    }
  }
  // Stable base order per dish, then a round-stepped window → disjoint sets
  // round-to-round until the pool wraps.
  const ordered = [
    ...shuffled(sameCat, mulberry32(hashId(`${f.id}:dd`))),
    ...shuffled(crossCat, mulberry32(hashId(`${f.id}:dx`)))
  ];
  return windowed(ordered, round, n);
}

/**
 * The dish components MC, minted natively. `round` rotates the asked component
 * (round 0 = most distinctive, round 1 = next, …) and the distractor window, so
 * pretest, the criterion quiz, and each recycle never repeat. Five options; the
 * answer is always a real, distinctive component; the four distractors are never
 * in the dish and never a base/given. Default round 0 keeps it deterministic.
 */
export function componentsMcFor(item: JourneyItem, round = 0): McContent {
  const f = foodFor(item);
  const pool = distinctivePool(f);
  const answer = pool[((round % pool.length) + pool.length) % pool.length]; // safe wrap for any round
  const distractors = pickDishDistractors(f, answer, round, N_DISH_OPTIONS - 1);
  return toMc(
    `${item.id}:components:${round}`,
    `Which of these is IN the ${f.name}?`,
    [answer, ...distractors],
    answer
  );
}

// ------------------------------------------------ cocktail build MC (variety)
// The bar "which is IN the <drink>?" MC, minted natively from the official build
// — the exact sibling of the dish components MC: rotate the asked component by
// round + fresh distractors, 5 options. No "given" set (a build has no dough-
// equivalent), but a build item that shares a word with the DRINK name is dropped
// (the White Peach Negroni never asks about "Peach Liqueur"). The frozen builds
// deck + its card ids stay untouched.
const N_BUILD_OPTIONS = 5;

let buildUniverse: { cocktails: Cocktail[]; freq: Map<string, number> } | null = null;
function getBuildUniverse(): { cocktails: Cocktail[]; freq: Map<string, number> } {
  if (!buildUniverse) {
    const cocktails = data.cocktails.filter((c) => c.build && c.build.length >= 1);
    const freq = new Map<string, number>();
    for (const c of cocktails) for (const b of c.build!) freq.set(normKey(b), (freq.get(normKey(b)) ?? 0) + 1);
    buildUniverse = { cocktails, freq };
  }
  return buildUniverse;
}

/** A cocktail's quiz-worthy build components, ranked most-tellable (rarest across
 * all builds) first, name-leaks dropped. Always >= 1 (never throws). */
function buildPool(c: Cocktail): string[] {
  const build = c.build ?? [];
  const nameWords = new Set(normWords(c.name));
  const isNameLeak = (b: string): boolean => normWords(b).some((w) => nameWords.has(w));
  const noLeak = build.filter((b) => !isNameLeak(b));
  const pool = noLeak.length ? noLeak : build.slice();
  const { freq } = getBuildUniverse();
  return [...pool].sort((a, b) => (freq.get(normKey(a)) ?? 99) - (freq.get(normKey(b)) ?? 99));
}

/** Distractors for a build MC: build items of OTHER cocktails (never in this
 * build), deduped by normKey, same-flavour-family first, drawn through a
 * round-rotated window so each round shows a different set. */
function pickBuildDistractors(c: Cocktail, answer: string, round: number, n: number): string[] {
  const { cocktails } = getBuildUniverse();
  const mine = new Set((c.build ?? []).map(normKey));
  const seen = new Set<string>([normKey(answer)]);
  const sameCat: string[] = [];
  const crossCat: string[] = [];
  for (const o of cocktails) {
    if (o.id === c.id) continue;
    for (const b of o.build ?? []) {
      const k = normKey(b);
      if (mine.has(k) || seen.has(k)) continue;
      seen.add(k);
      (o.category === c.category ? sameCat : crossCat).push(b);
    }
  }
  const ordered = [
    ...shuffled(sameCat, mulberry32(hashId(`${c.id}:bd`))),
    ...shuffled(crossCat, mulberry32(hashId(`${c.id}:bx`)))
  ];
  return windowed(ordered, round, n);
}

// ---- single-fact MC distractor variety (allergen / wine / pairing) ----------
// These cards have ONE true answer (a flag the dish carries / the wine's grape+
// region / the dish's pour). Unlike a dish component the answer mostly can't
// rotate (allergens are the exception — a dish carries several flags, so we
// rotate WHICH one is asked), but the WRONG options CAN, so no two rounds show
// the same line-up. Same round-windowed pattern as the dish/build pickers; the
// frozen decks still supply the prompt + the one true answer (+ the allergen
// safety teach-back), but the distractors are minted here.

/** Other allergen tokens (the path vocab) NOT carried by this dish — windowed. */
function pickAllergenDistractors(f: Food, answer: string, round: number, n: number): string[] {
  const mine = new Set((f.allergens ?? []).map((a) => a.toLowerCase()));
  const a0 = answer.toLowerCase();
  const pool = getAllergenVocab().filter((a) => !mine.has(a.toLowerCase()) && a.toLowerCase() !== a0);
  return windowed(shuffled(pool, mulberry32(hashId(`${f.id}:ad`))), round, n);
}

/** Every wine's "grape — region" identity string (frozen wine-identity deck) with
 * its family — the distractor pool for wineMcFor. Built once. */
type WineIdentity = { answer: string; family: Wine['family'] };
let wineIdentityPool: WineIdentity[] | null = null;
function getWineIdentityPool(): WineIdentity[] {
  if (!wineIdentityPool) {
    wineIdentityPool = data.wines
      .map((w): WineIdentity | null => {
        const card = wineIdentityCardFor(w.id);
        return card ? { answer: card.answer, family: w.family } : null;
      })
      .filter((x): x is WineIdentity => x !== null);
  }
  return wineIdentityPool;
}

/** Other wines' grape+region — same family first — windowed. */
function pickWineDistractors(w: Wine, answer: string, round: number, n: number): string[] {
  const seen = new Set<string>([answer]);
  const sameFam: string[] = [];
  const crossFam: string[] = [];
  for (const o of getWineIdentityPool()) {
    if (seen.has(o.answer)) continue;
    seen.add(o.answer);
    (o.family === w.family ? sameFam : crossFam).push(o.answer);
  }
  const ordered = [
    ...shuffled(sameFam, mulberry32(hashId(`${w.id}:wd`))),
    ...shuffled(crossFam, mulberry32(hashId(`${w.id}:wx`)))
  ];
  return windowed(ordered, round, n);
}

/** Other dishes' by-the-glass pours — same dish-category first — windowed. */
function pickPairingDistractors(f: Food, answer: string, round: number, n: number): string[] {
  const { dishes } = getReverseUniverse();
  const seen = new Set<string>([answer]);
  const sameCat: string[] = [];
  const crossCat: string[] = [];
  for (const d of dishes) {
    if (d.id === f.id || !d.wine || seen.has(d.wine)) continue;
    seen.add(d.wine);
    (d.category === f.category ? sameCat : crossCat).push(d.wine);
  }
  const ordered = [
    ...shuffled(sameCat, mulberry32(hashId(`${f.id}:pd`))),
    ...shuffled(crossCat, mulberry32(hashId(`${f.id}:px`)))
  ];
  return windowed(ordered, round, n);
}

/** NEW minted runtime content (no frozen ids involved): "Which dish comes with
 * <component>?" — the component is the dish's most DISTINCTIVE official
 * ingredient (carried by the fewest path dishes; ties keep list order; generic
 * tokens like Salt/Olive Oil lose to any real component) that shares NO word
 * with the dish's own name (the engine's genComponents rule — "Hummus Chips"
 * is never the tell for the Hummus Chips). Distractors are same-category
 * dishes where possible (look-alike discrimination), padded cross-category —
 * never a dish that also carries the component, and never a dish whose NAME
 * shares a word with it (the dish "Bigoli" can't be a wrong choice when the
 * component is the ingredient "Bigoli"). */
export function reverseMcFor(item: JourneyItem): ReverseMcContent {
  if (item.kind !== 'dish')
    throw new Error(`journey: reverseMcFor is dish-only — '${item.id}' has no plate to look up`);
  const f = foodFor(item);
  const { dishes, freq } = getReverseUniverse();

  const nonGeneric = f.ingredients!.filter((i) => !GENERIC_COMPONENTS.has(i.toLowerCase()));
  const base = nonGeneric.length > 0 ? nonGeneric : f.ingredients!;
  // Name-leak exclusion BEFORE the rarity scan (mirrors training.js
  // genComponents). Fallback — unused on today's path data — when EVERY
  // ingredient shares a name word: keep the rarest anyway, never throw.
  const nameWords = new Set(normWords(f.name));
  const noLeak = base.filter((i) => !normWords(i).some((w) => nameWords.has(w)));
  const pool = noLeak.length > 0 ? noLeak : base;
  let component = pool[0];
  for (const ing of pool) // strict < keeps the FIRST list entry on ties
    if (freq.get(normKey(ing))! < freq.get(normKey(component))!) component = ing;

  const componentKey = normKey(component);
  const componentWords = new Set(normWords(component));
  const eligible = dishes.filter(
    (d) =>
      d.id !== f.id &&
      !d.ingredients!.some((i) => normKey(i) === componentKey) &&
      !normWords(d.name).some((w) => componentWords.has(w))
  );
  const sameCat = eligible.filter((d) => d.category === f.category);
  const crossCat = eligible.filter((d) => d.category !== f.category);
  const distractors = [...sameCat.slice(0, 3), ...crossCat].slice(0, 3).map((d) => d.name);
  if (distractors.length < 3)
    throw new Error(`journey: not enough reverse-MC distractors for '${item.id}'`); // unreachable on path data
  return {
    ...toMc(`${item.id}:reverse`, `Which dish comes with ${component}?`, [f.name, ...distractors], f.name),
    component
  };
}

// ------------------------------------------------- Test-bar quiz expansion
// (research 2026-06-13: gaps 1/2/4/6 + critique 6 — the question directions
// the documented two-week bar names but nothing drilled.)
import { GLOSSARY, type GlossaryRow } from './glossary';
import { MODS_FOILS, MODS_ROWS, modsRowsFor, type ModsRow } from './allergen-mods';

/** Reveal framing every safety-adjacent minted question carries. */
export interface WhyMcContent extends McContent {
  why: string;
  confirmLine: string;
}

/** The safe-call universe: the 41 path dishes PLUS the off-menu Sorbet — the
 * official dairy-free dessert answer (research gap 3). */
let safeUniverse: Food[] | null = null;
function getSafeUniverse(): Food[] {
  if (!safeUniverse) {
    const pathIds = Object.values(UNIT_FOOD_IDS).flat();
    safeUniverse = [...pathIds.map((id) => foodById.get(id)!)];
    const sorbet = foodById.get('sorbet');
    if (sorbet) safeUniverse.push(sorbet);
  }
  return safeUniverse;
}

/** Dishes that must NEVER be dealt as the 'safe' answer for an allergen the
 * official notes reveal as present-but-unlisted (research gap 1): the ricotta
 * dumpling dough carries eggs AND vodka off the Allergies line; the duck's
 * turnip relish carries miso (soy); the halibut is itself a fish though only
 * 'Crustaceans' prints. */
export const SAFE_CALL_EXCLUSIONS: Record<string, readonly string[]> = {
  eggs: ['ricotta-dumplings'],
  alcohol: ['ricotta-dumplings'],
  soy: ['wood-roasted-half-duck'],
  fish: ['wood-roasted-halibut']
};

/** Seasoning-level allergens the printed lines demonstrably under-report
 * (e.g. the Farm Chicken's roasted-garlic aioli prints no garlic flag) — we
 * never mint a SAFE recommendation on these lines. The dish→flag direction
 * (classic card, sweep) stays: the lines are official; only the inverted
 * safety claim needs the higher bar. */
export const SAFE_CALL_BLOCKED_ALLERGENS: ReadonlySet<string> = new Set(['garlic', 'onion']);

/** Contradiction scan: tokens in a dish's own ingredients/description that
 * reveal an allergen the line may not print. Used to keep a dish out of the
 * SAFE pool (and out of the NOT-a-flag answer slot) for that allergen. */
const ALLERGEN_HINT_WORDS: Record<string, readonly string[]> = {
  alcohol: ['wine', 'vodka', 'armagnac', 'vermouth', 'beer', 'brandy', 'marsala', 'bourbon', 'rum', 'sherry'],
  garlic: ['garlic', 'aioli'],
  onion: ['onion', 'shallot'],
  eggs: ['egg', 'aioli', 'mayo', 'mayonnaise'],
  fish: ['fish', 'anchovy', 'tonnato', 'tuna', 'trout', 'halibut'],
  soy: ['soy', 'miso', 'tamari'],
  shellfish: ['shrimp', 'crab', 'lobster', 'oyster', 'octopus'],
  sesame: ['sesame', 'tahini'],
  pork: ['pork', 'bacon', 'salami', 'nduja', 'tallow', 'guanciale']
};

function mentionsAllergen(f: Food, allergen: string): boolean {
  const hints = ALLERGEN_HINT_WORDS[allergen];
  if (!hints) return false;
  const words = new Set(normWords(`${f.ingredients?.join(' ') ?? ''} ${f.description ?? ''}`));
  return hints.some((h) => words.has(foldPlural(h)));
}

const flagsOf = (f: Food): string[] => f.allergens ?? [];
const carries = (f: Food, allergen: string): boolean => flagsOf(f).includes(allergen);
const safeFor = (f: Food, allergen: string): boolean => {
  if (SAFE_CALL_BLOCKED_ALLERGENS.has(allergen)) return false;
  if (carries(f, allergen)) return false;
  if ((SAFE_CALL_EXCLUSIONS[allergen] ?? []).includes(f.id)) return false;
  if (mentionsAllergen(f, allergen)) return false;
  // The off-menu Sorbet is certified for ONE lane only: dairy-free. Its
  // rotating flavour's other allergens are explicitly unknown (official note).
  if (f.id === 'sorbet' && allergen !== 'dairy') return false;
  return true;
};

/** The allergy INVERSION, anchored on a dish (mock-test wheel slot): the asked
 * dish's first flag becomes the guest's allergy, the dish itself is one of the
 * three carrying distractors ("the plate in front of you is NOT the safe
 * call"), and the answer is a dish genuinely safe for that flag — same-category
 * first, so "can't have dairy, wants dessert" finds the Sorbet. */
function mintSafeCall(anchor: Food, allergen: string): WhyMcContent & { allergen: string } {
  const universe = getSafeUniverse();
  const carriers = universe.filter((d) => d.id !== anchor.id && carries(d, allergen));
  const safes = universe.filter((d) => safeFor(d, allergen));
  if (safes.length === 0 || carriers.length < 2)
    throw new Error(`journey: allergen '${allergen}' cannot mint a safe-call question`);
  // Answer: same-category safe dish first (deterministic — list order), else
  // a stable hash pick across the safe pool.
  const sameCat = safes.filter((d) => d.category === anchor.category);
  const pool = sameCat.length > 0 ? sameCat : safes;
  const answer = pool[hashId(`${anchor.id}:safe:${allergen}`) % pool.length];
  const sameCatCarriers = carriers.filter((d) => d.category === anchor.category);
  const crossCarriers = carriers.filter((d) => d.category !== anchor.category);
  const others = [...sameCatCarriers, ...crossCarriers].slice(0, 2).map((d) => d.name);
  return {
    ...toMc(
      `dish:${anchor.id}:safecall:${allergen}`,
      `A guest can't have ${allergen} — which of these can you recommend?`,
      [answer.name, anchor.name, ...others],
      answer.name
    ),
    allergen,
    // Precise claim: the LINE is the evidence — the confirm rule still rides.
    why: `${answer.name} lists no ${allergen} on its Allergies line — the other three do.`,
    confirmLine: data.confirm.allergens
  };
}

/** The allergen a dish's safe-call would invert: its first NON-BLOCKED flag. */
function safeCallAllergenFor(f: Food): string | undefined {
  return flagsOf(f).find((a) => !SAFE_CALL_BLOCKED_ALLERGENS.has(a));
}

/** True when the dish can mint a safe-call (a non-blocked flag with >=2 other
 * line-carriers and >=1 genuinely safe dish). The mock-test wheel MUST check
 * this (not just hasAllergenMc) or a future seasonal dish could throw at
 * render time. */
export function hasSafeCallMc(item: JourneyItem): boolean {
  if (item.kind !== 'dish') return false;
  const f = foodFor(item);
  const allergen = safeCallAllergenFor(f);
  if (!allergen) return false;
  const universe = getSafeUniverse();
  return (
    universe.filter((d) => d.id !== f.id && carries(d, allergen)).length >= 2 &&
    universe.some((d) => safeFor(d, allergen))
  );
}

export function safeCallMcForDish(item: JourneyItem): WhyMcContent & { allergen: string } {
  if (item.kind !== 'dish')
    throw new Error(`journey: safeCallMcFor is dish-only — '${item.id}' has no flags`);
  const f = foodFor(item);
  const allergen = safeCallAllergenFor(f);
  if (!allergen)
    throw new Error(`journey: '${item.id}' has no safe-call-eligible flag — check hasSafeCallMc`);
  return mintSafeCall(f, allergen);
}

/** The allergen vocabulary across the path (+ sorbet), for NOT-a-flag foils. */
let allergenVocab: string[] | null = null;
function getAllergenVocab(): string[] {
  if (!allergenVocab) {
    const seen = new Set<string>();
    for (const d of getSafeUniverse()) for (const a of flagsOf(d)) seen.add(a);
    allergenVocab = [...seen].sort();
  }
  return allergenVocab;
}

/** Full flag-SET certification (research gap 4): the classic card's answer is
 * always the FIRST flag, so a dish's other flags go untested — this variant
 * asks which of four tokens is NOT on the dish. Dishes need >=3 flags. */
export function hasNotFlagMc(item: JourneyItem): boolean {
  return item.kind === 'dish' && flagsOf(foodFor(item)).length >= 3;
}
export function notFlagMcFor(item: JourneyItem): WhyMcContent {
  if (!hasNotFlagMc(item))
    throw new Error(`journey: notFlagMcFor needs a dish with >=3 flags — '${item.id}'`);
  const f = foodFor(item);
  const flags = flagsOf(f);
  // The NOT answer must hold up: never a token off the printed line that the
  // dish's own ingredients/description contradict (the fennel salami's red
  // wine would refute "alcohol is NOT a flag"), and never one the official
  // note reveals as present-but-unlisted.
  const nonFlags = getAllergenVocab().filter(
    (a) =>
      !flags.includes(a) &&
      !mentionsAllergen(f, a) &&
      !(SAFE_CALL_EXCLUSIONS[a] ?? []).includes(f.id)
  );
  if (nonFlags.length === 0)
    throw new Error(`journey: no defensible NOT-a-flag answer for '${item.id}'`);
  const answer = nonFlags[hashId(`${item.id}:notflag`) % nonFlags.length];
  const reals = flags.slice(0, 3);
  return {
    ...toMc(
      `${item.id}:notflag`,
      `Which of these is NOT a flag on the ${f.name}?`,
      [answer, ...reals],
      answer
    ),
    why: `The ${f.name} carries: ${flags.join(', ')}. ${answer} is not on its line.`,
    confirmLine: data.confirm.allergens
  };
}

/** "Explain it" inverted (critique 6): the official description as the prompt,
 * the dish's own name words stripped so the answer isn't given away. */
export function descriptionMcFor(item: JourneyItem): McContent {
  if (item.kind !== 'dish')
    throw new Error(`journey: descriptionMcFor is dish-only — '${item.id}'`);
  const f = foodFor(item);
  if (!f.description) throw new Error(`journey: '${f.id}' has no official description`);
  // Truncate at a sentence boundary near 220 chars; strip the dish's own name
  // words (case-insensitive, word-level) so the excerpt can't name its answer.
  let excerpt = f.description;
  if (excerpt.length > 220) {
    const cut = excerpt.slice(0, 220);
    const sentence = cut.lastIndexOf('. ');
    if (sentence >= 80) {
      excerpt = cut.slice(0, sentence + 1);
    } else {
      // No usable sentence boundary — cut at the last whole word + ellipsis.
      const space = cut.lastIndexOf(' ');
      excerpt = `${cut.slice(0, space > 0 ? space : cut.length).trimEnd()}…`;
    }
  }
  // Cloze the dish's own name words to a blank ("___") — prose substitution
  // ("this dish") garbles runs like "this duck dish" into "this this dish
  // dish"; a blank reads naturally and runs collapse to one.
  const nameWords = new Set(normWords(f.name));
  excerpt = excerpt
    .split(/\b/)
    .map((w) => (nameWords.has(normWords(w)[0] ?? '') ? '___' : w))
    .join('')
    .replace(/___(\s*[-&]?\s*___)+/g, '___');
  const { dishes } = getReverseUniverse();
  const eligible = dishes.filter((d) => d.id !== f.id);
  const sameCat = eligible.filter((d) => d.category === f.category);
  const crossCat = eligible.filter((d) => d.category !== f.category);
  const distractors = [...sameCat.slice(0, 3), ...crossCat].slice(0, 3).map((d) => d.name);
  return toMc(
    `${item.id}:description`,
    `"${excerpt}" — which dish is this?`,
    [f.name, ...distractors],
    f.name
  );
}

/** "A guest asks: what's <term>?" — definitions the official descriptions give
 * (journey/glossary.ts). Distractors are other glossary definitions. */
export function glossaryMcFor(rowOrTerm: GlossaryRow | string): WhyMcContent & { term: string } {
  const glossRow =
    typeof rowOrTerm === 'string' ? GLOSSARY.find((g) => g.term === rowOrTerm) : rowOrTerm;
  if (!glossRow) throw new Error(`journey: no glossary row for '${String(rowOrTerm)}'`);
  const foils = shuffled(
    GLOSSARY.filter((g) => g.term !== glossRow.term),
    mulberry32(hashId(`gloss:${glossRow.term}`))
  )
    .slice(0, 3)
    .map((g) => g.definition);
  return {
    ...toMc(
      `gloss:${glossRow.term}`,
      `A guest asks: what's ${glossRow.term}?`,
      [glossRow.definition, ...foils],
      glossRow.definition
    ),
    term: glossRow.term,
    why: `It's in: ${glossRow.dishes.map((id) => foodById.get(id)?.name ?? id).join(', ')}.`,
    confirmLine: data.confirm.allergens
  };
}

/** "Guest wants the <dish> but can't have <allergen> — what's the call?" —
 * authored 1:1 from the official allergenNote (journey/allergen-mods.ts). */
export function hasModsMc(item: JourneyItem): boolean {
  return item.kind === 'dish' && modsRowsFor(foodFor(item).id).length > 0;
}
export function modsMcFor(itemOrRow: JourneyItem | ModsRow): WhyMcContent & { allergen: string } {
  const modsRow: ModsRow | undefined =
    'foodId' in itemOrRow && 'call' in itemOrRow
      ? (itemOrRow as ModsRow)
      : (() => {
          const item = itemOrRow as JourneyItem;
          const rows = modsRowsFor(foodFor(item).id);
          if (rows.length === 0)
            throw new Error(`journey: '${item.id}' has no authored mods row — check hasModsMc`);
          return rows[hashId(`${item.id}:mods`) % rows.length];
        })();
  if (!modsRow) throw new Error('journey: modsMcFor needs a mods row');
  const f = foodById.get(modsRow.foodId);
  if (!f) throw new Error(`journey: mods row foodId '${modsRow.foodId}' missing`);
  const foils = (Object.keys(MODS_FOILS) as (keyof typeof MODS_FOILS)[])
    .filter((call) => call !== modsRow.call)
    .map((call) => MODS_FOILS[call])
    .slice(0, 3);
  return {
    ...toMc(
      `mods:${modsRow.foodId}:${modsRow.allergen}`,
      `A guest wants the ${f.name} but can't have ${modsRow.allergen} — what's the call?`,
      [modsRow.answer, ...foils],
      modsRow.answer
    ),
    allergen: modsRow.allergen,
    why: `Official note: ${modsRow.note}`,
    confirmLine: data.confirm.allergens
  };
}

/** Every question the score-only "judgment round" deals (allergens round 2):
 * one safe-call per path-relevant allergen + every authored mods row + every
 * glossary term. Pre-minted, deterministic. */
export function judgmentQuestions(): (WhyMcContent & { id: string })[] {
  const out: (WhyMcContent & { id: string })[] = [];
  // Safe calls per allergen: anchored on the first path dish carrying the
  // flag so the question set is stable.
  const seen = new Set<string>();
  for (const item of allStage1Items()) {
    if (item.kind !== 'dish') continue;
    for (const allergen of flagsOf(foodFor(item))) {
      if (seen.has(allergen)) continue;
      seen.add(allergen);
      const universe = getSafeUniverse();
      const anchor = universe.find((d) => carries(d, allergen))!;
      const safes = universe.filter((d) => safeFor(d, allergen));
      const carriers = universe.filter((d) => d.id !== anchor.id && carries(d, allergen));
      if (safes.length === 0 || carriers.length < 2) continue;
      out.push({ ...mintSafeCall(anchor, allergen), id: `judg:safe:${allergen}` });
    }
  }
  for (const modsRow of MODS_ROWS) out.push({ ...modsMcFor(modsRow), id: `judg:mods:${modsRow.foodId}:${modsRow.allergen}` });
  for (const g of GLOSSARY) out.push({ ...glossaryMcFor(g), id: `judg:gloss:${g.term}` });
  return out;
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

/** The cocktail (Stage 3) reveal framing — flags only when present, always the
 * bar-confirm line. Mixed into cued/free build content for FlashReveal. */
function barFraming(c: Cocktail): AllergenFraming {
  return {
    ...(c.allergens && c.allergens.length ? { allergens: c.allergens } : {}),
    ...(c.allergenNote ? { allergenNote: c.allergenNote } : {}),
    confirmLine: BAR_CONFIRM
  };
}

export function cuedFor(item: JourneyItem): CuedContent {
  if (item.kind === 'service') {
    const s = serviceFor(item);
    return { prompt: s.prompt, hint: s.hint, answer: s.answer };
  }
  // Build items (Stage 3): cued BUILD recall — name the build with part-count +
  // first letters. Must come before foodFor (a build item carries no foodId).
  if (item.kind === 'build') {
    const c = cocktailFor(item);
    const build = c.build!;
    const letters = build.map((b) => b[0].toUpperCase()).join(' · ');
    return {
      prompt: `Name the build of the ${c.name}.`,
      hint: `${build.length} part${build.length === 1 ? '' : 's'} — ${letters}`,
      answer: build.join(', '),
      ...barFraming(c)
    };
  }
  // Wine items (Stage 4): cued IDENTITY recall — grape, place, the one-line read.
  if (item.kind === 'wine') {
    const w = wineFor(item);
    const region = w.region.split(',')[0];
    // Enumerate every grape's initial (blends store composites like
    // "Chardonnay & Pinot Noir") — one letter of the whole string would tell on
    // only the first grape. Mirrors the dish/build first-letter hint.
    const grapeInitials = w.grape.split(/[^\p{L}]+/u).filter(Boolean).map((g) => g[0].toUpperCase()).join('·');
    return {
      prompt: `The ${w.name}: grape, place, and the one-line read.`,
      hint: `${grapeInitials} from ${region} · ${w.family.toLowerCase()}`,
      answer: `${w.grape} — ${w.region}. ${w.tenSecond}`
    };
  }
  const f = foodFor(item);
  // Pairing items (Stage 5): cued POUR recall — the pour + the lever that works.
  if (item.kind === 'pairing') {
    const lever = leverOf(f);
    const pourInitial = (f.wine ?? '').split(/\s+/)[0]?.[0] ?? '';
    return {
      prompt: `A guest orders the ${f.name}. What's the by-the-glass pour, and which lever makes it work?`,
      hint: `the pour starts "${pourInitial}…" · then name the lever`,
      answer: lever ? `${f.wine} — ${lever.label}. ${lever.script}` : `${f.wine}. ${f.why ?? ''}`,
      ...photoOf(f)
    };
  }
  // Allergen items (Stage 2): cued FLAG recall, not component recall.
  if (item.kind === 'allergen') {
    const flags = f.allergens ?? [];
    const letters = flags.map((a) => a[0].toUpperCase()).join(' · ');
    return {
      prompt: `Which allergens does the ${f.name} carry?`,
      hint: `${flags.length} flag${flags.length === 1 ? '' : 's'} — ${letters}`,
      answer: flags.join(', '),
      ...photoOf(f),
      ...allergenFraming(f)
    };
  }
  const ingredients = f.ingredients!;
  const letters = ingredients.map((i) => i[0].toUpperCase()).join(' · ');
  return {
    prompt: `What's in the ${f.name}?`,
    hint: `${ingredients.length} components — ${letters}`,
    answer: ingredients.join(', '),
    ...photoOf(f),
    romance: ROMANCE[f.id],
    ...allergenFraming(f)
  };
}

export function freeFor(item: JourneyItem): FreeContent {
  if (item.kind === 'service') {
    const s = serviceFor(item);
    return { prompt: s.prompt, answer: s.answer };
  }
  // Build items (Stage 3): free MAKE-IT recall — build it from memory, cold, with
  // the measured spec, then the method and garnish. The measured spec (falling back
  // to the plain build when a drink is keg/batch-poured) is the answer; the mechanics
  // ride in the detail. This is the make-the-drink target the bar checkpoint gates on.
  if (item.kind === 'build') {
    const c = cocktailFor(item);
    const spec = c.spec && c.spec.length ? c.spec : c.build!;
    const serve = [c.glass, c.ice && (/^up$/i.test(c.ice) ? 'up' : c.ice)].filter(Boolean).join(', ');
    const mechanics = [c.method, serve, c.garnish ? `garnish: ${c.garnish}` : ''].filter(Boolean).join(' · ');
    return {
      prompt: `Make the ${c.name} from memory — the build, then method and garnish.`,
      answer: spec.join(' · '),
      ...(mechanics ? { detail: mechanics } : {}),
      ...barFraming(c)
    };
  }
  // Wine items (Stage 4): free recall — the FULL identity cold (grape, region,
  // AND the ten-second pitch). Same target as the cued rung but with no hint, so
  // the cold rung is never easier than the cued one — and the wine checkpoint
  // (which serves the free rung) gates on the stage's headline skill: identity.
  if (item.kind === 'wine') {
    const w = wineFor(item);
    return {
      prompt: `Cold — the ${w.name}: grape, region, and the ten-second pitch.`,
      answer: `${w.grape} — ${w.region}. ${w.tenSecond}`,
      ...(w.say ? { detail: w.say } : {})
    };
  }
  const f = foodFor(item);
  // Pairing items (Stage 5): free POUR recall — call it cold + say why; the
  // detail carries the non-drinker cocktail call.
  if (item.kind === 'pairing') {
    return {
      prompt: `The ${f.name} just landed — call the pour and say why, out loud.`,
      answer: `${f.wine}. ${f.why ?? leverOf(f)?.script ?? ''}`,
      ...photoOf(f),
      ...(f.cocktail
        ? { detail: `Not drinking? ${f.cocktail}.${f.zero ? ` Zero-proof: ${f.zero}.` : ''}` }
        : {})
    };
  }
  // Allergen items (Stage 2): free FLAG recall — name every flag, cold.
  if (item.kind === 'allergen') {
    const flags = f.allergens ?? [];
    return {
      prompt: `Name every allergen flag on the ${f.name}.`,
      answer: flags.join(', '),
      ...photoOf(f),
      ...(f.allergenNote ? { detail: f.allergenNote } : {}),
      ...allergenFraming(f)
    };
  }
  return {
    prompt: `Describe the ${f.name} to a guest — name + key components.`,
    answer: f.ingredients!.join(', '),
    ...photoOf(f),
    romance: ROMANCE[f.id],
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
  /** The authored guest-facing romance — the say-it-like-this recital the runner
   * recites (the dish name + >=3 real components in warm, sayable language). */
  romance: string;
  /** The official menu description — secondary reference under the romance. */
  modelLine: string;
  /** Full official ingredients, syllabus order. */
  ingredients: string[];
  /** The dish photo id (= the food id) — anchors the plate on the reveal, the
   * SAME id the teach card gates on (§0b dual coding). Only ids in PHOTO_IDS
   * actually render an image; the rest keep the branded placeholder. */
  photoId: string;
  /** Optional memory hook (§0b) — a vivid name→components mnemonic, when authored. */
  memoryHook?: string;
}

export function romanceFor(item: JourneyItem): RomanceContent {
  if (item.kind !== 'dish')
    throw new Error(`journey: romanceFor is dish-only — '${item.id}' has no plate to romance`);
  const f = foodFor(item);
  // Same hard-fail philosophy as the module-init guard: never hand the drill
  // an empty model line silently (every official path dish has a description).
  if (!f.description)
    throw new Error(`journey: food '${f.id}' has no official description for the romance line`);
  const romance = ROMANCE[f.id];
  if (!romance) throw new Error(`journey: food '${f.id}' has no authored romance line`);
  return {
    name: f.name,
    category: f.category,
    price: f.price,
    romanceTargets: f.ingredients!.slice(0, 3),
    romance,
    modelLine: f.description,
    ingredients: f.ingredients!.slice(),
    photoId: f.id,
    ...(f.memoryHook ? { memoryHook: f.memoryHook } : {}),
    ...allergenFraming(f)
  };
}

export interface RomanceGuideEntry {
  id: string;
  name: string;
  category: string;
  photoId: string;
  romance: string;
}
export interface RomanceGuideGroup {
  category: string;
  dishes: RomanceGuideEntry[];
}
/** Every dish with an authored romance line, grouped by menu category in data
 * order — the read-through study guide (/romance/guide). Includes any off-path
 * dish that carries a line (e.g. sorbet). Pure: no store, no SRS. */
export function romanceGuide(): RomanceGuideGroup[] {
  const groups: RomanceGuideGroup[] = [];
  for (const f of data.foods) {
    const romance = ROMANCE[f.id];
    if (!romance) continue;
    let g = groups.find((x) => x.category === f.category);
    if (!g) {
      g = { category: f.category, dishes: [] };
      groups.push(g);
    }
    g.dishes.push({ id: f.id, name: f.name, category: f.category, photoId: f.id, romance });
  }
  return groups;
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
  // Build items (Stage 3): the cocktail teach surface. Before foodFor (no foodId).
  if (item.kind === 'build') {
    const c = cocktailFor(item);
    return {
      kind: 'build',
      name: c.name,
      price: c.price,
      category: c.category,
      ...(c.section ? { section: c.section } : {}),
      ...(c.description ? { description: c.description } : {}),
      build: c.build!.slice(),
      ...(c.spec && c.spec.length ? { spec: c.spec.slice() } : {}),
      ...(c.method ? { method: c.method } : {}),
      ...(c.glass ? { glass: c.glass } : {}),
      ...(c.ice ? { ice: c.ice } : {}),
      ...(c.garnish ? { garnish: c.garnish } : {}),
      flavorTags: c.flavorTags ?? [],
      pair: c.pair,
      say: c.say,
      allergens: c.allergens ?? [],
      ...(c.allergenNote ? { allergenNote: c.allergenNote } : {}),
      confirmLine: BAR_CONFIRM
    };
  }
  // Wine items (Stage 4): the by-the-glass pour teach surface.
  if (item.kind === 'wine') {
    const w = wineFor(item);
    return {
      kind: 'wine',
      name: w.name,
      price: w.price,
      grape: w.grape,
      region: w.region,
      country: w.country,
      family: w.family,
      climate: w.climate,
      structure: {
        acidity: w.structure.acidity,
        body: w.structure.body,
        tannin: w.structure.tannin,
        sweetness: w.structure.sweetness
      },
      respell: w.pronunciation.respell,
      say: w.pronunciation.say,
      audioId: w.id,
      tenSecond: w.tenSecond,
      profile: w.profile,
      pair: w.pair ?? [],
      ...(w.mnemonic ? { mnemonic: w.mnemonic } : {})
    };
  }
  const f = foodFor(item);
  // Pairing items (Stage 5): the dish→pour teach surface.
  if (item.kind === 'pairing') {
    const lever = leverOf(f);
    return {
      kind: 'pairing',
      name: f.name,
      category: f.category,
      wine: f.wine ?? '',
      ...(lever ? { leverLabel: lever.label, leverScript: lever.script } : {}),
      why: f.why ?? '',
      ...(f.cocktail ? { cocktail: f.cocktail } : {}),
      ...(f.zero ? { zero: f.zero } : {})
    };
  }
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
    confirmLine: data.confirm.allergens,
    ...(f.memoryHook ? { memoryHook: f.memoryHook } : {}),
    ...(ROMANCE[f.id] ? { romance: ROMANCE[f.id] } : {})
  };
}
