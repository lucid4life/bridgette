"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

global.window = {};
const SRC = path.join(__dirname, "..", "src");
eval(fs.readFileSync(path.join(SRC, "data.js"), "utf8"));
eval(fs.readFileSync(path.join(SRC, "wineschool.js"), "utf8"));
const WS = global.window.BB.wineschool;
const DATA = global.window.BB.data;

test("deduce: white + high acid + low tannin clues → Grüner (Hiedler Löss) ranks first", () => {
  const out = WS.deduce(DATA.wines, { category: "White", acidity: "high", tannin: "low" });
  assert.ok(out.length > 0, "expected at least one match");
  assert.strictEqual(out[0].wine.id, "hiedler-loss");
  assert.strictEqual(out[0].exact, true, "all set clues should match for the top hit");
});

test("deduce: red + high tannin + high acid → Nebbiolo (Ca' del Baio) ranks first", () => {
  const out = WS.deduce(DATA.wines, { category: "Red", tannin: "high", acidity: "high" });
  assert.strictEqual(out[0].wine.id, "ca-del-baio-langhe");
});

test("deduce: no clues set → empty (nothing to deduce from)", () => {
  assert.deepStrictEqual(WS.deduce(DATA.wines, {}), []);
});

test("deduce: results are sorted by match count descending", () => {
  const out = WS.deduce(DATA.wines, { category: "Red", tannin: "high" });
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i - 1].matched >= out[i].matched, "non-increasing match counts");
  }
});

test("deduce: every returned row matched at least one clue", () => {
  const out = WS.deduce(DATA.wines, { category: "White", body: "medium" });
  assert.ok(out.every((r) => r.matched >= 1));
});

test("checkQuickCheck: returns true only for the correct index", () => {
  const lesson = { quickCheck: { q: "x", choices: ["a", "b", "c"], answer: 1 } };
  assert.strictEqual(WS.checkQuickCheck(lesson, 1), true);
  assert.strictEqual(WS.checkQuickCheck(lesson, 0), false);
  assert.strictEqual(WS.checkQuickCheck(lesson, 2), false);
});

test("data integrity: every lesson quickCheck.answer indexes a real choice", () => {
  DATA.lessons.forEach((l) => {
    const qc = l.quickCheck;
    assert.ok(qc && Array.isArray(qc.choices), `${l.id}: choices array`);
    assert.ok(Number.isInteger(qc.answer) && qc.answer >= 0 && qc.answer < qc.choices.length,
      `${l.id}: answer ${qc.answer} out of range`);
  });
});

test("every deck learnLink in training.js resolves to a real lesson id", () => {
  // guard: S4's cards deep-link into these lessons by id
  eval(fs.readFileSync(path.join(SRC, "training.js"), "utf8"));
  const T = global.window.BB.training;
  const lessonIds = new Set(DATA.lessons.map((l) => l.id));
  Object.keys(T.DECKS).forEach((deck) => {
    assert.ok(lessonIds.has(T.DECKS[deck].learnLink),
      `deck ${deck} learnLink ${T.DECKS[deck].learnLink} has no lesson`);
  });
});
