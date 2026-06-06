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

module.exports = { T, DATA };
