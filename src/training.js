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

  // Public API (filled in by later tasks).
  window.BB.training = {
    BOX_DUE_DAYS: BOX_DUE_DAYS,
    NEW_CAP: NEW_CAP,
    SIZE_CAP: SIZE_CAP,
    dayNumber: dayNumber
  };
})();
