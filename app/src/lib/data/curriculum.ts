// app/src/lib/data/curriculum.ts — mastery-gated course definition.
// Each module has a stable kebab id, a display order (num), a track,
// and optional links to a lesson entry (lessonId) and a Practice deck (seedDeck).
// The state layer (course.svelte.ts) enforces sequential unlock; the UI may
// separately allow a "jump ahead" override while still surfacing this signal.
//
// Modules 1–10 are the original wine course — their ids and nums are FROZEN
// (persisted progress in bb_course_v1 is keyed by module id, and the unlock
// chain is keyed by num order, so existing state must never shift).
// The 'Food runner — first shifts' track (nums 11–12) is appended AFTER the
// wine chain so it never re-gates a wine module; it carries alwaysUnlocked
// so the UI surfaces it immediately, and the Learn page displays it first.

export type CourseTrack =
  | 'Food runner — first shifts'
  | 'Foundations'
  | 'Know the list'
  | 'Floor moves'
  | 'On the floor';
export type ModuleContent = 'families' | 'whites' | 'reds' | 'cocktails';

export interface CourseModule {
  id: string;          // stable module id (kebab)
  num: number;         // 1..10, display order
  track: CourseTrack;
  title: string;
  blurb: string;       // one-line "why this matters on the floor"
  lessonId?: string;   // links to a data.lessons entry for read + quick-check content
  content?: ModuleContent; // data-driven module kind (no lessonId)
  seedDeck?: string;   // the Practice deck id this module introduces (for a "drill it now" link)
  alwaysUnlocked?: boolean; // UI treats as unlocked regardless of the sequential chain
}

export const curriculum: CourseModule[] = [
  {
    id: 'how-wine-works',
    num: 1,
    track: 'Foundations',
    title: 'How wine works',
    blurb: 'The four levers you taste in every glass: acidity, tannin, body, sweetness.',
    lessonId: 'structure-words',
    seedDeck: 'structure'
  },
  {
    id: 'how-to-taste',
    num: 2,
    track: 'Foundations',
    title: 'How to taste a wine',
    blurb: 'Look, smell, taste, conclude — turn a sip into one usable sentence.',
    lessonId: 'how-to-taste',
    seedDeck: 'mystery'
  },
  {
    id: 'the-5-families',
    num: 3,
    track: 'Foundations',
    title: 'The 5 families',
    blurb: 'Five buckets to steer by, so any wine has a shape before you know its name.',
    content: 'families',
    seedDeck: 'wine-identity'
  },
  {
    id: 'whites-and-bubbles',
    num: 4,
    track: 'Know the list',
    title: 'Whites & bubbles by the glass',
    blurb: 'The crisp, round, and sparkling pours — what they are and when to reach for them.',
    content: 'whites',
    seedDeck: 'wine-identity'
  },
  {
    id: 'reds-and-rose',
    num: 5,
    track: 'Know the list',
    title: 'Reds & rosé by the glass',
    blurb: 'The light and structured reds plus rosé — body, tannin, and the table they fit.',
    content: 'reds',
    seedDeck: 'wine-identity'
  },
  {
    id: 'food-wine-pairing',
    num: 6,
    track: 'Floor moves',
    title: 'Food & wine pairing',
    blurb: 'The six levers — acid cuts fat, tannin needs protein, sweet tames heat — both directions.',
    lessonId: 'pairing-levers',
    seedDeck: 'pairing'
  },
  {
    id: 'food-cocktails',
    num: 7,
    track: 'Floor moves',
    title: 'Food, cocktails & zero-proof',
    blurb: 'When the guest is not drinking wine — the same levers, a different glass.',
    content: 'cocktails',
    seedDeck: 'cocktail-pairing'
  },
  {
    id: 'substitution-translator',
    num: 8,
    track: 'Floor moves',
    title: 'The substitution translator',
    blurb: "A guest wants a grape we don't pour — your pour, matched by structure, and the why.",
    lessonId: 'common-substitutions',
    seedDeck: 'translator'
  },
  {
    id: 'talking-to-a-guest',
    num: 9,
    track: 'On the floor',
    title: 'Making the recommendation & upselling',
    blurb: 'Sound confident, give one reason, and move a glass to a bottle.',
    lessonId: 'talking-to-a-guest',
    seedDeck: 'upsell'
  },
  {
    id: 'pronunciation',
    num: 10,
    track: 'On the floor',
    title: 'Pronunciation mastery',
    blurb: "Say the hard names with confidence — Weissburgunder, Hiedler Löss, Ca' del Baio.",
    lessonId: 'pronunciation-primer',
    seedDeck: 'pronunciation'
  },
  // ── Food runner — first shifts (appended after the wine chain; see header) ──
  {
    id: 'know-the-dish',
    num: 11,
    track: 'Food runner — first shifts',
    title: 'Know the dish: components & allergens',
    blurb: 'Three components per plate, cold — and allergen flags you name first, then verify with the kitchen.',
    lessonId: 'know-the-dish',
    seedDeck: 'components',
    alwaysUnlocked: true
  },
  {
    id: 'running-food',
    num: 12,
    track: 'Food runner — first shifts',
    title: 'Running food: seats, no auctions, romance',
    blurb: "Seat numbers do the talking — seat 1 to your left, shared plates to the middle, never 'who had the chicken?'.",
    lessonId: 'running-food',
    seedDeck: 'allergens',
    alwaysUnlocked: true
  }
];
