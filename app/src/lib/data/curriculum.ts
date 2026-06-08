// app/src/lib/data/curriculum.ts — 10-module mastery-gated course definition.
// Each module has a stable kebab id, a display order (num 1..10), a track,
// and optional links to a lesson entry (lessonId) and a Practice deck (seedDeck).
// The state layer (course.svelte.ts) enforces sequential unlock; the UI may
// separately allow a "jump ahead" override while still surfacing this signal.

export type CourseTrack = 'Foundations' | 'Know the list' | 'Floor moves' | 'On the floor';
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
  }
];
