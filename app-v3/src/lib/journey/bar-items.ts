// Stage 3 — "Running drinks" (bar-arc) authored items (service:bar-* namespace,
// NEW in v3 for Behind the Bar). Every fact below is sourced from the official
// internal documents via the verified extracts (docs/handoffs/2026-06-10-
// service-extract.md §4/§9 and 2026-06-10-onboarding-deep-extract.md §1-3/§7) —
// nothing invented. These are the DRINK-specific service ritual + daypart/policy
// facts; the running basics (FIFO, priority #1) already live in day-one's
// SERVICE_ITEMS, so they are deliberately NOT repeated here.
//
// Same ServiceItem shape as day-one: choices[0] is the answer (presentation order
// is derived by the id-hash shuffle in items.ts), 'why' cites the source rule,
// distractors are plausible-but-wrong (mirrored handling, "polite" anti-patterns
// the guides forbid). These items grade through the existing service accessors.
import type { ServiceItem } from './service-items';

export const BAR_SERVICE_ITEMS: ServiceItem[] = [
  {
    id: 'service:bar-tray',
    title: 'Run drinks on a tray',
    prompt: 'How are drinks carried to the table?',
    answer: 'On a tray — always',
    choices: [
      'On a tray — always',
      'In hand, two or three glasses at a time',
      'On a tray only for three or more drinks',
      'However is quickest while they are still cold'
    ],
    hint: 'the tray is not optional',
    why: "Service Guide: 'A tray is used to run drinks.'"
  },
  {
    id: 'service:bar-garnish-right',
    title: 'Down on the right, garnish right',
    prompt: 'You set a cocktail down at the correct seat. Which side, and which way does the garnish face?',
    answer: "On the guest's right, garnish facing right, as non-invasively as possible",
    choices: [
      "On the guest's right, garnish facing right, as non-invasively as possible",
      "On the guest's left, garnish facing the guest",
      'Directly in front of the guest, garnish facing in',
      "On the guest's right, garnish facing the centre of the table"
    ],
    hint: 'right side, garnish to the right',
    why: "Service Guide: 'Place the drink down on the guest's right, with the garnish also facing to the right, as non-invasively as possible.'"
  },
  {
    id: 'service:bar-romance-drink',
    title: 'Romance the drink at the seat',
    prompt: 'What do you say as you place a cocktail, wine, or beer at the table?',
    answer: 'Say the name of the drink aloud as you set it at the proper seat number',
    choices: [
      'Say the name of the drink aloud as you set it at the proper seat number',
      'Nothing — let the menu speak for itself',
      'Ask the table whose drink it is',
      'List every ingredient in the build'
    ],
    hint: 'name it out loud, at the right seat',
    why: "Service Guide: 'say the name of the cocktail/wine/beer aloud when placing it at the proper seat number.'"
  },
  {
    id: 'service:bar-glass-handling',
    title: 'Bottom and stem only',
    prompt: 'Where do you hold glassware when delivering a drink?',
    answer: 'By the bottom, or the stem for wine and coupe glasses — never the top where they sip',
    choices: [
      'By the bottom, or the stem for wine and coupe glasses — never the top where they sip',
      'By the rim, so it stays level on the way over',
      'Wherever your grip is steadiest with a full tray',
      'By the top of the bowl, away from the stem'
    ],
    hint: "the bottom is our domain, the top is theirs — no “octopus fingers”",
    why: "Service Guide: 'Glassware handled by the bottom, or the stem for wine and coupe glasses — never the top where the guest sips. The bottom of the glass is our domain, the top half is their domain.'"
  },
  {
    id: 'service:bar-inspect',
    title: 'Inspect before it goes out',
    prompt: 'Before you deliver a drink, what do you check?',
    answer: 'Clean glass, proper fill level, and the garnish correct, fresh and attractive',
    choices: [
      'Clean glass, proper fill level, and the garnish correct, fresh and attractive',
      'Only that it matches the chit — the bar already checked it',
      'Just the fill level so it is not short-poured',
      'Nothing — speed matters more than a second look'
    ],
    hint: 'glass, fill, garnish — every drink, every time',
    why: "Service Guide: 'Inspect every drink before delivery: clean glass, proper fill level, garnish correct/fresh/attractive.'"
  },
  {
    id: 'service:bar-coaster',
    title: 'Coaster for beer & crushed ice',
    prompt: 'Which drinks go on a branded coaster, and which go straight on the table?',
    answer: 'All beers and crushed-ice cocktails go on a Bridgette Bar branded coaster — never directly on the tabletop',
    choices: [
      'All beers and crushed-ice cocktails go on a Bridgette Bar branded coaster — never directly on the tabletop',
      'Every drink goes on a coaster, wine and spirits included',
      'Only beers need a coaster; cocktails go on the table',
      'Coasters are only used at the bar top, not at tables'
    ],
    hint: 'beers and crushed-ice drinks sweat — coaster them',
    why: "Service Guide: 'All beers and crushed-ice cocktails go on a Bridgette Bar branded coaster, never directly on the tabletop.'"
  },
  {
    id: 'service:bar-no-verbal',
    title: 'No verbal bills',
    prompt: 'A bartender is slammed and asks you to pour one more and ring it in afterward. What is the rule?',
    answer: 'The bar does not accept verbal bills — nothing is poured that has not been rung in',
    choices: [
      'The bar does not accept verbal bills — nothing is poured that has not been rung in',
      'It is fine during a rush as long as you ring it within the hour',
      'Managers can approve a verbal bill on a busy night',
      'It is allowed for regulars and staff family'
    ],
    hint: 'rung in first, poured second — no exceptions',
    why: "Service Guide: 'The bar does not accept verbal bills, nothing will be poured that has not been rung in.'"
  },
  {
    id: 'service:bar-id-25',
    title: 'ID anyone under 25',
    prompt: 'Which guests get carded?',
    answer: 'Every guest who appears to be under the age of 25',
    choices: [
      'Every guest who appears to be under the age of 25',
      'Only guests who appear to be under the legal age of 18',
      'Only when a guest orders a second round',
      'Only guests the bartender does not recognise'
    ],
    hint: "look under 25, ask for ID — it is policy, not a judgement call",
    why: "Onboarding Package: 'It is our policy to ID each and every guest who appears to be under the age of 25.'"
  },
  {
    id: 'service:bar-taster',
    title: 'Tasters, the honest way',
    prompt: 'A guest is unsure about a glass pour. How do you offer a taste, and how is it handled?',
    answer: 'Offer a free taste on an honour basis; the taster is rung in and split off the bill for a manager to promo',
    choices: [
      'Offer a free taste on an honour basis; the taster is rung in and split off the bill for a manager to promo',
      'Pour the taste and never ring it — it is free, so there is nothing to enter',
      'Charge a small fee for the taste up front',
      'Only the bartender can pour tasters, never a server'
    ],
    hint: 'free to the guest, but it still gets rung in and promoed',
    why: "Service Guide: a free taste of any draft or wine glass pour is offered on an honour-and-not-offer basis; 'tasters must be rung in and split off the bill for a manager to promo.'"
  },
  {
    id: 'service:bar-matinee',
    title: 'Matinee: 2–5pm',
    prompt: 'What is Matinee, and what does it cover?',
    answer: 'Matinee is 2:00–5:00pm every day: 50% off all drinks including bottles of wine, with a smaller matinee food menu',
    choices: [
      'Matinee is 2:00–5:00pm every day: 50% off all drinks including bottles of wine, with a smaller matinee food menu',
      'Matinee is 2:00–5:00pm on weekdays only: 50% off cocktails, full food menu',
      'Matinee is 4:00–6:00pm every day: half-price appetizers, full drink prices',
      'Matinee is 2:00–5:00pm: 50% off food, full drink prices'
    ],
    hint: 'two to five, half off all drinks, smaller food menu',
    why: "Onboarding Package: Matinee (happy hour) runs 2:00–5:00pm every day — 50% off all drinks including bottles of wine, with a limited matinee food menu."
  },
  {
    id: 'service:bar-corkage',
    title: 'Corkage limits',
    prompt: 'A guest brings their own wine. What is the corkage policy?',
    answer: 'Up to two 750ml bottles at $30 each (or one magnum at double corkage); decant and use the proper glassware',
    choices: [
      'Up to two 750ml bottles at $30 each (or one magnum at double corkage); decant and use the proper glassware',
      'One 750ml bottle at $30, no magnums',
      'Unlimited bottles at $30 each as long as they buy food',
      'No corkage — outside wine is never permitted'
    ],
    hint: 'two bottles max, $30 each, decanted',
    why: "Onboarding Package: corkage is max 2 × 750ml at $30/bottle (or 1 magnum at double corkage); 'please ensure that you decant the wine and use the appropriate glassware.'"
  },
  {
    id: 'service:bar-wine-reintro',
    title: 'The splash between courses',
    prompt: 'When is the moment to re-introduce a wine by the glass during a meal?',
    answer: "After clearing the first-course plates, before the second-course reset — offer a splash that pairs with the next dish",
    choices: [
      "After clearing the first-course plates, before the second-course reset — offer a splash that pairs with the next dish",
      'Only when the guest flags you down for another drink',
      'Right as they sit, before any food has arrived',
      'After dessert, with the bill'
    ],
    hint: 'between course one and course two — “a splash that’s perfect with your next plate”',
    why: "Service Guide: after clearing course-1 plates, before the course-2 reset, offer to pour a splash of a wine you think pairs with their next dish."
  }
];
