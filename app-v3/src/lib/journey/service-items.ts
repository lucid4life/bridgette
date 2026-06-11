// Task D — Unit 0 "Day one" authored items (service:* namespace, NEW in v3).
// Every fact below is sourced from the two official internal documents via the
// verified extracts (docs/handoffs/2026-06-10-service-extract.md §2-3 and
// 2026-06-10-onboarding-deep-extract.md table-map section) — nothing invented.
// 'why' cites the source rule; distractors are plausible-but-wrong (real OTHER
// table ranges, mirrored directions, "polite" anti-patterns the guides forbid).

export interface ServiceItem {
  id: string;
  /** short display title for the teach screen */
  title: string;
  prompt: string;
  answer: string;
  /** the answer + 3 plausible distractors (presentation order is derived, not stored) */
  choices: string[];
  hint: string;
  /** cites the source rule */
  why: string;
}

export const SERVICE_ITEMS: ServiceItem[] = [
  {
    id: 'service:seat-1-left',
    title: 'Seat 1: your left',
    prompt: 'You approach a table. Where is seat 1, and which way do the seats run?',
    answer: 'Seat 1 is to your left as you approach, and the seats go clockwise',
    choices: [
      'Seat 1 is to your left as you approach, and the seats go clockwise',
      'Seat 1 is to your right as you approach, and the seats go counter-clockwise',
      'Seat 1 is closest to the kitchen, and the seats go clockwise',
      'Seat 1 faces the front door, and the seats go counter-clockwise'
    ],
    hint: 'your left hand as you walk up — then around like a clock',
    why: "Service Guide: 'Seat 1 will always be to your left as you approach a table and the seats will go clockwise.'"
  },
  {
    id: 'service:seat-1-middle',
    title: 'Seat 1: middle of the room',
    prompt: 'For tables in the middle of the dining room, how do you find seat 1?',
    answer: 'Approach so seat 1 is on the left, with its back to the kitchen',
    choices: [
      'Approach so seat 1 is on the left, with its back to the kitchen',
      'Approach so seat 1 is on the left, facing the kitchen',
      'Seat 1 is whichever seat is nearest the front door',
      'Seat 1 is wherever the first guest sat down'
    ],
    hint: 'left side — back to the kitchen',
    why: "Service Guide: 'For tables in the middle of the dining room, we will approach seat 1 on the left with its back to the kitchen.'"
  },
  {
    id: 'service:seat-1-banquette',
    title: 'Seat 1: the banquette',
    prompt: 'A table has a banquette on one side and chairs on the other. Where is seat 1?',
    answer: 'On the banquette — always',
    choices: [
      'On the banquette — always',
      'On the chair side, facing the banquette',
      'On whichever side is closest as you approach',
      'On the chair nearest the service station'
    ],
    hint: 'the bench always wins',
    why: "Service Guide: 'Seat 1 will always be on the banquette.'"
  },
  {
    id: 'service:seat-0-shared',
    title: 'Seat 0: shared dishes',
    prompt: 'The table orders dishes for everyone to share. What seat do shared dishes ring under?',
    answer: 'Seat 0 — shared dishes always ring under seat 0',
    choices: [
      'Seat 0 — shared dishes always ring under seat 0',
      'Seat 1 — the first seat covers the table',
      'The seat of whoever ordered the dish',
      'The highest seat number at the table'
    ],
    hint: 'the seat nobody sits in',
    why: "Service Guide: 'Shared dishes are rung under seat 0' — accurate seat numbers are used for both food and drinks."
  },
  {
    id: 'service:tables-bar-top',
    title: 'Bar top: 101-108',
    prompt: 'Which table numbers are the bar top?',
    answer: '101-108',
    choices: ['101-108', '121-126', '131-135', '201-212'],
    hint: 'the very first 100s, right along the bar — 101 nearest the front',
    why: 'Onboarding Package table map: bar top = 101-108 (101 nearest the front door).'
  },
  {
    id: 'service:tables-bar-tables',
    title: 'Bar tables: 121-126',
    prompt: 'Which table numbers are the bar tables?',
    answer: '121-126',
    choices: ['121-126', '101-108', '321-326', '141-144'],
    hint: 'still 100s — the 120s, across from the bar',
    why: 'Onboarding Package table map: bar tables = 121-126.'
  },
  {
    id: 'service:tables-loft',
    title: 'Loft: 131-135',
    prompt: 'Which table numbers are the loft, by the front door?',
    answer: '131-135',
    choices: ['131-135', '141-144', '121-126', '301-309'],
    hint: 'the 130s — first tables past the front door',
    why: 'Onboarding Package table map: loft = 131-135, near the front door.'
  },
  {
    id: 'service:tables-east',
    title: 'East: 201-212 + 221',
    prompt: 'Which table numbers make up the east section?',
    answer: '201-212, plus the 221 high top',
    choices: [
      '201-212, plus the 221 high top',
      '201-226, straight through',
      '301-309, plus the 311 high top',
      '201-208, plus the 211 high top'
    ],
    hint: 'twelve 200s and one high top',
    why: 'Onboarding Package table map: east = 201-212 plus the 221 high top.'
  },
  {
    id: 'service:tables-west',
    title: 'West: the 300s',
    prompt: 'Which table numbers make up the west section?',
    answer: '301-309, 311-316 and 321-326',
    choices: [
      '301-309, 311-316 and 321-326',
      '301-326, straight through',
      '301-309 only',
      '201-212 and 221'
    ],
    hint: 'three runs of 300s — no 310, no 320',
    why: 'Onboarding Package table map: west = 301-309, 311-316, 321-326.'
  },
  {
    id: 'service:tables-pdr-patio',
    title: 'PDR 401 · patio 141-144',
    prompt: 'What are table 401 and tables 141-144?',
    answer: '401 is the private dining room; 141-144 are the patio',
    choices: [
      '401 is the private dining room; 141-144 are the patio',
      '401 is the patio; 141-144 are the private dining room',
      '401 is the chef’s counter; 141-144 are bar tables',
      '401 is the loft; 141-144 are the east high tops'
    ],
    hint: 'one big private room, four tables outside',
    why: 'Onboarding Package table map: 401 = PDR (private dining room), 141-144 = patio.'
  },
  {
    id: 'service:no-auction',
    title: 'Never auction',
    prompt: 'You arrive with three plates and are not sure whose is whose. What is the rule?',
    answer: 'Deliver by seat number — never auction off the food',
    choices: [
      'Deliver by seat number — never auction off the food',
      'Auction politely — ask who ordered each dish when unsure',
      'Set everything in the middle and let the guests sort it out',
      'Hand each plate to whoever looks up first'
    ],
    hint: 'the chit already knows whose plate it is',
    why: "Service Guide: 'Deliver the food to the table making use of the seat numbers. Never auction off the food to the guests.'"
  },
  {
    id: 'service:romance-formula',
    title: 'Romance the dish',
    prompt: 'How do you introduce a dish as you set it down?',
    answer: 'Say the name of the dish plus 3 components important to it',
    choices: [
      'Say the name of the dish plus 3 components important to it',
      'Just the dish name — keep it quick and quiet',
      'List every ingredient on the plate, start to finish',
      'Say the dish name and its price'
    ],
    hint: '“This is our grilled octopus salad with fennel and orange in a sherry soy vinaigrette.”',
    why: "Service Guide: 'introduce the name of the item and 3 components important to the dish' — worked example: 'This is our grilled octopus salad with fennel and orange in a sherry soy vinaigrette.'"
  },
  {
    id: 'service:fifo-drinks',
    title: 'Drinks: first in, first out',
    prompt: 'Drinks are up at the service bar. Which go out first, and what is the time limit?',
    answer: 'First made, first delivered — any table; anything sitting over a minute, anyone runs it',
    choices: [
      'First made, first delivered — any table; anything sitting over a minute, anyone runs it',
      'Your own section’s drinks first, then help the others',
      'Cocktails first, then wine, then beer',
      'Whichever table has been waiting longest for food'
    ],
    hint: 'first in, first out — and one minute is the limit',
    why: "Service Guide: 'The first drinks made are the first ones delivered regardless of if they belong to your table' + 'If you see any drinks sitting more than one minute, please take the initiative to deliver them.'"
  },
  {
    id: 'service:priority-one',
    title: 'Priority #1: running',
    prompt: 'During service, what is always priority #1 — and what comes second?',
    answer: 'Food and beverage running is #1 — hot food goes out hot; clearing and resetting is #2',
    choices: [
      'Food and beverage running is #1 — hot food goes out hot; clearing and resetting is #2',
      'Clearing and resetting is #1 — running food is #2',
      'Greeting new guests is #1 — running food is #2',
      'Polishing and restocking is #1 — running food is #2'
    ],
    hint: 'hot food hot, fresh cocktails fresh',
    why: "Service Guide: 'Food and beverage running is always #1 priority! Hot food needs to go out hot!' — priority #2 is clearing tables and resetting the dining room."
  },
  {
    id: 'service:allergy-every-item',
    title: 'Allergy on every item',
    prompt: 'A guest at seat 3 has a nut allergy. Where does the allergy get noted?',
    answer: 'On every item seat 3 orders, plus all shared seat 0 items',
    choices: [
      'On every item seat 3 orders, plus all shared seat 0 items',
      'Once, on the first item — the kitchen reads the whole chit',
      'Only on the dishes that usually contain nuts',
      'On the bill, as a note for the server'
    ],
    hint: 'every station prints its own ticket',
    why: "Service Guide: the allergy must be noted on EVERY item that seat orders — items print at different kitchen stations — 'and enter in the allergy notification on all shared seat 0 items as well.'"
  },
  {
    id: 'service:open-hand',
    title: 'Open hand, excuse the reach',
    prompt: 'What is the etiquette for pointing things out and reaching in at a table?',
    answer: 'Use an open hand, never point; excuse yourself when reaching in — never reach across a guest',
    choices: [
      'Use an open hand, never point; excuse yourself when reaching in — never reach across a guest',
      'Point clearly so guests can follow your directions',
      'Reach across quietly so you don’t interrupt the conversation',
      'Always serve from the left and clear from the right'
    ],
    hint: 'open palm — “excuse my reach”',
    why: "Service Guide: 'Excuse yourself when reaching in front of someone to drop off an item at the table. Never reach across the guest' — and avoid pointing: give directions with an open hand."
  }
];
