// app/src/lib/engine/pairing.js — the pairing-lever model (pure: no DOM, no storage).
// LEVERS is the canonical lever vocabulary — data.foods[].lever keys into it, and the
// label/script pair is the floor-ready language a server actually says at the table.
// leversFor() is a ranked heuristic inference (food cues × wine structure) used by the
// Pairing Explorer and by the test guard that keeps the authored lever assignments honest.

export const LEVERS = {
  'acid-cuts-fat': {
    id: 'acid-cuts-fat',
    label: 'Acidity cuts fat',
    script: 'The acidity cuts the fat and resets your palate.'
  },
  'tannin-binds-protein': {
    id: 'tannin-binds-protein',
    label: 'Tannin binds protein',
    script: 'The tannin binds to the protein and fat, so the wine turns softer with the meat.'
  },
  'salt-softens-tannin': {
    id: 'salt-softens-tannin',
    label: 'Salt softens the wine',
    script: 'Salt softens the wine and makes the fruit pop.'
  },
  'sweet-tames-heat': {
    id: 'sweet-tames-heat',
    label: 'Sweetness tames heat',
    script: 'That touch of sweetness calms the chili heat.'
  },
  'no-tannin-with-spice': {
    id: 'no-tannin-with-spice',
    label: 'No big tannin with spice',
    script: 'With spice we skip big tannin — it amplifies the burn — and go fresh instead.'
  },
  'match-intensity': {
    id: 'match-intensity',
    label: 'Match the intensity',
    script: 'The weight matches — a delicate dish wants a delicate wine, a bold dish a bold one.'
  },
  'match-sweetness': {
    id: 'match-sweetness',
    label: 'Match the sweetness',
    script: 'The wine is at least as sweet as the dessert, so it never tastes thin.'
  }
};

// Word-cue detectors over the food's flavor + tags + category. \brich\b (not "richness")
// keeps the fat cue from over-firing; the spice cue is the authored 'spice' tag (plus the
// jalapeño tell) so a mere "chili oil" garnish doesn't read as a spicy dish.
const FAT_CUE = /fried|crisp|cream|\brich\b|fat|butter|aioli|bacon|nut/;
const SALT_CUE = /salt|brin|pickle|caper|olive|feta|salami|cured|anchov/;
const RED_MEAT_CUE = /beef|steak|lamb|ribeye|venison/;

// Pure ranked inference: which levers plausibly make this (food, wine) pairing work,
// best first. `wine` may be undefined (dessert pours live off the glass list) — the
// food-side cues still rank. match-intensity is always present as the ranked fallback.
export function leversFor(food, wine) {
  food = food || {};
  const tags = food.tags || [];
  const text = ((food.flavor || '') + ' ' + tags.join(' ') + ' ' + (food.category || '')).toLowerCase();
  const st = (wine && wine.structure) || null;
  const wineCat = (wine && wine.category) || '';

  const fatCue = FAT_CUE.test(text);
  const saltCue = SALT_CUE.test(text);
  const spiceCue = tags.indexOf('spice') !== -1 || /jalape/.test(text);
  const redMeatCue = RED_MEAT_CUE.test(text);
  const tannic = !!(st && (st.tannin === 'high' || st.tannin === 'medium'));
  const brightWine = !!((st && st.acidity === 'high') || wineCat === 'Bubbly');

  const score = {};
  // Dessert: the cardinal rule — the wine must be at least as sweet as the plate.
  if ((food.category || '').toLowerCase() === 'dessert') score['match-sweetness'] = 4;
  // Heat + an off-dry pour: the sugar is doing the calming.
  if (spiceCue && st && st.sweetness === 'off-dry') score['sweet-tames-heat'] = 3.5;
  // Red meat into a tannic red: the classic bind. A fatty/savory plate under a tannic
  // red (bread & butter, charcuterie boards) leans on the same lever, slightly softer.
  if (redMeatCue && tannic) score['tannin-binds-protein'] = 3;
  else if (fatCue && wineCat === 'Red' && tannic) score['tannin-binds-protein'] = 2.5;
  // Heat + a low-tannin pour: we dodged the burn on purpose.
  if (spiceCue && st && st.tannin === 'low') score['no-tannin-with-spice'] = 2;
  if (saltCue) score['salt-softens-tannin'] = 2;
  // Fat cues want acid; stronger when the pour actually brings it (high acid / bubbles).
  // A bright pour with no fat on the plate is still a faint acid signal, under intensity.
  if (fatCue) score['acid-cuts-fat'] = 2 + (brightWine ? 1 : 0);
  else if (brightWine) score['acid-cuts-fat'] = 0.5;
  score['match-intensity'] = Math.max(score['match-intensity'] || 0, 0.75);

  const order = Object.keys(LEVERS);
  return Object.keys(score).sort((a, b) => (score[b] - score[a]) || (order.indexOf(a) - order.indexOf(b)));
}
