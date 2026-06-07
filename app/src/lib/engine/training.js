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
  structure: { label: 'Structure', learnLink: 'structure-words' }
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

function genTranslator(data) {
  const wineNames = data.wines.map((w) => w.name);
  return data.translator.map((t, i) => {
    const w = wineByName(data, t.bestGlass);
    return {
      id: 'translator:' + slug(t.ask) + ':ask',
      deck: 'translator', kind: 'recall',
      prompt: 'A guest asks for ' + t.ask + '. What’s your by-the-glass pour?',
      answer: t.bestGlass,
      why: t.phrase,
      choices: [t.bestGlass].concat(pickDistractors(wineNames, t.bestGlass, 3, i)),
      aliases: (w && w.aliases) ? w.aliases.slice() : [],
      scenario: 'A guest says “I usually drink ' + t.ask + '.” Name the by-the-glass pour and one sentence on why it fits.',
      learnLink: DECKS.translator.learnLink,
      tags: ['translator'].concat(w && w.tags ? w.tags : [])
    };
  });
}

function genWineIdentity(data) {
  const wineNames = data.wines.map((w) => w.name);
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
      choices: [w.name].concat(pickDistractors(wineNames, w.name, 3, i)),
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
  const wineNames = data.wines.map((w) => w.name);
  return data.foods.filter((f) => f.wine).map((f, i) => {
    const w = wineByName(data, f.wine);
    return {
      id: 'pairing:' + f.id + ':match',
      deck: 'pairing', kind: 'recall',
      prompt: 'A guest orders ' + f.name + '. Best by-the-glass — and why?',
      answer: f.wine,
      why: f.why || '',
      choices: [f.wine].concat(pickDistractors(wineNames, f.wine, 3, i)),
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

export function generateDeck(deckId, data) {
  if (!data) throw new Error('engine.generateDeck: data is required');
  switch (deckId) {
    case 'translator': return genTranslator(data);
    case 'wine-identity': return genWineIdentity(data);
    case 'pronunciation': return genPronunciation(data);
    case 'pairing': return genPairing(data);
    case 'structure': return genStructure(data);
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
    const cards = generateDeck(id, data);
    picked = picked.concat(shuffle(cards, rng).slice(0, perDeck));
  });
  return shuffle(picked, rng);
}

// Pure scorer. results: [{ card, correct }]. weakAreas exclude deck-name tags.
/** @returns {{ total:number, correct:number, score:number, weakAreas:string[], byDeck:Record<string,{total:number,correct:number}> }} */
export function scoreReadiness(results) {
  results = results || [];
  const isDeckTag = {};
  Object.keys(DECKS).forEach((id) => { isDeckTag[id] = 1; });
  const total = results.length;
  let correct = 0;
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
    if (r.correct) { correct += 1; return; }
    (card.tags || []).forEach((t) => { if (!isDeckTag[t]) miss[t] = (miss[t] || 0) + 1; });
  });
  const weakAreas = Object.keys(miss).sort((a, b) => (miss[b] - miss[a]) || (a < b ? -1 : a > b ? 1 : 0));
  return {
    total: total, correct: correct,
    score: total ? Math.round((correct / total) * 100) : 0,
    weakAreas: weakAreas, byDeck: byDeck
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
    streak: { current: 0, lastStudyDate: null },
    settings: { difficulty: 'adaptive', audio: true }
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
export function modeForBox(card, box) {
  if (card.kind === 'pronounce') return 'flip';
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
