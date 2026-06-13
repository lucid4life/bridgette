// House notes — the kitchen-concept facts the Onboarding/Food Syllabus states
// up front (research gap 7). Verbatim-sourced from the syllabus conceptNotes;
// surfaced read-only on the Playbook (no drill — Phase 2 may promote them).
export interface HouseNote {
  title: string;
  body: string;
}

export const HOUSE_NOTES: readonly HouseNote[] = [
  {
    title: 'chef-driven seasonal',
    body: "The menu changes seasonally with ingredients and Chef JP's inspiration — except some signature dishes that are mainstays."
  },
  {
    title: 'family style',
    body: 'The menu is intended to be served family style, with shared plates of various sizes.'
  },
  {
    title: 'the wood-fired grill',
    body: 'The focal point of the kitchen. Applewood fuels it — a very hard wood with a long burning life that imparts a relatively mild, pleasant flavour.'
  },
  {
    title: 'made in house',
    body: 'All ingredients on the menu that are not whole-food products are made in house.'
  },
  {
    title: 'the pizza dough',
    body: 'Rested for at least 5 days to develop flavour and a soft, chewy texture.'
  },
  {
    title: 'the pasta',
    body: 'All pastas are made from scratch in house.'
  }
];
