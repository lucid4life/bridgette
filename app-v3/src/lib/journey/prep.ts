// Prep-my-bottle — the Wednesday-tasting prep tool's pure layer. Unifies the 17
// by-the-glass pours (data.wines, bundled) and the 38 by-the-bottle wines
// (static/fullmenu.json, fetched) into ONE view-model, and mints the bottle's
// 5-question self-check + the 60-second presentation script from its own facts.
// No SRS, no invented facts — every line is the official record's own field.
import type { Wine, Bottle, Objection } from '$lib/data';
import { formatGlassPrice } from './price';

export interface PrepWine {
  id: string;
  name: string;
  kind: 'glass' | 'bottle';
  grape: string;
  region: string;
  country: string;
  vintage: string;
  family: string;
  climate: string;
  structure: { acidity: string; body: string; tannin: string; sweetness: string };
  profile: string;
  tenSecond: string;
  whyWePourIt: string;
  producerStory: string;
  respell: string;
  say: string;
  pair: string[];
  pairWhy?: string;
  objections?: Objection[];
  mnemonic?: string;
  vegan: boolean | null;
  exclusive: boolean;
  /** display price: the glass ladder "5oz $X · 8oz $Y · bottle $Z" or "bottle $N". */
  price: string;
}

export function glassToPrep(w: Wine): PrepWine {
  return {
    id: w.id,
    name: w.name,
    kind: 'glass',
    grape: w.grape,
    region: w.region,
    country: w.country,
    vintage: w.vintage,
    family: w.family,
    climate: w.climate,
    structure: { ...w.structure },
    profile: w.profile,
    tenSecond: w.tenSecond,
    whyWePourIt: w.whyWePourIt ?? w.tenSecond,
    producerStory: w.producerStory ?? '',
    respell: w.pronunciation.respell,
    say: w.pronunciation.say,
    pair: w.pair ?? [],
    ...(w.pairWhy ? { pairWhy: w.pairWhy } : {}),
    objections: w.objections ?? [],
    ...(w.mnemonic ? { mnemonic: w.mnemonic } : {}),
    vegan: w.vegan,
    exclusive: w.exclusive,
    price: formatGlassPrice(w.price)
  };
}

export function bottleToPrep(b: Bottle): PrepWine {
  return {
    id: b.id,
    name: b.name,
    kind: 'bottle',
    grape: b.grape,
    region: b.region,
    country: b.country,
    vintage: b.vintage,
    family: b.family,
    climate: b.climate,
    structure: { ...b.structure },
    profile: b.profile,
    tenSecond: b.tenSecond,
    whyWePourIt: b.whyWePourIt ?? b.tenSecond,
    producerStory: b.producerStory ?? '',
    respell: b.pronunciation.respell,
    say: b.pronunciation.say,
    pair: b.pair ?? [],
    ...(b.pairWhy ? { pairWhy: b.pairWhy } : {}),
    ...(b.mnemonic ? { mnemonic: b.mnemonic } : {}),
    vegan: b.vegan,
    exclusive: b.exclusive,
    price: b.priceBottle != null ? `bottle $${b.priceBottle}` : 'bottle — ask'
  };
}

/** The bottle's 5-question self-check — its own facts, answered from memory then
 * self-rated. Stable order: identity (grape, place), structure, pairing, why. */
export interface PrepQuestion {
  prompt: string;
  answer: string;
}
export function prepSelfCheck(w: PrepWine): PrepQuestion[] {
  const out: PrepQuestion[] = [
    { prompt: `What grape is the ${w.name}?`, answer: w.grape },
    { prompt: `Where is the ${w.name} from?`, answer: `${w.region}, ${w.country}` },
    {
      prompt: `What's the structure of the ${w.name}?`,
      answer: `acidity ${w.structure.acidity} · body ${w.structure.body} · tannin ${w.structure.tannin} · ${w.structure.sweetness}`
    }
  ];
  if (w.pair.length > 0) out.push({ prompt: `What does the ${w.name} pour with?`, answer: w.pair.join(', ') });
  out.push({ prompt: `Why do we pour the ${w.name}?`, answer: w.whyWePourIt });
  return out;
}

/** The 60-second preshift presentation, beat by beat — every line is the wine's
 * own field, assembled into the order a server actually says at the table:
 * open (name + how to say it) → place (grape + region) → why we pour it →
 * a pairing → a confident closer. */
export interface PrepBeat {
  label: string;
  line: string;
}
export function prepScript(w: PrepWine): PrepBeat[] {
  const beats: PrepBeat[] = [
    { label: 'open', line: `"This is the ${w.name}" — say it: ${w.respell}.` },
    { label: 'grape & place', line: `${w.grape} from ${w.region}${w.vintage ? `, ${w.vintage}` : ''}.` },
    { label: 'why we pour it', line: w.whyWePourIt }
  ];
  if (w.pair.length > 0) {
    beats.push({
      label: 'a pairing',
      line: `Great with ${w.pair[0]}${w.pairWhy ? ` — ${w.pairWhy}` : ''}.`
    });
  }
  beats.push({ label: 'the closer', line: `${w.tenSecond} Happy to pour you a taste.` });
  return beats;
}
