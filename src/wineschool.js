/* src/wineschool.js — window.BB.wineschool
 * Wine School lessons (rendered from data.lessons[]) + beginner deductive-grid tool.
 * Classic script, no modules. DOM wiring is guarded so Node can load it for unit tests.
 */
(function () {
  "use strict";
  window.BB = window.BB || {};

  // Dimensions a beginner can observe; "category" is colour/style, the rest are
  // the 3-point low/medium/high structure axes (sweetness uses the dry scale).
  var DG_DIMS = ["category", "acidity", "body", "tannin", "sweetness"];

  function wineValue(wine, dim) {
    if (dim === "category") return wine.category;
    return wine.structure ? wine.structure[dim] : undefined;
  }

  // Pure. clues: a subset of DG_DIMS -> value; empty/missing values are ignored.
  // Returns rows {wine, matched, total, exact} for wines matching >=1 set clue,
  // sorted by match count descending (stable, so ties keep list order).
  function deduce(wines, clues) {
    clues = clues || {};
    var active = DG_DIMS.filter(function (d) { return clues[d]; });
    if (!active.length) return [];
    var rows = [];
    (wines || []).forEach(function (w) {
      var matched = 0;
      active.forEach(function (d) {
        var wv = wineValue(w, d);
        if (wv != null && String(wv).toLowerCase() === String(clues[d]).toLowerCase()) matched++;
      });
      if (matched > 0) rows.push({ wine: w, matched: matched, total: active.length, exact: matched === active.length });
    });
    rows.sort(function (a, b) { return b.matched - a.matched; });
    return rows;
  }

  function checkQuickCheck(lesson, choiceIndex) {
    return !!lesson && !!lesson.quickCheck && choiceIndex === lesson.quickCheck.answer;
  }

  function slug(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // ---- public API (rendering added in later tasks) ----
  window.BB.wineschool = {
    DG_DIMS: DG_DIMS,
    deduce: deduce,
    checkQuickCheck: checkQuickCheck,
    slug: slug,
    wineValue: wineValue
  };
})();
