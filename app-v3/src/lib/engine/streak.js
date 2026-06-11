// app/src/lib/engine/streak.js — v2 forgiving-streak helpers (pure, spec §10).
// Source of truth is `studyDays` (sorted unique day-numbers). The engine's legacy
// streak.current is left intact; the UI derives its streak from here so it can
// offer a weekly goal + a SILENT freeze (a single missed day is forgiven, and a
// snowflake is shown AFTER the fact — never a fear popup).

/** Add a study day (idempotent), returning a new sorted, de-duplicated array. */
export function addStudyDay(days, today) {
  const set = new Set(Array.isArray(days) ? days.filter((d) => isFinite(d)).map(Number) : []);
  set.add(today);
  return Array.from(set).sort((a, b) => a - b);
}

/** Monday-anchored week start for a day-number (1970-01-01 = day 0 = Thursday). */
export function weekStart(day) {
  return day - (((day % 7) + 3 + 7) % 7); // Monday = 0
}

/**
 * Daily streak with a one-day grace (silent freeze). Counts the consecutive run
 * ending at the most recent study day; a single skipped day (gap of 2) is bridged
 * and flagged. The streak lapses only after 2+ missed days.
 * @returns {{count:number, protectedRecently:boolean}}
 */
export function dailyStreak(days, today) {
  const s = Array.isArray(days) ? Array.from(new Set(days.filter((d) => isFinite(d)))).sort((a, b) => a - b) : [];
  if (!s.length) return { count: 0, protectedRecently: false };
  const last = s[s.length - 1];
  if (today - last > 2) return { count: 0, protectedRecently: false }; // lapsed
  let count = 1;
  let protectedRecently = today - last === 2; // a grace is bridging the gap to today
  for (let i = s.length - 1; i > 0; i--) {
    const gap = s[i] - s[i - 1];
    if (gap === 1) count++;
    else if (gap === 2) { count++; if (i >= s.length - 2) protectedRecently = true; }
    else break;
  }
  return { count, protectedRecently };
}

/**
 * Weekly-goal streak: consecutive weeks (ending this week or last) in which the
 * learner studied >= target days. Built for shift workers who can't do daily.
 * @returns {{weeks:number, thisWeek:number, target:number}}
 */
export function weeklyStreak(days, today, target) {
  target = target && target > 0 ? target : 3;
  const set = Array.isArray(days) ? Array.from(new Set(days.filter((d) => isFinite(d)))) : [];
  if (!set.length) return { weeks: 0, thisWeek: 0, target };
  const byWeek = {};
  for (const d of set) { const w = weekStart(d); byWeek[w] = (byWeek[w] || 0) + 1; }
  const tw = weekStart(today);
  const thisWeek = byWeek[tw] || 0;
  let weeks = 0;
  const startW = thisWeek >= target ? tw : tw - 7; // count this week only if already met
  for (let cw = startW; (byWeek[cw] || 0) >= target; cw -= 7) weeks++;
  return { weeks, thisWeek, target };
}
