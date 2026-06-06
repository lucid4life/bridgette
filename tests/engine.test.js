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

module.exports = { T, DATA };
