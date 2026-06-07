import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { data as DATA } from '../data/index';

function freshState() { return { box: 1, due: 0, lastSeen: 0, correct: 0, wrong: 0, consecutiveWrong: 0 }; }
function emptyProgress() {
  return { schema: 1, cards: {} as Record<string, any>, decks: {}, tags: {}, readiness: null, streak: { current: 0, lastStudyDate: null }, settings: {} };
}
const DECK_IDS = ['translator', 'wine-identity', 'pronunciation', 'pairing', 'structure'];

describe('engine', () => {
  it('dayNumber: same calendar day is equal, next day is +1', () => {
    const a = T.dayNumber(new Date(2026, 5, 5, 9, 0, 0));
    const b = T.dayNumber(new Date(2026, 5, 5, 23, 30, 0));
    const c = T.dayNumber(new Date(2026, 5, 6, 1, 0, 0));
    expect(a).toBe(b);
    expect(c).toBe(a + 1);
  });

  it('grade correct: promotes one box and sets due by BOX_DUE_DAYS', () => {
    const s = T.grade(freshState(), true, 100);
    expect(s.box).toBe(2);
    expect(s.correct).toBe(1);
    expect(s.consecutiveWrong).toBe(0);
    expect(s.due).toBe(100 + T.BOX_DUE_DAYS[2]);
    expect(s.lastSeen).toBe(100);
  });

  it('grade correct: box caps at 5', () => {
    let s: any = { box: 5, due: 0, lastSeen: 0, correct: 9, wrong: 0, consecutiveWrong: 0 };
    s = T.grade(s, true, 200);
    expect(s.box).toBe(5);
    expect(s.due).toBe(200 + 14);
  });

  it('grade wrong (first miss): demotes ONE box, not a hard reset', () => {
    let s: any = { box: 4, due: 0, lastSeen: 0, correct: 3, wrong: 0, consecutiveWrong: 0 };
    s = T.grade(s, false, 50);
    expect(s.box).toBe(3);
    expect(s.wrong).toBe(1);
    expect(s.consecutiveWrong).toBe(1);
    expect(s.due).toBe(50 + T.BOX_DUE_DAYS[3]);
  });

  it('grade wrong twice in a row: resets to box 1 on the SECOND consecutive miss', () => {
    let s: any = { box: 4, due: 0, lastSeen: 0, correct: 0, wrong: 0, consecutiveWrong: 0 };
    s = T.grade(s, false, 10);
    s = T.grade(s, false, 11);
    expect(s.box).toBe(1);
    expect(s.consecutiveWrong).toBe(2);
    expect(s.due).toBe(11 + T.BOX_DUE_DAYS[1]);
  });

  it('grade: a correct answer clears the consecutive-wrong counter', () => {
    let s: any = { box: 3, due: 0, lastSeen: 0, correct: 0, wrong: 1, consecutiveWrong: 1 };
    s = T.grade(s, true, 5);
    expect(s.consecutiveWrong).toBe(0);
    expect(s.box).toBe(4);
  });

  it('grade: does not mutate the input state', () => {
    const s = freshState();
    const out = T.grade(s, true, 7);
    expect(s.box).toBe(1);
    expect(out).not.toBe(s);
  });

  it('isDue: due when today >= due day', () => {
    expect(T.isDue({ due: 100 }, 100)).toBe(true);
    expect(T.isDue({ due: 100 }, 101)).toBe(true);
    expect(T.isDue({ due: 100 }, 99)).toBe(false);
  });

  it('newState: a fresh card starts in box 1, due today', () => {
    const s = T.newState(42);
    expect(s.box).toBe(1);
    expect(s.due).toBe(42);
    expect(s.correct).toBe(0);
    expect(s.wrong).toBe(0);
    expect(s.consecutiveWrong).toBe(0);
  });

  it('normalizeAnswer: lowercases, strips accents/punct/articles, collapses space', () => {
    expect(T.normalizeAnswer('Hiedler Löss')).toBe('hiedler loss');
    expect(T.normalizeAnswer('  the St. John  Claret! ')).toBe('st john claret');
    expect(T.normalizeAnswer('Grüner Veltliner')).toBe('gruner veltliner');
    expect(T.normalizeAnswer('A Pinot Grigio')).toBe('pinot grigio');
  });

  it('gradeTyped: exact (normalized) match is correct', () => {
    const card = { answer: 'Hiedler Löss', aliases: [] };
    expect(T.gradeTyped(card, 'hiedler loss')).toBe(true);
    expect(T.gradeTyped(card, 'Hiedler  Löss')).toBe(true);
  });

  it('gradeTyped: alias match is correct', () => {
    const card = { answer: 'Wagner-Stempel Weissburgunder', aliases: ['pinot blanc', 'weissburgunder'] };
    expect(T.gradeTyped(card, 'Pinot Blanc')).toBe(true);
    expect(T.gradeTyped(card, 'weissburgunder')).toBe(true);
  });

  it('gradeTyped: a distinctive token subset matches (e.g. just the grape)', () => {
    const card = { answer: 'Grüner Veltliner — Niederösterreich, Austria', aliases: [] };
    expect(T.gradeTyped(card, 'gruner veltliner')).toBe(true);
  });

  it('gradeTyped: wrong answer is incorrect; empty input is incorrect', () => {
    const card = { answer: 'St. John Claret', aliases: ['claret'] };
    expect(T.gradeTyped(card, 'Blue Mountain Brut')).toBe(false);
    expect(T.gradeTyped(card, '')).toBe(false);
    expect(T.gradeTyped(card, '   ')).toBe(false);
  });

  it('gradeTyped: a single short stopword-like token does not match', () => {
    const card = { answer: 'Bindi Sergardi La Boncia', aliases: [] };
    expect(T.gradeTyped(card, 'la')).toBe(false);
  });

  it('updateStreak: first ever study starts at 1', () => {
    expect(T.updateStreak({ current: 0, lastStudyDate: null }, 100)).toEqual({ current: 1, lastStudyDate: 100 });
  });

  it('updateStreak: studying again the same day does not change the count', () => {
    expect(T.updateStreak({ current: 3, lastStudyDate: 100 }, 100)).toEqual({ current: 3, lastStudyDate: 100 });
  });

  it('updateStreak: consecutive day increments', () => {
    expect(T.updateStreak({ current: 3, lastStudyDate: 100 }, 101)).toEqual({ current: 4, lastStudyDate: 101 });
  });

  it('updateStreak: ONE missed day is forgiven (grace) and still increments', () => {
    expect(T.updateStreak({ current: 3, lastStudyDate: 100 }, 102)).toEqual({ current: 4, lastStudyDate: 102 });
  });

  it('updateStreak: two or more missed days resets to 1', () => {
    expect(T.updateStreak({ current: 9, lastStudyDate: 100 }, 103)).toEqual({ current: 1, lastStudyDate: 103 });
  });

  it('generateDeck: each deck yields >=1 card with non-empty prompt+answer', () => {
    DECK_IDS.forEach((id) => {
      const cards = T.generateDeck(id, DATA);
      expect(cards.length >= 1, id + ' produced no cards').toBeTruthy();
      cards.forEach((c: any) => {
        expect(c.prompt && c.prompt.trim(), id + ' card has empty prompt: ' + c.id).toBeTruthy();
        expect(c.answer && c.answer.trim(), id + ' card has empty answer: ' + c.id).toBeTruthy();
        expect(c.deck).toBe(id);
        expect(c.learnLink, id + ' card missing learnLink: ' + c.id).toBeTruthy();
      });
    });
  });

  it('allCards: ids are unique and follow <deck>:<item>:<type>', () => {
    const cards = T.allCards(DATA);
    const ids = cards.map((c: any) => c.id);
    expect(ids.length).toBe(new Set(ids).size);
    ids.forEach((id: string) => { expect(id.split(':').length, 'bad id shape: ' + id).toBe(3); });
  });

  it('generateDeck: MC cards include the answer among unique choices', () => {
    ['translator', 'wine-identity', 'pairing', 'structure'].forEach((id) => {
      T.generateDeck(id, DATA).forEach((c: any) => {
        expect(Array.isArray(c.choices) && c.choices.length >= 2, id + ' missing choices: ' + c.id).toBeTruthy();
        expect(c.choices.indexOf(c.answer) !== -1, id + ' choices omit answer: ' + c.id).toBeTruthy();
        expect(c.choices.length).toBe(new Set(c.choices).size);
      });
    });
  });

  it('generateDeck pronunciation: flip cards carry audioText + lang, no choices', () => {
    const cards = T.generateDeck('pronunciation', DATA);
    cards.forEach((c: any) => {
      expect(c.kind).toBe('pronounce');
      expect(c.audioText, 'missing audioText: ' + c.id).toBeTruthy();
      expect(c.lang, 'missing lang: ' + c.id).toBeTruthy();
    });
  });

  it('generateDeck unknown id returns empty array', () => {
    expect(T.generateDeck('nope', DATA)).toEqual([]);
  });

  it('buildSession Focus on a fresh deck: serves only NEW cards, capped at newCap', () => {
    const p = emptyProgress();
    const session = T.buildSession('translator', { data: DATA, progress: p, today: 1000 });
    expect(session.length <= T.NEW_CAP, 'fresh focus exceeds newCap: ' + session.length).toBeTruthy();
    expect(session.length >= 1).toBeTruthy();
    session.forEach((c: any) => { expect(c.deck).toBe('translator'); });
  });

  it('buildSession: total never exceeds sizeCap', () => {
    const p = emptyProgress();
    T.allCards(DATA).forEach((c: any) => {
      p.cards[c.id] = { box: 2, due: 0, lastSeen: 0, correct: 1, wrong: 0, consecutiveWrong: 0 };
    });
    const session = T.buildSession(null, { data: DATA, progress: p, today: 1000 });
    expect(session.length <= T.SIZE_CAP, 'exceeds sizeCap: ' + session.length).toBeTruthy();
  });

  it('buildSession: new cards are capped even when the session has room', () => {
    const p = emptyProgress();
    const session = T.buildSession(null, { data: DATA, progress: p, today: 1000 });
    const newCount = session.filter((c: any) => !p.cards[c.id]).length;
    expect(newCount <= T.NEW_CAP, 'new cards exceed newCap: ' + newCount).toBeTruthy();
  });

  it('buildSession: not-yet-due review cards are excluded', () => {
    const p = emptyProgress();
    T.allCards(DATA).forEach((c: any) => { p.cards[c.id] = { box: 4, due: 5000, lastSeen: 0, correct: 3, wrong: 0, consecutiveWrong: 0 }; });
    const session = T.buildSession('structure', { data: DATA, progress: p, today: 1000 });
    expect(session.length).toBe(0);
  });

  it('buildSession: weak (low-box) due cards are prioritized over higher-box due cards', () => {
    const p = emptyProgress();
    const cards = T.generateDeck('structure', DATA);
    cards.forEach((c: any, i: number) => {
      p.cards[c.id] = { box: i === cards.length - 1 ? 1 : 4, due: 0, lastSeen: 0, correct: 0, wrong: i === cards.length - 1 ? 3 : 0, consecutiveWrong: 0 };
    });
    const session = T.buildSession('structure', { data: DATA, progress: p, today: 1000, sizeCap: 1 });
    expect(session.length).toBe(1);
    expect(session[0].id, 'weakest card should come first').toBe(cards[cards.length - 1].id);
  });

  it('buildSession Smart Review: fresh new cards interleave across decks (not all one deck)', () => {
    let seed = 0x9e3779b9;
    const rng = function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const session = T.buildSession(null, { data: DATA, progress: T.defaultProgress(), today: 1000, rng: rng });
    expect(session.length >= 2, 'smart review should serve cards').toBeTruthy();
    const decks = new Set(session.map((c: any) => c.deck));
    expect(decks.size >= 2, 'Smart Review new cards should span >=2 decks, got: ' + Array.from(decks).join()).toBeTruthy();
  });

  it('migrateProgress: drops orphan card ids, keeps valid ones, sets schema', () => {
    const validIds = new Set(T.allCards(DATA).map((c: any) => c.id));
    const someValid = T.allCards(DATA)[0].id;
    const dirty = { cards: { 'dead:card:x': { box: 3, due: 0 }, [someValid]: { box: 4, due: 0 } } };
    const clean = T.migrateProgress(dirty, validIds);
    expect(clean.schema).toBe(1);
    expect(!clean.cards['dead:card:x'], 'orphan kept').toBeTruthy();
    expect(clean.cards[someValid].box, 'valid state lost').toBe(4);
    expect(clean.streak && 'current' in clean.streak).toBeTruthy();
  });

  it('masteryFor: a deck with all cards in box 5 is 100, fresh deck is 0', () => {
    const p = emptyProgress();
    expect(T.masteryFor(p, 'structure', DATA)).toBe(0);
    T.generateDeck('structure', DATA).forEach((c: any) => { p.cards[c.id] = { box: 5, due: 0, lastSeen: 0, correct: 5, wrong: 0, consecutiveWrong: 0 }; });
    expect(T.masteryFor(p, 'structure', DATA)).toBe(100);
  });

  it('masteryFor: works per tag too', () => {
    const p = emptyProgress();
    T.generateDeck('structure', DATA).forEach((c: any) => {
      if (c.tags.indexOf('acidity') !== -1) p.cards[c.id] = { box: 3, due: 0, lastSeen: 0, correct: 2, wrong: 0, consecutiveWrong: 0 };
    });
    expect(T.masteryFor(p, 'acidity', DATA)).toBe(50);
  });

  it('recordResult: grades a card, updates streak, persists state into progress', () => {
    const p = emptyProgress();
    const card = T.generateDeck('structure', DATA)[0];
    const out = T.recordResult(p, card, true, 1000);
    expect(out.cards[card.id].box).toBe(2);
    expect(out.streak.current).toBe(1);
    expect(out.streak.lastStudyDate).toBe(1000);
  });

  it('exportProgress / importProgress round-trips the whole object', () => {
    const p = emptyProgress();
    const card = T.generateDeck('pairing', DATA)[0];
    const withState = T.recordResult(p, card, false, 500);
    const json = T.exportProgress(withState, DATA);
    const back = T.importProgress(json, new Set(T.allCards(DATA).map((c: any) => c.id)))!;
    expect(back.cards).toEqual(withState.cards);
    expect(back.streak).toEqual(withState.streak);
  });

  it('importProgress: rejects malformed JSON by returning null', () => {
    expect(T.importProgress('{not json', new Set())).toBe(null);
    expect(T.importProgress(JSON.stringify({ nope: true }), new Set())).toBe(null);
  });

  it('gradeTyped: rejects a verbose answer that merely embeds the target word(s)', () => {
    expect(T.gradeTyped({ answer: 'Merlot', aliases: [] }, 'cabernet merlot syrah whatever')).toBe(false);
    expect(T.gradeTyped({ answer: 'Riesling', aliases: [] }, 'this is probably the riesling i think')).toBe(false);
  });

  it('gradeTyped: still accepts the answer with a single extra qualifier word', () => {
    expect(T.gradeTyped({ answer: 'Riesling', aliases: [] }, 'german riesling')).toBe(true);
  });

  it('migrateProgress: normalizes a partial card state so it stays schedulable', () => {
    const clean = T.migrateProgress({ cards: { 'x:y:z': { box: 3 } } }, new Set(['x:y:z']));
    const st = clean.cards['x:y:z'];
    expect(typeof st.due).toBe('number');
    expect(typeof st.lastSeen).toBe('number');
    expect(st.correct).toBe(0);
    expect(st.wrong).toBe(0);
    expect(st.consecutiveWrong).toBe(0);
    expect(st.box).toBe(3);
    expect(typeof T.isDue(st, 999999)).toBe('boolean');
  });

  it('migrateProgress: clamps an out-of-range box into 1..5', () => {
    const clean = T.migrateProgress({ cards: { 'a:b:c': { box: 99 }, 'd:e:f': { box: 0 } } }, new Set(['a:b:c', 'd:e:f']));
    expect(clean.cards['a:b:c'].box >= 1 && clean.cards['a:b:c'].box <= 5).toBeTruthy();
    expect(clean.cards['d:e:f'].box >= 1 && clean.cards['d:e:f'].box <= 5).toBeTruthy();
  });

  it('whyDisplay: box 1-2 = Worked example, 3-4 = Why it works, 5 fades it', () => {
    const recall = { kind: 'recall', why: 'acid cuts fat' };
    expect(T.whyDisplay(recall, 1)).toEqual({ label: 'Worked example', text: 'acid cuts fat' });
    expect(T.whyDisplay(recall, 2)).toEqual({ label: 'Worked example', text: 'acid cuts fat' });
    expect(T.whyDisplay(recall, 3)).toEqual({ label: 'Why it works', text: 'acid cuts fat' });
    expect(T.whyDisplay(recall, 4)).toEqual({ label: 'Why it works', text: 'acid cuts fat' });
    expect(T.whyDisplay(recall, 5)).toEqual({ label: '', text: '' });
  });

  it('whyDisplay: pronounce cards show a Memory hook, also faded at box 5', () => {
    const p = { kind: 'pronounce', why: 'Löss = loess = chalky-crisp' };
    expect(T.whyDisplay(p, 1)).toEqual({ label: 'Memory hook', text: 'Löss = loess = chalky-crisp' });
    expect(T.whyDisplay(p, 4)).toEqual({ label: 'Memory hook', text: 'Löss = loess = chalky-crisp' });
    expect(T.whyDisplay(p, 5)).toEqual({ label: '', text: '' });
  });

  it('whyDisplay: a card with no why is hidden at every box', () => {
    expect(T.whyDisplay({ kind: 'recall', why: '' }, 1)).toEqual({ label: '', text: '' });
    expect(T.whyDisplay({ kind: 'pronounce' }, 2)).toEqual({ label: '', text: '' });
  });

  it('exportProgress: does not mutate the input progress object', () => {
    const p = emptyProgress();
    const card = T.generateDeck('structure', DATA)[0];
    const withState = T.recordResult(p, card, true, 1000);
    const before = JSON.stringify(withState);
    T.exportProgress(withState, DATA);
    expect(JSON.stringify(withState), 'exportProgress mutated its input').toBe(before);
  });

  it('genWineIdentity: yields BOTH forward (name->grape) and reverse (grape->name) cards', () => {
    const cards = T.generateDeck('wine-identity', DATA);
    const fwd = cards.filter((c: any) => c.id.endsWith(':grape'));
    const rev = cards.filter((c: any) => c.id.endsWith(':name'));
    expect(fwd.length >= 1, 'no forward cards').toBeTruthy();
    expect(rev.length).toBe(fwd.length);
    rev.forEach((c: any) => {
      expect(c.deck).toBe('wine-identity');
      expect(DATA.wines.some((w) => w.name === c.answer), 'reverse answer is not a wine name: ' + c.id).toBeTruthy();
      expect(Array.isArray(c.choices) && c.choices.indexOf(c.answer) !== -1, 'reverse choices omit answer: ' + c.id).toBeTruthy();
      expect(c.choices.length).toBe(new Set(c.choices).size);
      expect(c.learnLink, 'reverse card missing learnLink: ' + c.id).toBeTruthy();
    });
  });

  it('buildReadiness: samples across all five decks, capped per deck, interleaved', () => {
    const cards = T.buildReadiness(DATA, { perDeck: 2, rng: () => 0 });
    const ids = Object.keys(T.DECKS);
    const seen: Record<string, number> = {};
    cards.forEach((c: any) => { seen[c.deck] = (seen[c.deck] || 0) + 1; });
    ids.forEach((id) => {
      expect(seen[id] >= 1, 'readiness sample missing deck: ' + id).toBeTruthy();
      expect(seen[id] <= 2, 'readiness sample exceeded perDeck for: ' + id).toBeTruthy();
    });
    const again = T.buildReadiness(DATA, { perDeck: 2, rng: () => 0 });
    expect(again.map((c: any) => c.id)).toEqual(cards.map((c: any) => c.id));
  });

  it('scoreReadiness: percent + weak tags ranked by miss count, deck-name tags excluded', () => {
    const results = [
      { card: { deck: 'structure', tags: ['structure', 'acidity'] }, correct: false },
      { card: { deck: 'structure', tags: ['structure', 'acidity'] }, correct: false },
      { card: { deck: 'pairing', tags: ['pairing', 'steak'] }, correct: false },
      { card: { deck: 'translator', tags: ['translator', 'white'] }, correct: true }
    ];
    const s = T.scoreReadiness(results);
    expect(s.total).toBe(4);
    expect(s.correct).toBe(1);
    expect(s.score).toBe(25);
    expect(s.weakAreas).toEqual(['acidity', 'steak']);
    expect(s.byDeck.structure.total).toBe(2);
    expect(s.byDeck.structure.correct).toBe(0);
  });

  it('scoreReadiness: empty results -> 0% and no weak areas', () => {
    const s = T.scoreReadiness([]);
    expect(s.score).toBe(0);
    expect(s.weakAreas).toEqual([]);
  });

  it('recordReadiness: writes readiness summary, does not mutate input', () => {
    const p = emptyProgress();
    const scored = { score: 72, weakAreas: ['acidity', 'regions'], byDeck: { structure: { total: 3, correct: 2 } } };
    const out = T.recordReadiness(p, scored, 1234);
    expect(out.readiness!.lastScore).toBe(72);
    expect(out.readiness!.lastTaken).toBe(1234);
    expect(out.readiness!.weakAreas).toEqual(['acidity', 'regions']);
    expect(out.readiness!.byDeck).toEqual({ structure: { total: 3, correct: 2 } });
    expect(p.readiness, 'recordReadiness mutated its input').toBe(null);
  });

  it('recordReadiness: caps weakAreas at 8', () => {
    const many = [];
    for (let i = 0; i < 12; i++) many.push('t' + i);
    const out = T.recordReadiness(emptyProgress(), { score: 0, weakAreas: many, byDeck: {} }, 1);
    expect(out.readiness!.weakAreas.length).toBe(8);
  });

  it('genStructure: includes structure-recall cards with LMH choices', () => {
    const cards = T.generateDeck('structure', DATA);
    const recall = cards.filter((c: any) => /^structure:recall-/.test(c.id));
    expect(recall.length >= DATA.wines.length, 'expected at least one recall card per wine').toBeTruthy();
    recall.forEach((c: any) => {
      expect(c.deck).toBe('structure');
      expect(c.choices).toEqual(['low', 'medium', 'high']);
      expect(c.choices.indexOf(c.answer) !== -1, 'recall answer not among choices: ' + c.id).toBeTruthy();
      expect(c.learnLink, 'recall card missing learnLink: ' + c.id).toBeTruthy();
      expect(c.id.split(':').length, 'bad id shape: ' + c.id).toBe(3);
    });
  });

  it('genStructure recall: the recalled level matches the wine\'s actual structure value', () => {
    const cards = T.generateDeck('structure', DATA);
    DATA.wines.forEach((w) => {
      ['acidity', 'tannin', 'body'].forEach((attr) => {
        const id = 'structure:recall-' + attr + '-' + w.id + ':level';
        const c = cards.find((x: any) => x.id === id);
        expect(c, 'missing recall card: ' + id).toBeTruthy();
        expect(c.answer, 'wrong level for ' + id).toBe((w.structure as any)[attr]);
      });
    });
  });

  it('pronunciation cards carry a bare wineId that is a real wine id', () => {
    const cards = T.generateDeck('pronunciation', DATA);
    const wineIds = new Set(DATA.wines.map((w) => w.id));
    expect(cards.length > 0).toBeTruthy();
    for (const c of cards) {
      expect(c.wineId, 'card ' + c.id + ' missing wineId').toBeTruthy();
      expect(wineIds.has(c.wineId), 'wineId is not a real wine id: ' + c.wineId).toBeTruthy();
      expect(c.id).toBe('pronunciation:' + c.wineId + ':say');
    }
  });

  it('buildMysteryPour: 2 directions per wine, 4 unique MC choices incl. the answer', () => {
    const cards = T.generateDeck('mystery', DATA);
    expect(cards.length).toBe(DATA.wines.length * 2);
    cards.forEach((c: any) => {
      expect(c.deck).toBe('mystery');
      expect(c.kind).toBe('discriminate');
      expect(c.choices.length, 'mystery card lacks 4 choices: ' + c.id).toBe(4);
      expect(new Set(c.choices).size, 'mystery card has dup choices: ' + c.id).toBe(4);
      expect(c.choices.indexOf(c.answer) !== -1, 'mystery choices omit answer: ' + c.id).toBeTruthy();
      expect(c.id.split(':').length).toBe(3);
      expect(c.wineId).toBeTruthy();
    });
  });

  it('buildMysteryPour: name-direction distractors are real wine names (structurally adjacent)', () => {
    const names = new Set(DATA.wines.map((w) => w.name));
    T.generateDeck('mystery', DATA).filter((c: any) => c.id.endsWith(':name')).forEach((c: any) => {
      c.choices.forEach((ch: string) => expect(names.has(ch), 'not a wine name: ' + ch).toBeTruthy());
    });
  });

  it('buildMysteryPour is deterministic (same data → identical cards)', () => {
    expect(T.generateDeck('mystery', DATA)).toEqual(T.generateDeck('mystery', DATA));
  });
});
