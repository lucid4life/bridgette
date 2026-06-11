// app/src/lib/engine/wineschool.js — ported pure deductive logic (ESM).
// Source: src/wineschool.js (the DOM rendering half is intentionally NOT ported).

// Dimensions a beginner can observe; "category" is colour/style, the rest are
// the 3-point low/medium/high structure axes (sweetness uses the dry scale).
export const DG_DIMS = ['category', 'acidity', 'body', 'tannin', 'sweetness'];

export function wineValue(wine, dim) {
  if (dim === 'category') return wine.category;
  return wine.structure ? wine.structure[dim] : undefined;
}

// Pure. clues: a subset of DG_DIMS -> value; empty/missing values are ignored.
// Returns rows {wine, matched, total, exact} for wines matching >=1 set clue,
// sorted by match count descending (stable, so ties keep list order).
export function deduce(wines, clues) {
  clues = clues || {};
  const active = DG_DIMS.filter((d) => clues[d]);
  if (!active.length) return [];
  const rows = [];
  (wines || []).forEach((w) => {
    let matched = 0;
    active.forEach((d) => {
      const wv = wineValue(w, d);
      if (wv != null && String(wv).toLowerCase() === String(clues[d]).toLowerCase()) matched++;
    });
    if (matched > 0) rows.push({ wine: w, matched, total: active.length, exact: matched === active.length });
  });
  rows.sort((a, b) => b.matched - a.matched);
  return rows;
}

export function checkQuickCheck(lesson, choiceIndex) {
  return !!lesson && !!lesson.quickCheck && choiceIndex === lesson.quickCheck.answer;
}
