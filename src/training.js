/* src/training.js — window.BB.training
 * Leitner engine (pure) + deck generators + progress persistence + Practice/Progress UI.
 * Classic script, no modules. DOM wiring is guarded so Node can load it for unit tests.
 */
(function () {
  "use strict";
  window.BB = window.BB || {};

  // ---- constants (spec §8 / research convergence) ----
  var BOX_DUE_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
  var NEW_CAP = 9;     // new cards per session (anti-burnout cap, separate from size)
  var SIZE_CAP = 18;   // total cards per session

  // ---- day math: local calendar day -> exact integer ordinal (DST-proof) ----
  function dayNumber(date) {
    date = date || new Date();
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  function clampBox(b) { return Math.max(1, Math.min(5, b)); }

  // Pure. Returns a NEW card state. `today` is a day integer (dayNumber()).
  function grade(state, correct, today) {
    var s = {
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

  var ARTICLES = { the: 1, a: 1, an: 1, le: 1, la: 1, les: 1, el: 1, il: 1, "of": 1, and: 1 };

  function normalizeAnswer(s) {
    s = String(s == null ? "" : s);
    s = s.normalize("NFKD").replace(/[̀-ͯ]/g, ""); // strip accents
    s = s.toLowerCase();
    s = s.replace(/[^a-z0-9\s]+/g, " ");      // drop punctuation
    var tokens = s.split(/\s+/).filter(function (t) { return t && !ARTICLES[t]; });
    return tokens.join(" ").trim();
  }

  function tokenSet(s) {
    var out = {};
    normalizeAnswer(s).split(" ").forEach(function (t) { if (t) out[t] = 1; });
    return out;
  }

  // Pure boolean. The UI still always offers an "I got it / I didn't" override.
  function gradeTyped(card, input) {
    var norm = normalizeAnswer(input);
    if (!norm) return false;
    var candidates = [card.answer].concat(card.aliases || []);
    for (var i = 0; i < candidates.length; i++) {
      var target = normalizeAnswer(candidates[i]);
      if (!target) continue;
      if (norm === target) return true;
      // token-subset: every meaningful token the learner typed appears in the target,
      // AND they covered a distinctive chunk (>=2 tokens, or the whole single-token target).
      var targetTokens = tokenSet(target);
      var inTokens = norm.split(" ");
      var covered = inTokens.length > 0 && inTokens.every(function (t) { return targetTokens[t]; });
      if (covered && (inTokens.length >= 2 || Object.keys(targetTokens).length === 1)) return true;
      // reverse: learner typed a superset that contains the full short target
      var allInputTokens = tokenSet(norm);
      var targetCovered = target.split(" ").every(function (t) { return allInputTokens[t]; });
      if (targetCovered) return true;
    }
    return false;
  }

  // Lenient streak: a single missed day (gap of 2) is forgiven; 2+ missed days reset.
  function updateStreak(streak, today) {
    var last = streak && streak.lastStudyDate;
    var current = (streak && streak.current) || 0;
    if (last == null) return { current: 1, lastStudyDate: today };
    var gap = today - last;
    if (gap === 0) return { current: current, lastStudyDate: last };
    if (gap <= 2) return { current: current + 1, lastStudyDate: today }; // gap 1 or 2 (grace)
    return { current: 1, lastStudyDate: today };
  }

  function isDue(state, today) {
    if (today == null) today = dayNumber();
    return today >= state.due;
  }

  function newState(today) {
    if (today == null) today = dayNumber();
    return { box: 1, due: today, lastSeen: today, correct: 0, wrong: 0, consecutiveWrong: 0 };
  }

  // Public API (filled in by later tasks).
  window.BB.training = {
    BOX_DUE_DAYS: BOX_DUE_DAYS,
    NEW_CAP: NEW_CAP,
    SIZE_CAP: SIZE_CAP,
    dayNumber: dayNumber,
    grade: grade,
    isDue: isDue,
    newState: newState,
    normalizeAnswer: normalizeAnswer,
    gradeTyped: gradeTyped,
    updateStreak: updateStreak
  };
})();
