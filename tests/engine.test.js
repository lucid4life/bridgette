"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

// Load the classic-script modules into a faked window, the same way
// tests/check_training.py does. No DOM, so training.js must guard its init().
global.window = {};
const SRC = path.join(__dirname, "..", "src");
eval(fs.readFileSync(path.join(SRC, "data.js"), "utf8"));
eval(fs.readFileSync(path.join(SRC, "training.js"), "utf8"));
const T = global.window.BB.training;
const DATA = global.window.BB.data;

test("dayNumber: same calendar day is equal, next day is +1", () => {
  const a = T.dayNumber(new Date(2026, 5, 5, 9, 0, 0));   // Jun 5 2026 09:00 local
  const b = T.dayNumber(new Date(2026, 5, 5, 23, 30, 0)); // Jun 5 2026 23:30 local
  const c = T.dayNumber(new Date(2026, 5, 6, 1, 0, 0));   // Jun 6 2026 01:00 local
  assert.strictEqual(a, b, "same day → same integer");
  assert.strictEqual(c, a + 1, "next day → +1");
});

function freshState() { return { box: 1, due: 0, lastSeen: 0, correct: 0, wrong: 0, consecutiveWrong: 0 }; }

test("grade correct: promotes one box and sets due by BOX_DUE_DAYS", () => {
  const s = T.grade(freshState(), true, 100);
  assert.strictEqual(s.box, 2);
  assert.strictEqual(s.correct, 1);
  assert.strictEqual(s.consecutiveWrong, 0);
  assert.strictEqual(s.due, 100 + T.BOX_DUE_DAYS[2]); // 100 + 1
  assert.strictEqual(s.lastSeen, 100);
});

test("grade correct: box caps at 5", () => {
  let s = { box: 5, due: 0, lastSeen: 0, correct: 9, wrong: 0, consecutiveWrong: 0 };
  s = T.grade(s, true, 200);
  assert.strictEqual(s.box, 5);
  assert.strictEqual(s.due, 200 + 14);
});

test("grade wrong (first miss): demotes ONE box, not a hard reset", () => {
  let s = { box: 4, due: 0, lastSeen: 0, correct: 3, wrong: 0, consecutiveWrong: 0 };
  s = T.grade(s, false, 50);
  assert.strictEqual(s.box, 3, "single miss demotes one box");
  assert.strictEqual(s.wrong, 1);
  assert.strictEqual(s.consecutiveWrong, 1);
  assert.strictEqual(s.due, 50 + T.BOX_DUE_DAYS[3]);
});

test("grade wrong twice in a row: resets to box 1 on the SECOND consecutive miss", () => {
  let s = { box: 4, due: 0, lastSeen: 0, correct: 0, wrong: 0, consecutiveWrong: 0 };
  s = T.grade(s, false, 10);  // box 3, consecutiveWrong 1
  s = T.grade(s, false, 11);  // second miss -> box 1
  assert.strictEqual(s.box, 1);
  assert.strictEqual(s.consecutiveWrong, 2);
  assert.strictEqual(s.due, 11 + T.BOX_DUE_DAYS[1]); // 11 + 0
});

test("grade: a correct answer clears the consecutive-wrong counter", () => {
  let s = { box: 3, due: 0, lastSeen: 0, correct: 0, wrong: 1, consecutiveWrong: 1 };
  s = T.grade(s, true, 5);
  assert.strictEqual(s.consecutiveWrong, 0);
  assert.strictEqual(s.box, 4);
});

test("grade: does not mutate the input state", () => {
  const s = freshState();
  const out = T.grade(s, true, 7);
  assert.strictEqual(s.box, 1, "input untouched");
  assert.notStrictEqual(out, s);
});

test("isDue: due when today >= due day", () => {
  assert.strictEqual(T.isDue({ due: 100 }, 100), true);
  assert.strictEqual(T.isDue({ due: 100 }, 101), true);
  assert.strictEqual(T.isDue({ due: 100 }, 99), false);
});

test("newState: a fresh card starts in box 1, due today", () => {
  const s = T.newState(42);
  assert.strictEqual(s.box, 1);
  assert.strictEqual(s.due, 42);
  assert.strictEqual(s.correct, 0);
  assert.strictEqual(s.wrong, 0);
  assert.strictEqual(s.consecutiveWrong, 0);
});

test("normalizeAnswer: lowercases, strips accents/punct/articles, collapses space", () => {
  assert.strictEqual(T.normalizeAnswer("Hiedler Löss"), "hiedler loss");
  assert.strictEqual(T.normalizeAnswer("  the St. John  Claret! "), "st john claret");
  assert.strictEqual(T.normalizeAnswer("Grüner Veltliner"), "gruner veltliner");
  assert.strictEqual(T.normalizeAnswer("A Pinot Grigio"), "pinot grigio");
});

test("gradeTyped: exact (normalized) match is correct", () => {
  const card = { answer: "Hiedler Löss", aliases: [] };
  assert.strictEqual(T.gradeTyped(card, "hiedler loss"), true);
  assert.strictEqual(T.gradeTyped(card, "Hiedler  Löss"), true);
});

test("gradeTyped: alias match is correct", () => {
  const card = { answer: "Wagner Stempel Weissburgunder", aliases: ["pinot blanc", "weissburgunder"] };
  assert.strictEqual(T.gradeTyped(card, "Pinot Blanc"), true);
  assert.strictEqual(T.gradeTyped(card, "weissburgunder"), true);
});

test("gradeTyped: a distinctive token subset matches (e.g. just the grape)", () => {
  const card = { answer: "Grüner Veltliner — Niederösterreich, Austria", aliases: [] };
  assert.strictEqual(T.gradeTyped(card, "gruner veltliner"), true);
});

test("gradeTyped: wrong answer is incorrect; empty input is incorrect", () => {
  const card = { answer: "St. John Claret", aliases: ["claret"] };
  assert.strictEqual(T.gradeTyped(card, "Blue Mountain Brut"), false);
  assert.strictEqual(T.gradeTyped(card, ""), false);
  assert.strictEqual(T.gradeTyped(card, "   "), false);
});

test("gradeTyped: a single short stopword-like token does not match", () => {
  const card = { answer: "Bindi Sergardi La Boncia", aliases: [] };
  assert.strictEqual(T.gradeTyped(card, "la"), false);
});

test("updateStreak: first ever study starts at 1", () => {
  const s = T.updateStreak({ current: 0, lastStudyDate: null }, 100);
  assert.deepStrictEqual(s, { current: 1, lastStudyDate: 100 });
});

test("updateStreak: studying again the same day does not change the count", () => {
  const s = T.updateStreak({ current: 3, lastStudyDate: 100 }, 100);
  assert.deepStrictEqual(s, { current: 3, lastStudyDate: 100 });
});

test("updateStreak: consecutive day increments", () => {
  const s = T.updateStreak({ current: 3, lastStudyDate: 100 }, 101);
  assert.deepStrictEqual(s, { current: 4, lastStudyDate: 101 });
});

test("updateStreak: ONE missed day is forgiven (grace) and still increments", () => {
  const s = T.updateStreak({ current: 3, lastStudyDate: 100 }, 102); // skipped day 101
  assert.deepStrictEqual(s, { current: 4, lastStudyDate: 102 });
});

test("updateStreak: two or more missed days resets to 1", () => {
  const s = T.updateStreak({ current: 9, lastStudyDate: 100 }, 103); // skipped 101 and 102
  assert.deepStrictEqual(s, { current: 1, lastStudyDate: 103 });
});

const DECK_IDS = ["translator", "wine-identity", "pronunciation", "pairing", "structure"];

test("generateDeck: each deck yields >=1 card with non-empty prompt+answer", () => {
  DECK_IDS.forEach(function (id) {
    const cards = T.generateDeck(id, DATA);
    assert.ok(cards.length >= 1, id + " produced no cards");
    cards.forEach(function (c) {
      assert.ok(c.prompt && c.prompt.trim(), id + " card has empty prompt: " + c.id);
      assert.ok(c.answer && c.answer.trim(), id + " card has empty answer: " + c.id);
      assert.strictEqual(c.deck, id);
      assert.ok(c.learnLink, id + " card missing learnLink: " + c.id);
    });
  });
});

test("allCards: ids are unique and follow <deck>:<item>:<type>", () => {
  const cards = T.allCards(DATA);
  const ids = cards.map(function (c) { return c.id; });
  assert.strictEqual(ids.length, new Set(ids).size, "duplicate card ids exist");
  ids.forEach(function (id) { assert.strictEqual(id.split(":").length, 3, "bad id shape: " + id); });
});

test("generateDeck: MC cards (recall/discriminate) include the answer among unique choices", () => {
  ["translator", "wine-identity", "pairing", "structure"].forEach(function (id) {
    T.generateDeck(id, DATA).forEach(function (c) {
      assert.ok(Array.isArray(c.choices) && c.choices.length >= 2, id + " missing choices: " + c.id);
      assert.ok(c.choices.indexOf(c.answer) !== -1, id + " choices omit answer: " + c.id);
      assert.strictEqual(c.choices.length, new Set(c.choices).size, id + " duplicate choices: " + c.id);
    });
  });
});

test("generateDeck pronunciation: flip cards carry audioText + lang, no choices", () => {
  const cards = T.generateDeck("pronunciation", DATA);
  cards.forEach(function (c) {
    assert.strictEqual(c.kind, "pronounce");
    assert.ok(c.audioText, "missing audioText: " + c.id);
    assert.ok(c.lang, "missing lang: " + c.id);
  });
});

test("generateDeck unknown id returns empty array", () => {
  assert.deepStrictEqual(T.generateDeck("nope", DATA), []);
});

function emptyProgress() { return { schema: 1, cards: {}, decks: {}, tags: {}, readiness: null, streak: { current: 0, lastStudyDate: null }, settings: {} }; }

test("buildSession Focus on a fresh deck: serves only NEW cards, capped at newCap", () => {
  const p = emptyProgress();
  const session = T.buildSession("translator", { data: DATA, progress: p, today: 1000 });
  assert.ok(session.length <= T.NEW_CAP, "fresh focus exceeds newCap: " + session.length);
  assert.ok(session.length >= 1);
  session.forEach(function (c) { assert.strictEqual(c.deck, "translator"); });
});

test("buildSession: total never exceeds sizeCap", () => {
  const p = emptyProgress();
  T.allCards(DATA).forEach(function (c) {
    p.cards[c.id] = { box: 2, due: 0, lastSeen: 0, correct: 1, wrong: 0, consecutiveWrong: 0 };
  });
  const session = T.buildSession(null, { data: DATA, progress: p, today: 1000 });
  assert.ok(session.length <= T.SIZE_CAP, "exceeds sizeCap: " + session.length);
});

test("buildSession: new cards are capped even when the session has room", () => {
  const p = emptyProgress(); // everything is new
  const session = T.buildSession(null, { data: DATA, progress: p, today: 1000 });
  const newCount = session.filter(function (c) { return !p.cards[c.id]; }).length;
  assert.ok(newCount <= T.NEW_CAP, "new cards exceed newCap: " + newCount);
});

test("buildSession: not-yet-due review cards are excluded", () => {
  const p = emptyProgress();
  T.allCards(DATA).forEach(function (c) { p.cards[c.id] = { box: 4, due: 5000, lastSeen: 0, correct: 3, wrong: 0, consecutiveWrong: 0 }; });
  const session = T.buildSession("structure", { data: DATA, progress: p, today: 1000 });
  assert.strictEqual(session.length, 0);
});

test("buildSession: weak (low-box) due cards are prioritized over higher-box due cards", () => {
  const p = emptyProgress();
  const cards = T.generateDeck("structure", DATA);
  cards.forEach(function (c, i) {
    p.cards[c.id] = { box: i === cards.length - 1 ? 1 : 4, due: 0, lastSeen: 0, correct: 0, wrong: i === cards.length - 1 ? 3 : 0, consecutiveWrong: 0 };
  });
  const session = T.buildSession("structure", { data: DATA, progress: p, today: 1000, sizeCap: 1 });
  assert.strictEqual(session.length, 1);
  assert.strictEqual(session[0].id, cards[cards.length - 1].id, "weakest card should come first");
});

test("migrateProgress: drops orphan card ids, keeps valid ones, sets schema", () => {
  const validIds = new Set(T.allCards(DATA).map(function (c) { return c.id; }));
  const someValid = T.allCards(DATA)[0].id;
  const dirty = { cards: { "dead:card:x": { box: 3, due: 0 }, [someValid]: { box: 4, due: 0 } } };
  const clean = T.migrateProgress(dirty, validIds);
  assert.strictEqual(clean.schema, 1);
  assert.ok(!clean.cards["dead:card:x"], "orphan kept");
  assert.strictEqual(clean.cards[someValid].box, 4, "valid state lost");
  assert.ok(clean.streak && "current" in clean.streak);
});

test("masteryFor: a deck with all cards in box 5 is 100, fresh deck is 0", () => {
  const p = emptyProgress();
  assert.strictEqual(T.masteryFor(p, "structure", DATA), 0);
  T.generateDeck("structure", DATA).forEach(function (c) { p.cards[c.id] = { box: 5, due: 0, lastSeen: 0, correct: 5, wrong: 0, consecutiveWrong: 0 }; });
  assert.strictEqual(T.masteryFor(p, "structure", DATA), 100);
});

test("masteryFor: works per tag too", () => {
  const p = emptyProgress();
  T.generateDeck("structure", DATA).forEach(function (c) {
    if (c.tags.indexOf("acidity") !== -1) p.cards[c.id] = { box: 3, due: 0, lastSeen: 0, correct: 2, wrong: 0, consecutiveWrong: 0 };
  });
  assert.strictEqual(T.masteryFor(p, "acidity", DATA), 50);
});

test("recordResult: grades a card, updates streak, persists state into progress", () => {
  const p = emptyProgress();
  const card = T.generateDeck("structure", DATA)[0];
  const out = T.recordResult(p, card, true, 1000);
  assert.strictEqual(out.cards[card.id].box, 2);
  assert.strictEqual(out.streak.current, 1);
  assert.strictEqual(out.streak.lastStudyDate, 1000);
});

test("exportProgress / importProgress round-trips the whole object", () => {
  const p = emptyProgress();
  const card = T.generateDeck("pairing", DATA)[0];
  const withState = T.recordResult(p, card, false, 500);
  const json = T.exportProgress(withState);
  const back = T.importProgress(json, new Set(T.allCards(DATA).map(function (c) { return c.id; })));
  assert.deepStrictEqual(back.cards, withState.cards);
  assert.deepStrictEqual(back.streak, withState.streak);
});

test("importProgress: rejects malformed JSON by returning null", () => {
  assert.strictEqual(T.importProgress("{not json", new Set()), null);
  assert.strictEqual(T.importProgress(JSON.stringify({ nope: true }), new Set()), null);
});

// --- code-review fixes ---

test("gradeTyped: rejects a verbose answer that merely embeds the target word(s)", () => {
  assert.strictEqual(T.gradeTyped({ answer: "Merlot", aliases: [] }, "cabernet merlot syrah whatever"), false);
  assert.strictEqual(T.gradeTyped({ answer: "Riesling", aliases: [] }, "this is probably the riesling i think"), false);
});

test("gradeTyped: still accepts the answer with a single extra qualifier word", () => {
  assert.strictEqual(T.gradeTyped({ answer: "Riesling", aliases: [] }, "german riesling"), true);
});

test("migrateProgress: normalizes a partial card state so it stays schedulable (no missing due)", () => {
  const clean = T.migrateProgress({ cards: { "x:y:z": { box: 3 } } }, new Set(["x:y:z"]));
  const st = clean.cards["x:y:z"];
  assert.strictEqual(typeof st.due, "number");
  assert.strictEqual(typeof st.lastSeen, "number");
  assert.strictEqual(st.correct, 0);
  assert.strictEqual(st.wrong, 0);
  assert.strictEqual(st.consecutiveWrong, 0);
  assert.strictEqual(st.box, 3);
  assert.strictEqual(typeof T.isDue(st, 999999), "boolean");
});

test("migrateProgress: clamps an out-of-range box into 1..5", () => {
  const clean = T.migrateProgress({ cards: { "a:b:c": { box: 99 }, "d:e:f": { box: 0 } } }, new Set(["a:b:c", "d:e:f"]));
  assert.ok(clean.cards["a:b:c"].box >= 1 && clean.cards["a:b:c"].box <= 5);
  assert.ok(clean.cards["d:e:f"].box >= 1 && clean.cards["d:e:f"].box <= 5);
});

test("whyDisplay: box 1-2 labels the explanation as a Worked example, box 3-4 as Why it works, box 5 fades it", () => {
  const recall = { kind: "recall", why: "acid cuts fat" };
  assert.deepStrictEqual(T.whyDisplay(recall, 1), { label: "Worked example", text: "acid cuts fat" });
  assert.deepStrictEqual(T.whyDisplay(recall, 2), { label: "Worked example", text: "acid cuts fat" });
  assert.deepStrictEqual(T.whyDisplay(recall, 3), { label: "Why it works", text: "acid cuts fat" });
  assert.deepStrictEqual(T.whyDisplay(recall, 4), { label: "Why it works", text: "acid cuts fat" });
  assert.deepStrictEqual(T.whyDisplay(recall, 5), { label: "", text: "" }); // faded at expert/production level
});

test("whyDisplay: pronounce cards show a Memory hook, also faded at box 5", () => {
  const p = { kind: "pronounce", why: "Löss = loess = chalky-crisp" };
  assert.deepStrictEqual(T.whyDisplay(p, 1), { label: "Memory hook", text: "Löss = loess = chalky-crisp" });
  assert.deepStrictEqual(T.whyDisplay(p, 4), { label: "Memory hook", text: "Löss = loess = chalky-crisp" });
  assert.deepStrictEqual(T.whyDisplay(p, 5), { label: "", text: "" });
});

test("whyDisplay: a card with no why is hidden at every box", () => {
  assert.deepStrictEqual(T.whyDisplay({ kind: "recall", why: "" }, 1), { label: "", text: "" });
  assert.deepStrictEqual(T.whyDisplay({ kind: "pronounce" }, 2), { label: "", text: "" });
});

test("exportProgress: does not mutate the input progress object", () => {
  const p = emptyProgress();
  const card = T.generateDeck("structure", DATA)[0];
  const withState = T.recordResult(p, card, true, 1000);
  const before = JSON.stringify(withState);
  T.exportProgress(withState);
  assert.strictEqual(JSON.stringify(withState), before, "exportProgress mutated its input");
});

// --- S4: Wine Identity reverse direction ---

test("genWineIdentity: yields BOTH forward (name->grape) and reverse (grape->name) cards", () => {
  const cards = T.generateDeck("wine-identity", DATA);
  const fwd = cards.filter(c => c.id.endsWith(":grape"));
  const rev = cards.filter(c => c.id.endsWith(":name"));
  assert.ok(fwd.length >= 1, "no forward cards");
  assert.strictEqual(rev.length, fwd.length, "one reverse card per forward card");
  rev.forEach(c => {
    assert.strictEqual(c.deck, "wine-identity");
    assert.ok(DATA.wines.some(w => w.name === c.answer), "reverse answer is not a wine name: " + c.id);
    assert.ok(Array.isArray(c.choices) && c.choices.indexOf(c.answer) !== -1, "reverse choices omit answer: " + c.id);
    assert.strictEqual(c.choices.length, new Set(c.choices).size, "reverse choices have a duplicate: " + c.id);
    assert.ok(c.learnLink, "reverse card missing learnLink: " + c.id);
  });
});

module.exports = { T, DATA };
