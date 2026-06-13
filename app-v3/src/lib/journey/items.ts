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

/** True when the dish has a frozen allergens card to quiz from (a dish with no
 * flags mints none — callers skip those; today every path dish has one). */
export function hasAllergenMc(item: JourneyItem): boolean {
  return item.kind === 'dish' && !!allergenCardFor(foodFor(item).id);
}

export function allergenMcFor(item: JourneyItem): AllergenMcContent {
  if (item.kind !== 'dish')
    throw new Error(`journey: allergenMcFor is dish-only — '${item.id}' carries no flags`);
  const f = foodFor(item);
  const card = allergenCardFor(f.id);
  if (!card)
    throw new Error(
      `journey: '${item.id}' has no allergens engine card (no flags) — check hasAllergenMc first`
    );
  if (!card.why || !card.why.endsWith(ENGINE_KITCHEN_CONFIRM))
    throw new Error(`journey: allergens card '${card.id}' lost its confirm tail — deck shape drifted`);
  const why = card.why.slice(0, card.why.length - ENGINE_KITCHEN_CONFIRM.length).trim();
  return {
    ...toMc(`${item.id}:allergen`, card.prompt, card.choices!, card.answer),
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
