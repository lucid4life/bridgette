// app/src/lib/engine/training.js — ported pure Leitner engine (ESM).
// Source: src/training.js (the DOM/Practice UI half is intentionally NOT ported).
// Card-`id` slug scheme and the localStorage key are preserved BYTE-FOR-BYTE
// (changing either silently wipes a real user's Leitner progress). Functions that
// took an implicit window.BB.data fallback in v1 now REQUIRE an explicit `data` arg.

// ---- constants (spec §8 / research convergence) ----
export const BOX_DUE_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
export const NEW_CAP = 9; // new cards per session (anti-burnout cap, separate from size)
export const SIZE_CAP = 18; // total cards per session

export const STORAGE_KEY = 'bb_progress_v1'; // BYTE-FOR-BYTE — do not rename
const SCHEMA = 1; // progress-object schema (distinct from data.schemaVersion)

// ---- day math: local calendar day -> exact integer ordinal (DST-proof) ----
export function dayNumber(date) {
  date = date || new Date();
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

function clampBox(b) { return Math.max(1, Math.min(5, b)); }

// Pure. Returns a NEW card state. `today` is a day integer (dayNumber()).
export function grade(state, correct, today) {
  const s = {
    box: state.box, due: state.due, lastSeen: state.lastSeen,
    correct: state.correct || 0, wrong: state.wrong || 0,
    consecutiveWrong: state.consecutiveWrong || 0
  };
  if (correct) {
    s.box = clampBox(s.box + 1);
    s.correct += 1;
    s.consecutiveWrong = 0;
  } else {
    s.wrong += 1;
    s.consecutiveWrong += 1;
    // Gentle lapse: one miss demotes a single box; box 1 only after TWO in a row.
    s.box = s.consecutiveWrong >= 2 ? 1 : clampBox(s.box - 1);
  }
  s.lastSeen = today;
  s.due = today + BOX_DUE_DAYS[s.box];
  return s;
}

const ARTICLES = { the: 1, a: 1, an: 1, le: 1, la: 1, les: 1, el: 1, il: 1, of: 1, and: 1 };

export function normalizeAnswer(s) {
  s = String(s == null ? '' : s);
  s = s.normalize('NFKD').replace(/[̀-ͯ]/g, ''); // strip accents
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9\s]+/g, ' '); // drop punctuation
  const tokens = s.split(/\s+/).filter((t) => t && !ARTICLES[t]);
  return tokens.join(' ').trim();
}

function tokenSet(s) {
  const out = {};
  normalizeAnswer(s).split(' ').forEach((t) => { if (t) out[t] = 1; });
  return out;
}

// Pure boolean. The UI still always offers an "I got it / I didn't" override.
export function gradeTyped(card, input) {
  const norm = normalizeAnswer(input);
  if (!norm) return false;
  const candidates = [card.answer].concat(card.aliases || []);
  for (let i = 0; i < candidates.length; i++) {
    const target = normalizeAnswer(candidates[i]);
    if (!target) continue;
    if (norm === target) return true;
    // token-subset: every meaningful token the learner typed appears in the target,
    // AND they covered a distinctive chunk (>=2 tokens, or the whole single-token target).
    const targetTokens = tokenSet(target);
    const inTokens = norm.split(' ');
    const covered = inTokens.length > 0 && inTokens.every((t) => targetTokens[t]);
    if (covered && (inTokens.length >= 2 || Object.keys(targetTokens).length === 1)) return true;
    // reverse: learner typed the full target plus at most one extra qualifier word
    // (bounded so a verbose/wrong answer that merely embeds the target is rejected)
    const allInputTokens = tokenSet(norm);
    const targetToks = target.split(' ');
    const inputLen = inTokens.length;
    const targetCovered = targetToks.every((t) => allInputTokens[t]);
    if (targetCovered && (inputLen - targetToks.length) <= 1) return true;
  }
  return false;
}

// Lenient streak: a single missed day (gap of 2) is forgiven; 2+ missed days reset.
export function updateStreak(streak, today) {
  const last = streak && streak.lastStudyDate;
  const current = (streak && streak.current) || 0;
  if (last == null) return { current: 1, lastStudyDate: today };
  const gap = today - last;
  if (gap === 0) return { current: current, lastStudyDate: last };
  if (gap <= 2) return { current: current + 1, lastStudyDate: today }; // gap 1 or 2 (grace)
  return { current: 1, lastStudyDate: today };
}

export function isDue(state, today) {
  if (today == null) today = dayNumber();
  return today >= state.due;
}

export function newState(today) {
  if (today == null) today = dayNumber();
  return { box: 1, due: today, lastSeen: today, correct: 0, wrong: 0, consecutiveWrong: 0 };
}

// ---------------- deck generators (pure: data -> Card[]) ----------------
export const DECKS = {
  translator: { label: 'Translator', learnLink: 'common-substitutions' },
  'wine-identity': { label: 'Wine Identity', learnLink: 'deductive-grid' },
  pronunciation: { label: 'Pronunciation', learnLink: 'pronunciation-primer' },
  pairing: { label: 'Pairing & Why', learnLink: 'pairing-levers' },
  structure: { label: 'Structure', learnLink: 'structure-words' },
  mystery: { label: 'Mystery Pour', learnLink: 'deductive-grid' },
  // v2 sprint1 — two under-served core areas finally get retrieval practice.
  'cocktail-pairing': { label: 'Cocktail Pairing', learnLink: 'pairing-levers' },
  // The reverse pairing direction: pouring this wine, which dish do you steer them to?
  'wine-dish': { label: 'Wine → Dish', learnLink: 'pairing-levers' },
  upsell: { label: 'Upselling', learnLink: 'talking-to-a-guest' }
};

const COUNTRY_LANG = {
  Austria: 'de-AT', Germany: 'de-DE', France: 'fr-FR', Italy: 'it-IT',
  Spain: 'es-ES', Portugal: 'pt-PT', Canada: 'en-CA'
};
export function langFor(country) { return COUNTRY_LANG[country] || 'en-US'; }

export function slug(s) {
  return String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Deterministic distractor picker: rotates through the pool so cards differ.
function pickDistractors(pool, answer, count, seed) {
  const opts = pool.filter((x) => x !== answer);
  const picks = [];
  const n = opts.length;
  for (let i = 0; i < n && picks.length < count; i++) {
    const v = opts[(seed + i) % n];
    if (picks.indexOf(v) === -1) picks.push(v);
  }
  return picks;
}

function wineByName(data, name) {
  for (let i = 0; i < data.wines.length; i++) if (data.wines[i].name === name) return data.wines[i];
  return null;
}

function cocktailByName(data, name) {
  for (let i = 0; i < data.cocktails.length; i++) if (data.cocktails[i].name === name) return data.cocktails[i];
  return null;
}

// LS-05: MC distractors that are structurally NEAREST the answer wine (reuse the
// Mystery-Pour adjacency ranking) so a steak red never offers a sparkling/rosé as a
// plausible-but-silly foil. Falls back to deterministic rotation when the answer
// isn't one of our 17 wines (e.g. a "grape — region" identity string).
export function wineDistractors(data, answerName, count, seed) {
  const ans = wineByName(data, answerName);
  if (!ans) return pickDistractors(data.wines.map((w) => w.name), answerName, count, seed);
  return adjacentWines(ans, data.wines).slice(0, count).map((w) => w.name);
}

function genTranslator(data) {
  return data.translator.map((t, i) => {
    const w = wineByName(data, t.bestGlass);
    return {
      id: 'translator:' + slug(t.ask) + ':ask',
      deck: 'translator', kind: 'recall',
      prompt: 'A guest asks for ' + t.ask + '. What’s your by-the-glass pour?',
      answer: t.bestGlass,
      why: t.phrase,
      choices: [t.bestGlass].concat(wineDistractors(data, t.bestGlass, 3, i)),
      aliases: (w && w.aliases) ? w.aliases.slice() : [],
      scenario: 'A guest says “I usually drink ' + t.ask + '.” Name the by-the-glass pour and one sentence on why it fits.',
      learnLink: DECKS.translator.learnLink,
      tags: ['translator'].concat(w && w.tags ? w.tags : [])
    };
  });
}

function genWineIdentity(data) {
  const ident = data.wines.map((w) => w.grape + ' — ' + w.region);
  const cards = [];
  data.wines.forEach((w, i) => {
    const ans = w.grape + ' — ' + w.region;
    cards.push({
      id: 'wine-identity:' + w.id + ':grape',
      deck: 'wine-identity', kind: 'recall',
      prompt: w.name + ': what grape and region?',
      answer: ans,
      why: w.profile || '',
      choices: [ans].concat(pickDistractors(ident, ans, 3, i)),
      aliases: [w.grape, w.region],
      scenario: 'A regular asks what ' + w.name + ' actually is. Give the grape and region and one line of character.',
      learnLink: DECKS['wine-identity'].learnLink,
      tags: (w.tags || []).slice()
    });
    cards.push({
      id: 'wine-identity:' + w.id + ':name',
      deck: 'wine-identity', kind: 'recall',
      prompt: w.grape + ' from ' + w.region + ' — which wine on our list?',
      answer: w.name,
      why: w.tenSecond || w.profile || '',
      choices: [w.name].concat(wineDistractors(data, w.name, 3, i)),
      aliases: (w.aliases || []).slice(),
      scenario: 'A guest wants the ' + w.grape + ' from ' + w.region + '. Name the exact pour on our list.',
      learnLink: DECKS['wine-identity'].learnLink,
      tags: (w.tags || []).slice()
    });
  });
  return cards;
}

function genPronunciation(data) {
  return data.wines.map((w) => {
    return {
      id: 'pronunciation:' + w.id + ':say',
      wineId: w.id,
      deck: 'pronunciation', kind: 'pronounce',
      prompt: 'How do you say “' + w.name + '”?',
      answer: w.pronunciation.respell,
      why: w.mnemonic || '',
      audioText: w.pronunciation.say,
      lang: langFor(w.country),
      learnLink: DECKS.pronunciation.learnLink,
      tags: (w.tags || []).slice()
    };
  });
}

function genPairing(data) {
  return data.foods.filter((f) => f.wine).map((f, i) => {
    const w = wineByName(data, f.wine);
    return {
      id: 'pairing:' + f.id + ':match',
      deck: 'pairing', kind: 'recall',
      prompt: 'A guest orders ' + f.name + '. Best by-the-glass — and why?',
      answer: f.wine,
      why: f.why || '',
      choices: [f.wine].concat(wineDistractors(data, f.wine, 3, i)),
      aliases: (w && w.aliases) ? w.aliases.slice() : [],
      scenario: 'Table just ordered ' + f.name + '. Recommend the glass and give the one structural reason it works.',
      learnLink: DECKS.pairing.learnLink,
      tags: (f.tags || []).slice()
    };
  });
}

const LEVEL = { low: 1, medium: 2, high: 3 };
function genStructure(data) {
  const cards = [];
  ['acidity', 'tannin', 'body'].forEach((attr) => {
    const highs = data.wines.filter((w) => w.structure && w.structure[attr] === 'high');
    const lowers = data.wines.filter((w) => w.structure && LEVEL[w.structure[attr]] < 3);
    highs.forEach((w, i) => {
      const others = pickDistractors(lowers.map((x) => x.name), w.name, 2, i);
      if (others.length < 2) return; // need a full triple
      cards.push({
        id: 'structure:' + attr + '-' + w.id + ':pick',
        deck: 'structure', kind: 'discriminate',
        prompt: 'Which has the highest ' + attr + '?',
        answer: w.name,
        why: w.name + ' sits at high ' + attr + '; the others are lower.',
        choices: [w.name].concat(others),
        aliases: [],
        learnLink: DECKS.structure.learnLink,
        tags: ['structure', attr]
      });
    });
  });
  // Structure RECALL (spec §9): given a named wine, recall its level for each
  // attribute. MC over the WSET low/medium/high scale.
  data.wines.forEach((w) => {
    ['acidity', 'tannin', 'body'].forEach((attr) => {
      const lvl = w.structure && w.structure[attr];
      if (!LEVEL[lvl]) return;
      cards.push({
        id: 'structure:recall-' + attr + '-' + w.id + ':level',
        deck: 'structure', kind: 'discriminate',
        prompt: w.name + ' — is its ' + attr + ' low, medium, or high?',
        answer: lvl,
        why: w.name + ' is ' + lvl + ' in ' + attr + (w.structureNote ? ' — ' + w.structureNote : '') + '.',
        choices: ['low', 'medium', 'high'],
        aliases: [],
        learnLink: DECKS.structure.learnLink,
        tags: ['structure', attr]
      });
    });
  });
  return cards;
}

// ---------------- Mystery Pour (the deductive grid as a generated card, spec §8) ----------------
// Structure fingerprint -> name our wine (and the reverse). Distractors are the
// structurally-ADJACENT wines (L1 distance over acidity/body/tannin) so the learner
// must reason on the fine axis differences, not category gestalt. Pure + deterministic
// (choices are answer-first; the UI shuffles display order). Card ids are stable
// functions of the wine id: "mystery:<wineId>:name" / ":grape".
var FP_AXES = ['acidity', 'body', 'tannin'];
function structDist(a, b) {
  var d = 0;
  for (var i = 0; i < FP_AXES.length; i++) {
    var ax = FP_AXES[i];
    d += Math.abs(LEVEL[a.structure[ax]] - LEVEL[b.structure[ax]]);
  }
  return d; // 0..6; sweetness intentionally excluded
}
function fpString(w) {
  return w.structure.acidity + ' acidity · ' + w.structure.body + ' body · ' +
    w.structure.tannin + ' tannin · ' + w.structure.sweetness;
}
function fpPrompt(w) {
  return 'A ' + w.climate + '-climate ' + w.category.toLowerCase() + ': ' +
    w.structure.acidity + ' acidity, ' + w.structure.body + ' body, ' +
    w.structure.tannin + ' tannin, ' + w.structure.sweetness + '.';
}
function fullFp(w) {
  return [w.category, w.climate, w.structure.acidity, w.structure.body, w.structure.tannin, w.structure.sweetness].join('|');
}
// deterministic ranking of every OTHER wine by structural adjacency (no rng)
function adjacentWines(target, wines) {
  return wines.filter(function (w) { return w.id !== target.id; })
    .map(function (w) {
      return { w: w, d: structDist(target, w), sameCat: w.category === target.category ? 0 : 1, sameClim: w.climate === target.climate ? 0 : 1 };
    })
    .sort(function (a, b) {
      return (a.d - b.d) || (a.sameCat - b.sameCat) || (a.sameClim - b.sameClim) || (a.w.id < b.w.id ? -1 : a.w.id > b.w.id ? 1 : 0);
    })
    .map(function (x) { return x.w; });
}

export function buildMysteryPour(data) {
  if (!data) throw new Error('engine.buildMysteryPour: data is required');
  var wines = data.wines;
  var cards = [];
  wines.forEach(function (w) {
    var ranked = adjacentWines(w, wines);
    var distractorWines = ranked.slice(0, 3);

    // dir 'grape': wine NAME -> its fingerprint STRING (always fair; dedupe collinear fps)
    var answerFp = fpString(w);
    var fpChoices = [answerFp];
    for (var i = 0; i < ranked.length && fpChoices.length < 4; i++) {
      var s = fpString(ranked[i]);
      if (fpChoices.indexOf(s) === -1) fpChoices.push(s);
    }
    if (fpChoices.length === 4) {
      cards.push({
        id: 'mystery:' + w.id + ':grape',
        deck: 'mystery', kind: 'discriminate', wineId: w.id,
        prompt: w.name + ' — what is its structure signature?',
        answer: answerFp,
        why: w.name + ' (' + w.grape + ', ' + w.region + ') reads ' + answerFp + (w.structureNote ? ' — ' + w.structureNote : '') + '.',
        choices: fpChoices,
        aliases: [], learnLink: 'deductive-grid',
        tags: ['mystery', 'grape', w.category.toLowerCase()].concat(w.tags || [])
      });
    }

    // dir 'name': fingerprint -> our WINE (guard identical-fingerprint cohorts)
    var cohort = wines.filter(function (x) { return fullFp(x) === fullFp(w); });
    var hasTwin = distractorWines.some(function (d) { return fullFp(d) === fullFp(w); });
    var prompt = fpPrompt(w) + ' Which wine on our list?';
    var aliases = [];
    if (hasTwin) {
      prompt = fpPrompt(w) + ' (from ' + (w.region || w.country) + ') Which wine on our list?';
      aliases = cohort.filter(function (x) { return x.id !== w.id; }).map(function (x) { return x.name; });
    }
    if (distractorWines.length === 3) {
      cards.push({
        id: 'mystery:' + w.id + ':name',
        deck: 'mystery', kind: 'discriminate', wineId: w.id,
        prompt: prompt,
        answer: w.name,
        why: 'It’s ' + w.grape + ' from ' + w.region + '. The tell: ' + fpString(w) + (hasTwin ? ' (others share this profile — region pins it).' : '.'),
        choices: [w.name].concat(distractorWines.map(function (d) { return d.name; })),
        aliases: aliases, learnLink: 'deductive-grid',
        tags: ['mystery', 'name', w.category.toLowerCase()].concat(w.tags || [])
      });
    }
  });
  return cards;
}

// LS-01: food -> best cocktail (+ the non-drinker zero-proof beat). Distractors are
// OTHER cocktails only — leaking a wine would make it trivially solvable. Foods whose
// printed cocktail can't be resolved to a real cocktail are skipped (no phantom answers).
function genCocktailPairing(data) {
  const ckNames = data.cocktails.map((c) => c.name);
  const isCk = {}; ckNames.forEach((n) => { isCk[n] = 1; });
  const cards = [];
  data.foods.filter((f) => f.cocktail).forEach((f, i) => {
    const options = String(f.cocktail).split(/\s+or\s+/i).map((s) => s.trim()).filter(Boolean);
    const valid = options.filter((n) => isCk[n]);
    if (!valid.length) return;
    const answer = valid[0];
    const pool = ckNames.filter((n) => valid.indexOf(n) === -1);
    const why = (f.why || 'A strong cocktail call with ' + f.name + '.') +
      (f.zero ? ' Not drinking? ' + f.zero + '.' : '');
    cards.push({
      id: 'cocktail-pairing:' + f.id + ':match',
      deck: 'cocktail-pairing', kind: 'recall',
      prompt: 'A guest at ' + f.name + ' wants a cocktail. Best call?',
      answer: answer,
      why: why,
      choices: [answer].concat(pickDistractors(pool, answer, 3, i)),
      aliases: valid.slice(1),
      scenario: 'A guest at ' + f.name + " isn't drinking wine tonight — recommend a cocktail and one line on why.",
      learnLink: DECKS['cocktail-pairing'].learnLink,
      tags: ['cocktail-pairing'].concat(f.tags || [])
    });
  });
  return cards;
}

// Wine -> Dish (the REVERSE pairing direction, spec §7): you're pouring this wine —
// which dish on our menu sings with it? One card per wine that is the printed pour for
// at least one dish. Answer = the FIRST dish paired with that wine (deterministic, no
// rng — keeps the card id and answer stable). Distractors are dishes paired with
// STRUCTURALLY-DISTANT wines (reds vs whites/rosé/bubbly) so a crisp white never offers
// a steak as a plausible foil; falls back to dishes paired with any OTHER wine.
function isRedWine(data, name) {
  const w = wineByName(data, name);
  return !!(w && w.category === 'Red');
}
function genWineDish(data) {
  const cards = [];
  data.wines.forEach((w, i) => {
    const mine = data.foods.filter((f) => f.wine === w.name);
    if (!mine.length) return; // only wines that actually pour with a dish
    const food = mine[0];
    const answer = food.name;
    const wRed = isRedWine(data, w.name);
    // dishes paired with a structurally-distant wine (opposite red/not-red side)
    const distant = data.foods.filter((f) => f.wine && f.wine !== w.name &&
      isRedWine(data, f.wine) !== wRed);
    // fallback pool: dishes paired with ANY other wine (covers single-side menus)
    const other = data.foods.filter((f) => f.wine && f.wine !== w.name);
    const pool = (distant.length >= 2 ? distant : other).map((f) => f.name);
    cards.push({
      id: 'wine-dish:' + w.id + ':match',
      deck: 'wine-dish', kind: 'recall',
      prompt: "You're pouring " + w.name + ' — which dish on our menu sings with it?',
      answer: answer,
      why: food.why || '',
      choices: [answer].concat(pickDistractors(pool, answer, 3, i)),
      aliases: [],
      scenario: "You've just poured " + w.name + ' — recommend the one dish on our menu that sings with it, and the one reason it works.',
      learnLink: DECKS['wine-dish'].learnLink,
      tags: ['wine-dish'].concat(w.tags || [])
    });
  });
  return cards;
}

// LS-02: glass -> bottle upsell. kind 'discriminate' (always MC) because the upgrade
// text is prose, not a clean typeable token. The why carries the economics + the ethic.
function genUpsell(data) {
  const wines = data.wines.filter((w) => w.upgrade);
  const upgrades = wines.map((w) => w.upgrade);
  return wines.map((w, i) => {
    const p = String(w.price).split('|').map((s) => s.trim());
    const econ = p.length === 3
      ? 'A bottle ($' + p[2] + ') is about 5x the 5oz pour ($' + p[0] + ')'
      : 'A bottle is about 5x a single glass';
    const pool = upgrades.filter((u) => u !== w.upgrade);
    return {
      id: 'upsell:' + w.id + ':bottle',
      deck: 'upsell', kind: 'discriminate',
      prompt: 'A guest is loving the ' + w.name + ' by the glass. What is the bottle move?',
      answer: w.upgrade,
      why: econ + '. Offer it once they are enjoying the glass — never push. ' + w.name + ' steps up to: ' + w.upgrade,
      choices: [w.upgrade].concat(pickDistractors(pool, w.upgrade, 3, i)),
      aliases: [],
      learnLink: DECKS.upsell.learnLink,
      tags: ['upsell'].concat(w.tags || [])
    };
  });
}

export function generateDeck(deckId, data) {
  if (!data) throw new Error('engine.generateDeck: data is required');
  switch (deckId) {
    case 'translator': return genTranslator(data);
    case 'wine-identity': return genWineIdentity(data);
    case 'pronunciation': return genPronunciation(data);
    case 'pairing': return genPairing(data);
    case 'structure': return genStructure(data);
    case 'mystery': return buildMysteryPour(data);
    case 'cocktail-pairing': return genCocktailPairing(data);
    case 'wine-dish': return genWineDish(data);
    case 'upsell': return genUpsell(data);
    default: return [];
  }
}

export function allCards(data) {
  if (!data) throw new Error('engine.allCards: data is required');
  let all = [];
  Object.keys(DECKS).forEach((id) => { all = all.concat(generateDeck(id, data)); });
  return all;
}

// ---------------- Readiness Check (pure: a mixed gauntlet across live decks) ----------------
export function buildReadiness(data, opts) {
  if (!data) throw new Error('engine.buildReadiness: data is required');
  opts = opts || {};
  const perDeck = opts.perDeck != null ? opts.perDeck : 3;
  const rng = opts.rng || Math.random;
  let picked = [];
  Object.keys(DECKS).forEach((id) => {
    // Pronunciation is self-graded (flip), so it can't be part of an OBJECTIVE
    // shift-ready %. It stays in Smart Review + its own Focus deck (spec §9 honesty).
    if (id === 'pronunciation') return;
    const cards = generateDeck(id, data);
    picked = picked.concat(shuffle(cards, rng).slice(0, perDeck));
  });
  return shuffle(picked, rng);
}

// Pure scorer. results: [{ card, correct, confidence? }]. weakAreas exclude deck-name
// tags. Confidence-weighted (spec §9) so lucky/unsure guesses don't inflate the headline:
// a confident-correct or unrated-correct = full credit, a shaky-correct = 0.6, any wrong
// = 0. A confident-WRONG answer is counted in sureWrong — a dangerous floor belief to fix
// first. With no confidence on any result (older callers/tests) this reduces to raw %.
/** @returns {{ total:number, correct:number, score:number, weakAreas:string[], byDeck:Record<string,{total:number,correct:number}>, sureWrong:number }} */
export function scoreReadiness(results) {
  results = results || [];
  const isDeckTag = {};
  Object.keys(DECKS).forEach((id) => { isDeckTag[id] = 1; });
  const total = results.length;
  let correct = 0;
  let weighted = 0;
  let sureWrong = 0;
  const miss = {};
  const byDeck = {};
  results.forEach((r) => {
    const card = r.card || {};
    const d = card.deck;
    if (d) {
      byDeck[d] = byDeck[d] || { total: 0, correct: 0 };
      byDeck[d].total += 1;
      if (r.correct) byDeck[d].correct += 1;
    }
    if (r.correct) {
      correct += 1;
      weighted += (r.confidence === 'shaky') ? 0.6 : 1;
      return;
    }
    if (r.confidence === 'sure') sureWrong += 1;
    (card.tags || []).forEach((t) => { if (!isDeckTag[t]) miss[t] = (miss[t] || 0) + 1; });
  });
  const weakAreas = Object.keys(miss).sort((a, b) => (miss[b] - miss[a]) || (a < b ? -1 : a > b ? 1 : 0));
  return {
    total: total, correct: correct,
    score: total ? Math.round((weighted / total) * 100) : 0,
    weakAreas: weakAreas, byDeck: byDeck, sureWrong: sureWrong
  };
}

// Pure: returns a new progress object with the readiness summary written.
/** @returns {import('../data/types').Progress} */
export function recordReadiness(progress, scored, today) {
  if (today == null) today = dayNumber();
  const next = JSON.parse(JSON.stringify(progress));
  next.readiness = {
    lastScore: scored.score,
    lastTaken: today,
    weakAreas: (scored.weakAreas || []).slice(0, 8),
    byDeck: scored.byDeck || {}
  };
  return next;
}

// ---------------- session composition (pure) ----------------
/** @returns {import('../data/types').Progress} */
function defaultProgressShape() {
  return {
    schema: 1, cards: {}, decks: {}, tags: {}, readiness: null,
    studyDays: [], // v2 forgiving-streak source of truth (sorted day-numbers)
    streak: { current: 0, lastStudyDate: null },
    settings: { difficulty: 'adaptive', audio: true, goal: 'daily', weeklyTarget: 3 }
  };
}
export const defaultProgress = defaultProgressShape;

// localStorage-backed persistence (degrades silently if unavailable/denied/quota).
function validIdSet(data) { return new Set(allCards(data).map((c) => c.id)); }

export function loadProgress(data) {
  if (typeof localStorage === 'undefined') return defaultProgressShape();
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { raw = null; }
  return migrateProgress(raw, validIdSet(data));
}

export function saveProgress(progress) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ }
}

export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor((rng ? rng() : Math.random()) * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// Pure session composer. ctx = { data, progress, today, newCap, sizeCap, rng }.
// deckId null => Smart Review (mixed across all decks, interleaved).
export function buildSession(deckId, ctx) {
  ctx = ctx || {};
  const data = ctx.data;
  if (!data) throw new Error('engine.buildSession: ctx.data is required');
  const progress = ctx.progress || loadProgress(data);
  const today = ctx.today != null ? ctx.today : dayNumber();
  const newCap = ctx.newCap != null ? ctx.newCap : NEW_CAP;
  const sizeCap = ctx.sizeCap != null ? ctx.sizeCap : SIZE_CAP;
  const rng = ctx.rng || Math.random;

  const cards = deckId == null ? allCards(data) : generateDeck(deckId, data);

  const due = [];
  const fresh = [];
  cards.forEach((c) => {
    const st = progress.cards[c.id];
    if (!st) { fresh.push(c); return; }
    if (isDue(st, today)) due.push({ card: c, st: st });
  });

  // weak-first: lower box, then more wrong, then least-recently seen
  due.sort((a, b) => (a.st.box - b.st.box) || (b.st.wrong - a.st.wrong) || (a.st.lastSeen - b.st.lastSeen));

  const review = due.slice(0, sizeCap).map((d) => d.card);
  const newSlots = Math.max(0, Math.min(newCap, sizeCap - review.length, fresh.length));
  // Smart Review (deckId null) must draw NEW cards from across decks, not just the
  // first deck in allCards order — otherwise a fresh user (no due cards) gets 9
  // same-deck cards and the final shuffle has nothing to interleave. Focus keeps
  // its deck's stable intro order.
  const newPool = (deckId == null) ? shuffle(fresh, rng) : fresh;
  const newest = newPool.slice(0, newSlots);

  let session = review.concat(newest);
  if (deckId == null) session = shuffle(session, rng); // interleave review + new for Mixed practice
  return session;
}

// ---------------- progress layer (pure transforms) ----------------

// Coerce a (possibly partial / hand-edited / older-schema) card state into a
// valid, schedulable shape so it can never silently disappear (missing `due`)
// or corrupt the engine (out-of-range box).
function normalizeCardState(s, today) {
  s = s || {};
  let box = Math.round(Number(s.box));
  if (!isFinite(box)) box = 1;
  box = clampBox(box);
  let due = Number(s.due); if (!isFinite(due)) due = today;
  let lastSeen = Number(s.lastSeen); if (!isFinite(lastSeen)) lastSeen = today;
  return {
    box: box, due: due, lastSeen: lastSeen,
    correct: Number(s.correct) || 0,
    wrong: Number(s.wrong) || 0,
    consecutiveWrong: Number(s.consecutiveWrong) || 0
  };
}

/**
 * @param {any} raw
 * @param {Set<string>} [validIds]
 * @returns {import('../data/types').Progress}
 */
export function migrateProgress(raw, validIds) {
  const base = defaultProgressShape();
  if (!raw || typeof raw !== 'object') return base;
  base.schema = SCHEMA;
  const today = dayNumber();
  if (raw.cards && typeof raw.cards === 'object') {
    Object.keys(raw.cards).forEach((id) => {
      if (!validIds || validIds.has(id)) base.cards[id] = normalizeCardState(raw.cards[id], today);
    });
  }
  if (raw.streak && typeof raw.streak === 'object') {
    base.streak = {
      current: raw.streak.current || 0,
      lastStudyDate: raw.streak.lastStudyDate != null ? raw.streak.lastStudyDate : null
    };
  }
  if (raw.settings && typeof raw.settings === 'object') {
    base.settings.difficulty = raw.settings.difficulty || base.settings.difficulty;
    base.settings.audio = raw.settings.audio !== false;
    base.settings.goal = raw.settings.goal === 'weekly' ? 'weekly' : 'daily';
    if (isFinite(raw.settings.weeklyTarget)) {
      base.settings.weeklyTarget = Math.max(1, Math.min(7, Math.round(Number(raw.settings.weeklyTarget))));
    }
  }
  // v2 study-day log; backfill from the legacy lastStudyDate so upgrading users
  // keep a streak. (Unknown to v1, so this restores continuity, never loses it.)
  if (Array.isArray(raw.studyDays)) {
    base.studyDays = Array.from(new Set(raw.studyDays.filter(function (d) { return isFinite(d); }).map(Number))).sort(function (a, b) { return a - b; });
  } else if (base.streak.lastStudyDate != null) {
    base.studyDays = [base.streak.lastStudyDate];
  }
  if (raw.readiness) base.readiness = raw.readiness;
  return base;
}

// mastery for a deck id OR a tag: mean of (box-1)/4*100 over matching cards (unseen=box1=0).
export function masteryFor(progress, key, data) {
  if (!data) throw new Error('engine.masteryFor: data is required');
  const all = allCards(data);
  const matching = all.filter((c) => c.deck === key || (c.tags && c.tags.indexOf(key) !== -1));
  if (!matching.length) return 0;
  let sum = 0;
  matching.forEach((c) => {
    const st = progress.cards[c.id];
    const box = st ? st.box : 1;
    sum += ((box - 1) / 4) * 100;
  });
  return Math.round(sum / matching.length);
}

export function recomputeMastery(progress, data) {
  if (!data) throw new Error('engine.recomputeMastery: data is required');
  progress.decks = {};
  Object.keys(DECKS).forEach((id) => { progress.decks[id] = { mastery: masteryFor(progress, id, data) }; });
  progress.tags = {};
  const tags = {};
  allCards(data).forEach((c) => { (c.tags || []).forEach((t) => { tags[t] = 1; }); });
  Object.keys(tags).forEach((t) => { progress.tags[t] = { mastery: masteryFor(progress, t, data) }; });
  return progress;
}

// Pure: returns a new progress object with the card graded + streak updated.
/** @returns {import('../data/types').Progress} */
export function recordResult(progress, card, correct, today) {
  if (today == null) today = dayNumber();
  const next = JSON.parse(JSON.stringify(progress));
  const prev = next.cards[card.id] || newState(today);
  next.cards[card.id] = grade(prev, correct, today);
  next.streak = updateStreak(next.streak, today);
  return next;
}

export function exportProgress(progress, data) {
  if (!progress) progress = loadProgress(data);
  const snap = JSON.parse(JSON.stringify(progress)); // never mutate the caller's object
  recomputeMastery(snap, data);
  return JSON.stringify(snap, null, 2);
}

/**
 * @param {string} json
 * @param {Set<string>} validIds
 * @returns {import('../data/types').Progress | null}
 */
export function importProgress(json, validIds) {
  let raw;
  try { raw = JSON.parse(json); } catch (e) { return null; }
  if (!raw || typeof raw !== 'object' || !raw.cards || typeof raw.cards !== 'object') return null;
  return migrateProgress(raw, validIds);
}

// ---------------- pure UI-mode helpers (used by Phase 3 components) ----------------
// Reason-bearing decks: past the beginner boxes the learner PRODUCES the pour + the
// one reason out loud, reveals, then self-rates (spec §6). Everything before box 3
// (and every non-reason deck) keeps the prior mc/typed/scenario/flip behaviour.
export const REASON_DECKS = new Set(['translator', 'pairing', 'cocktail-pairing', 'wine-dish', 'upsell']);
export function modeForBox(card, box) {
  if (card.kind === 'pronounce') return 'flip';
  // Reason decks PRODUCE at box>=3 even when the card is discriminate (upsell,
  // cocktail-pairing) — the priority floor skills are spoken, not recognised (spec §6/§7).
  if (REASON_DECKS.has(card.deck) && box >= 3) return 'produce';
  if (card.kind === 'discriminate') return 'mc';
  if (box <= 2) return 'mc';
  if (box >= 5) return 'scenario';
  return 'typed';
}

// Guidance scaffolding that fades as expertise grows (worked-example / expertise-
// reversal effect, spec §3): boxes 1-2 a labelled "Worked example" (pronounce cards
// a "Memory hook"), 3-4 a lighter "Why it works", box 5 removes it entirely.
export function whyDisplay(card, box) {
  if (box >= 5 || !card.why) return { label: '', text: '' };
  const label = card.kind === 'pronounce' ? 'Memory hook' : (box <= 2 ? 'Worked example' : 'Why it works');
  return { label: label, text: card.why };
}
