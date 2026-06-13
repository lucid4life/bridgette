// Task C — persistence core: idb (`bb3`) + localStorage mirror (`bb3_progress_v1`),
// mutations, derived selectors. Spec: docs/handoffs/2026-06-11-v3-phase1-spec.md.
// fake-indexeddb backs the idb tests; a Map-backed shim stands in for localStorage.
import 'fake-indexeddb/auto';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { openDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newItemSrs, type ItemSrs } from '../srs/scheduler';
import {
  DB_NAME,
  MIRROR_KEY,
  _resetStore,
  completeUnit,
  confidentMisses,
  dayNumber,
  daysUntil,
  defaultState,
  dueItems,
  exportProgress,
  importProgress,
  introduceItem,
  loadProgress,
  newToday,
  rankCounts,
  recentActivity,
  recordReview,
  setExamTarget,
  shakyItems,
  type ItemRecord,
  type ProgressState
} from './store';

const T = new Date(2026, 5, 11, 15); // local Thu 2026-06-11 3pm
const TODAY = dayNumber(T);
const DAY = 86_400_000;

function lsShim(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    }
  } as Storage;
}

/** A known-good snapshot (streak zeroed so load-time tickStreak is a no-op). */
function sampleState(): ProgressState {
  const t = new Date(2026, 5, 10, 12);
  return {
    schema: 1,
    items: {
      'food:halibut': {
        srs: newItemSrs(t),
        lapses: 1,
        correct: 4,
        lastGrade: 'good',
        introducedDay: dayNumber(t)
      }
    },
    meta: {
      streak: { current: 0, lastDay: null, freezeUsedWeekOf: null },
      settings: { lessonsPerDay: 8 },
      unitDone: { 'stage1-mains': 'gate' },
      dayLog: { [dayNumber(t)]: { reviews: 4, newItems: 1 } }
    }
  };
}

/** Make every idb put throw — simulates iOS silently eating IndexedDB writes. */
function breakIdbPuts() {
  return vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
    throw new Error('idb write eaten');
  });
}

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory());
  vi.stubGlobal('localStorage', lsShim());
  _resetStore();
});

afterEach(() => {
  _resetStore();
  vi.unstubAllGlobals();
});

describe('loadProgress', () => {
  it('returns the fresh default state when nothing is stored', async () => {
    const s = await loadProgress(T);
    expect(s).toEqual({
      schema: 1,
      items: {},
      meta: {
        streak: { current: 0, lastDay: null, freezeUsedWeekOf: null },
        settings: { lessonsPerDay: 8 },
        unitDone: {},
        dayLog: {},
        writeSeq: 1 // bumped by the load-time persist
      }
    });
  });

  it('round-trips mutations through idb across sessions', async () => {
    const s1 = await loadProgress(T);
    await introduceItem(s1, 'food:gnocchi', T);
    await recordReview(s1, 'food:gnocchi', 'good', T);

    _resetStore(); // new session, same indexedDB
    const s2 = await loadProgress(T);
    expect(s2.items['food:gnocchi']).toEqual(s1.items['food:gnocchi']);
    expect(s2.meta.dayLog[TODAY]).toEqual({ reviews: 1, newItems: 1 });
  });

  it('mirrors a compact full-state snapshot to localStorage on every write', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'food:gnocchi', T);
    const raw = localStorage.getItem(MIRROR_KEY);
    expect(raw).toBeTruthy();
    const snap = JSON.parse(raw!) as ProgressState;
    expect(snap.schema).toBe(1);
    expect(snap.items['food:gnocchi']).toEqual(s.items['food:gnocchi']);
  });

  it('restores from the mirror when idb is empty, and writes it back to idb', async () => {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(sampleState()));
    const s1 = await loadProgress(T);
    expect(s1.items['food:halibut']).toEqual(sampleState().items['food:halibut']);
    expect(s1.meta.unitDone['stage1-mains']).toBe('gate');

    // proof of write-back: kill the mirror, reload from idb alone
    localStorage.removeItem(MIRROR_KEY);
    _resetStore();
    const s2 = await loadProgress(T);
    expect(s2.items['food:halibut']).toEqual(sampleState().items['food:halibut']);
    expect(s2.meta.unitDone['stage1-mains']).toBe('gate');
  });

  it('falls back to the mirror when idb data is corrupt, then heals idb', async () => {
    const s1 = await loadProgress(T);
    await introduceItem(s1, 'food:gnocchi', T); // good mirror + good idb
    _resetStore();

    const db = await openDB(DB_NAME, 1);
    await db.put('meta', 'garbage', 'meta'); // corrupt the meta record
    db.close();

    const s2 = await loadProgress(T);
    expect(s2.items['food:gnocchi']).toBeDefined();
    expect(s2.meta.settings.lessonsPerDay).toBe(8);

    localStorage.removeItem(MIRROR_KEY);
    _resetStore();
    const s3 = await loadProgress(T); // idb was healed from the mirror
    expect(s3.items['food:gnocchi']).toBeDefined();
  });

  it('ignores a corrupt mirror (bad JSON) without throwing', async () => {
    localStorage.setItem(MIRROR_KEY, '{not json');
    const s = await loadProgress(T);
    expect(s.items).toEqual({});
  });

  it('ignores a mirror with an unknown schema', async () => {
    localStorage.setItem(MIRROR_KEY, JSON.stringify({ ...sampleState(), schema: 2 }));
    const s = await loadProgress(T);
    expect(s.items).toEqual({});
  });

  it('works in-memory when indexedDB is unavailable (mirror still functions)', async () => {
    vi.stubGlobal('indexedDB', undefined);
    localStorage.setItem(MIRROR_KEY, JSON.stringify(sampleState()));
    const s = await loadProgress(T);
    expect(s.items['food:halibut']).toBeDefined();
    await introduceItem(s, 'food:gnocchi', T); // mutations must not throw
    expect(JSON.parse(localStorage.getItem(MIRROR_KEY)!).items['food:gnocchi']).toBeDefined();
  });

  it('survives with NO storage at all (SSR/node): in-memory, never throws', async () => {
    vi.stubGlobal('indexedDB', undefined);
    vi.stubGlobal('localStorage', undefined);
    const s = await loadProgress(T);
    await introduceItem(s, 'food:gnocchi', T);
    await recordReview(s, 'food:gnocchi', 'good', T);
    expect(s.items['food:gnocchi'].correct).toBe(1);
  });

  it('requests navigator.storage.persist() exactly once after load', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { storage: { persist } });
    await loadProgress(T);
    await loadProgress(T);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  // --- writeSeq: the fresher of idb/mirror wins at load --------------------

  it('prefers the newer mirror after a silent idb write failure, and heals idb to it', async () => {
    const s1 = await loadProgress(T);
    await introduceItem(s1, 'food:halibut', T); // idb + mirror in sync

    const put = breakIdbPuts();
    await recordReview(s1, 'food:halibut', 'good', T); // mirror gets the delta, idb does not
    put.mockRestore();

    _resetStore(); // new session: idb holds STALE-but-valid state, mirror is newer
    const s2 = await loadProgress(T);
    expect(s2.items['food:halibut'].correct).toBe(1); // the mirror's newer state won

    // proof of heal: kill the mirror, reload from idb alone
    localStorage.removeItem(MIRROR_KEY);
    _resetStore();
    const s3 = await loadProgress(T);
    expect(s3.items['food:halibut'].correct).toBe(1);
  });

  it('an older mirror does not roll back newer idb state (and is healed forward)', async () => {
    const s1 = await loadProgress(T);
    await introduceItem(s1, 'food:halibut', T);
    const staleMirror = localStorage.getItem(MIRROR_KEY)!; // snapshot before the review
    await recordReview(s1, 'food:halibut', 'good', T); // idb + mirror both advance
    localStorage.setItem(MIRROR_KEY, staleMirror); // mirror reverts (e.g. restored backup)

    _resetStore();
    const s2 = await loadProgress(T);
    expect(s2.items['food:halibut'].correct).toBe(1); // newer idb won
    const healed = JSON.parse(localStorage.getItem(MIRROR_KEY)!) as ProgressState;
    expect(healed.items['food:halibut'].correct).toBe(1); // mirror healed forward
  });

  it('corrupt idb with orphaned item rows + no mirror: ghosts never resurrect', async () => {
    const s1 = await loadProgress(T);
    await introduceItem(s1, 'food:ghost', T); // an item row lands in idb
    _resetStore();

    const db = await openDB(DB_NAME, 1);
    await db.delete('meta', 'meta'); // corrupt: rows exist, meta gone → read() is null
    db.close();
    localStorage.removeItem(MIRROR_KEY); // and no mirror to recover from

    const s2 = await loadProgress(T); // falls to the fresh default
    expect(s2.items).toEqual({});
    await introduceItem(s2, 'food:real', T); // first mutation after the bad load

    _resetStore();
    const s3 = await loadProgress(T); // load 2: the orphaned row must NOT win
    expect(Object.keys(s3.items)).toEqual(['food:real']);
  });

  it('a failed idb heal never leaves idb partial: the next successful write is the full state', async () => {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(sampleState())); // mirror-only state

    const put = breakIdbPuts();
    const s1 = await loadProgress(T); // heal-back to idb fails silently
    put.mockRestore(); // idb recovers
    await introduceItem(s1, 'food:gnocchi', T); // first write after recovery

    localStorage.removeItem(MIRROR_KEY);
    _resetStore();
    const s2 = await loadProgress(T); // idb alone must hold the FULL state
    expect(s2.items['food:halibut']).toBeDefined(); // not just the freshly written item
    expect(s2.items['food:gnocchi']).toBeDefined();
  });
});

describe('introduceItem', () => {
  it('creates the record via newItemSrs and stamps introducedDay', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'food:gnocchi', T);
    expect(s.items['food:gnocchi']).toEqual({
      srs: newItemSrs(T),
      lapses: 0,
      correct: 0,
      lastGrade: null,
      introducedDay: TODAY
    });
  });

  it('bumps dayLog.newItems and marks the day studied (streak)', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'food:gnocchi', T);
    expect(s.meta.dayLog[TODAY]).toEqual({ reviews: 0, newItems: 1 });
    expect(s.meta.streak).toEqual({ current: 1, lastDay: TODAY, freezeUsedWeekOf: null });
  });

  it('is idempotent for an already-introduced item', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'food:gnocchi', T);
    await introduceItem(s, 'food:gnocchi', T);
    expect(s.meta.dayLog[TODAY].newItems).toBe(1);
  });
});

describe('recordReview', () => {
  it("advances the srs, counts 'good' as correct, sets lastGrade, bumps reviews", async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'food:gnocchi', T);
    await recordReview(s, 'food:gnocchi', 'good', T);
    const r = s.items['food:gnocchi'];
    expect(r.srs.reps).toBe(1);
    expect(r.srs.due).toBeGreaterThan(T.getTime());
    expect(r.correct).toBe(1);
    expect(r.lapses).toBe(0);
    expect(r.lastGrade).toBe('good');
    expect(s.meta.dayLog[TODAY].reviews).toBe(1);
  });

  it("counts a lapse on 'again' for an already-introduced item (not correct)", async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'food:gnocchi', T);
    await recordReview(s, 'food:gnocchi', 'again', T);
    const r = s.items['food:gnocchi'];
    expect(r.lapses).toBe(1);
    expect(r.correct).toBe(0);
    expect(r.lastGrade).toBe('again');
  });

  it("counts 'hard' and 'easy' as correct", async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'a', T);
    await introduceItem(s, 'b', T);
    await recordReview(s, 'a', 'hard', T);
    await recordReview(s, 'b', 'easy', T);
    expect(s.items['a'].correct).toBe(1);
    expect(s.items['b'].correct).toBe(1);
  });

  it("auto-introduces an unseen item; its first 'again' is NOT a lapse; drill auto-introduce does not consume the lesson allowance", async () => {
    const s = await loadProgress(T);
    await recordReview(s, 'food:gnocchi', 'again', T);
    const r = s.items['food:gnocchi'];
    expect(r.introducedDay).toBe(TODAY);
    expect(r.lapses).toBe(0); // was not "already-introduced"
    expect(r.lastGrade).toBe('again');
    // newItems stays 0: the lessonsPerDay throttle paces the LESSON path only.
    // A drill pass (e.g. Romance over 41 dishes) auto-introduces via reviews
    // and must NOT eat the day's lesson allowance — the day still counts as
    // studied through `reviews`.
    expect(s.meta.dayLog[TODAY]).toEqual({ reviews: 1, newItems: 0 });
    expect(s.meta.streak.current).toBe(1); // the day is still a study day
  });

  it('marks the day studied and accumulates dayLog across reviews', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'food:gnocchi', T);
    await recordReview(s, 'food:gnocchi', 'good', T);
    await recordReview(s, 'food:gnocchi', 'good', new Date(T.getTime() + 60_000));
    expect(s.meta.dayLog[TODAY].reviews).toBe(2);
    expect(s.meta.streak.current).toBe(1);
  });
});

describe('completeUnit', () => {
  it('records the unit with how it was completed and persists', async () => {
    const s1 = await loadProgress(T);
    await completeUnit(s1, 'stage1-mains', 'gate');
    await completeUnit(s1, 'stage1-starters', 'test-out');
    expect(s1.meta.unitDone).toEqual({ 'stage1-mains': 'gate', 'stage1-starters': 'test-out' });

    _resetStore();
    const s2 = await loadProgress(T);
    expect(s2.meta.unitDone).toEqual({ 'stage1-mains': 'gate', 'stage1-starters': 'test-out' });
  });
});

// ---------------------------------------------------------------------------
// Derived selectors — pure & synchronous; states are hand-built.
// ---------------------------------------------------------------------------

function mkRec(srsOver: Partial<ItemSrs>, recOver: Partial<Omit<ItemRecord, 'srs'>> = {}): ItemRecord {
  return {
    srs: { ...newItemSrs(T), ...srsOver },
    lapses: 0,
    correct: 0,
    lastGrade: null,
    introducedDay: TODAY,
    ...recOver
  };
}

function withItems(items: Record<string, ItemRecord>): ProgressState {
  return { ...defaultState(), items };
}

describe('dueItems', () => {
  it('returns due items sorted most-overdue first; future items excluded', () => {
    const s = withItems({
      slightly: mkRec({ due: T.getTime() - DAY }),
      very: mkRec({ due: T.getTime() - 3 * DAY }),
      future: mkRec({ due: T.getTime() + DAY })
    });
    expect(dueItems(s, T)).toEqual(['very', 'slightly']);
  });

  it('includes items due exactly now and breaks due-ties by id', () => {
    const s = withItems({
      b: mkRec({ due: T.getTime() }),
      a: mkRec({ due: T.getTime() })
    });
    expect(dueItems(s, T)).toEqual(['a', 'b']);
  });

  it('is empty on an empty state', () => {
    expect(dueItems(defaultState(), T)).toEqual([]);
  });
});

describe('newToday', () => {
  it("counts the day's LESSON introductions (dayLog.newItems) for the local day of `now`", () => {
    const s = defaultState();
    s.meta.dayLog[TODAY] = { reviews: 5, newItems: 2 };
    s.meta.dayLog[TODAY - 1] = { reviews: 0, newItems: 1 };
    expect(newToday(s, T)).toBe(2);
    expect(newToday(s, new Date(T.getTime() - DAY))).toBe(1);
    expect(newToday(s, new Date(T.getTime() + DAY))).toBe(0); // no entry → 0
  });

  it('lesson introductions count; drill auto-introductions (recordReview on unseen) do not', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'food:gnocchi', T); // the learn flow
    await recordReview(s, 'food:halibut', 'good', T); // a romance-style drill grade
    expect(s.items['food:halibut']).toBeDefined(); // auto-introduced all the same
    expect(newToday(s, T)).toBe(1); // but only the lesson consumed the allowance
  });
});

describe('rankCounts', () => {
  it('tallies every introduced item under its rank', () => {
    const t = T.getTime();
    const s = withItems({
      fresh: mkRec({}), // reps 0 → new
      young: mkRec({ reps: 3, last_review: t, due: t + 1 * DAY }), // learning
      steady: mkRec({ reps: 3, last_review: t, due: t + 5 * DAY }), // solid
      locked: mkRec({ reps: 9, last_review: t, due: t + 20 * DAY }) // locked-in
    });
    expect(rankCounts(s)).toEqual({ new: 1, learning: 1, solid: 1, 'locked-in': 1 });
  });

  it('returns all zeros for an empty state', () => {
    expect(rankCounts(defaultState())).toEqual({ new: 0, learning: 0, solid: 0, 'locked-in': 0 });
  });
});

describe('shakyItems', () => {
  it('ranks by lapses desc and excludes never-lapsed items', () => {
    const s = withItems({
      solidA: mkRec({}, { lapses: 0 }),
      wobble: mkRec({}, { lapses: 1 }),
      shaky: mkRec({}, { lapses: 3 })
    });
    expect(shakyItems(s)).toEqual(['shaky', 'wobble']);
  });

  it('breaks lapse-ties by most-overdue first and honours the n limit', () => {
    const s = withItems({
      recent: mkRec({ due: T.getTime() - DAY }, { lapses: 2 }),
      ancient: mkRec({ due: T.getTime() - 5 * DAY }, { lapses: 2 }),
      worst: mkRec({ due: T.getTime() }, { lapses: 4 })
    });
    expect(shakyItems(s)).toEqual(['worst', 'ancient', 'recent']);
    expect(shakyItems(s, 2)).toEqual(['worst', 'ancient']);
  });
});

describe('cram target (§0c) — additive, persisted, survives reload', () => {
  it('setExamTarget stores the day and a reload reads it back', async () => {
    const s = await loadProgress(T);
    expect(s.meta.examTarget).toBeUndefined();
    await setExamTarget(s, TODAY + 3);
    expect(s.meta.examTarget).toBe(TODAY + 3);
    _resetStore();
    const reloaded = await loadProgress(T);
    expect(reloaded.meta.examTarget).toBe(TODAY + 3);
  });

  it('setExamTarget(null) clears it, and the cleared state survives reload', async () => {
    const s = await loadProgress(T);
    await setExamTarget(s, TODAY + 5);
    await setExamTarget(s, null);
    expect(s.meta.examTarget).toBeUndefined();
    _resetStore();
    const reloaded = await loadProgress(T);
    expect(reloaded.meta.examTarget).toBeUndefined();
  });

  it('daysUntil counts whole local days (today = 0, future positive, past negative)', () => {
    expect(daysUntil(TODAY, T)).toBe(0);
    expect(daysUntil(TODAY + 3, T)).toBe(3);
    expect(daysUntil(TODAY - 2, T)).toBe(-2);
  });

  it('the mirror carries examTarget (the iOS recovery path keeps the date)', async () => {
    const s = await loadProgress(T);
    await setExamTarget(s, TODAY + 1);
    const mirror = JSON.parse(localStorage.getItem(MIRROR_KEY)!) as ProgressState;
    expect(mirror.meta.examTarget).toBe(TODAY + 1);
  });
});

describe('sure/shaky confidence (§0c) + hypercorrection', () => {
  it('recordReview stores confidence when given, and leaves it unset otherwise', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'dish:a', T);
    await recordReview(s, 'dish:a', 'good', T); // no confidence
    expect(s.items['dish:a'].confidence).toBeUndefined();
    await recordReview(s, 'dish:a', 'again', T, 'sure');
    expect(s.items['dish:a'].confidence).toBe('sure');
  });

  it('confidentMisses = last review was a miss made while SURE (not shaky, not correct)', async () => {
    const s = await loadProgress(T);
    for (const id of ['sure-miss', 'shaky-miss', 'sure-hit']) await introduceItem(s, id, T);
    await recordReview(s, 'sure-miss', 'again', T, 'sure'); // confident miss ✓
    await recordReview(s, 'shaky-miss', 'again', T, 'shaky'); // a flagged miss — not it
    await recordReview(s, 'sure-hit', 'good', T, 'sure'); // confident but correct — not it
    expect(confidentMisses(s)).toEqual(['sure-miss']);
  });

  it('a confident miss clears once it is answered correctly again', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'dish:b', T);
    await recordReview(s, 'dish:b', 'again', T, 'sure');
    expect(confidentMisses(s)).toEqual(['dish:b']);
    await recordReview(s, 'dish:b', 'good', new Date(T.getTime() + 60_000), 'sure');
    expect(confidentMisses(s)).toEqual([]); // lastGrade is now 'good'
  });

  it('confidence survives a reload (mirror + idb carry the field)', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'dish:c', T);
    await recordReview(s, 'dish:c', 'again', T, 'sure');
    _resetStore();
    const reloaded = await loadProgress(T);
    expect(reloaded.items['dish:c'].confidence).toBe('sure');
    expect(confidentMisses(reloaded)).toEqual(['dish:c']);
  });

  it('confidentMisses respects the top-n cap', async () => {
    const s = await loadProgress(T);
    for (const id of ['m1', 'm2', 'm3']) {
      await introduceItem(s, id, T);
      await recordReview(s, id, 'again', T, 'sure');
    }
    expect(confidentMisses(s, 2)).toHaveLength(2);
  });
});

describe('recentActivity (§1c history)', () => {
  it('returns `days` chronological entries ending today, zero-filled', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'dish:a', T); // newItems +1 + reviews? introduce bumps newItems
    await recordReview(s, 'dish:a', 'good', T); // reviews +1 today
    const week = recentActivity(s, 7, T);
    expect(week).toHaveLength(7);
    expect(week[week.length - 1].day).toBe(TODAY); // today is last
    expect(week[0].day).toBe(TODAY - 6); // oldest is days-1 back
    const todayEntry = week[week.length - 1];
    expect(todayEntry.reviews).toBe(1);
    expect(todayEntry.newItems).toBe(1);
    // a day with no activity reports zeros
    expect(week[0]).toEqual({ day: TODAY - 6, reviews: 0, newItems: 0 });
  });

  it('reads activity recorded on earlier days at the right slot', async () => {
    const s = await loadProgress(T);
    const threeAgo = new Date(T.getTime() - 3 * DAY);
    await recordReview(s, 'dish:b', 'good', threeAgo);
    const week = recentActivity(s, 7, T);
    const slot = week.find((d) => d.day === TODAY - 3)!;
    expect(slot.reviews).toBe(1);
  });
});

describe('backup: export / import (§1B)', () => {
  it('exportProgress emits valid JSON of the current state', async () => {
    const s = await loadProgress(T);
    await introduceItem(s, 'dish:a', T);
    const json = exportProgress(s);
    const parsed = JSON.parse(json);
    expect(parsed.schema).toBe(1);
    expect(parsed.items['dish:a']).toBeDefined();
  });

  it('import → reload round-trips the backup and it wins the next load', async () => {
    // build a backup on one "device"
    const a = await loadProgress(T);
    await introduceItem(a, 'dish:halibut', T);
    await recordReview(a, 'dish:halibut', 'good', T);
    const backup = exportProgress(a);

    // a fresh device (cleared): import the backup, then reload
    _resetStore();
    localStorage.clear();
    vi.stubGlobal('indexedDB', new IDBFactory());
    const blank = await loadProgress(T);
    expect(blank.items['dish:halibut']).toBeUndefined();
    expect(await importProgress(backup)).toBe(true);
    _resetStore();
    const restored = await loadProgress(T);
    expect(restored.items['dish:halibut']).toBeDefined();
    expect(restored.items['dish:halibut'].correct).toBe(1);
  });

  it('rejects corrupt JSON and a wrong-schema object without writing', async () => {
    await loadProgress(T);
    expect(await importProgress('{not json')).toBe(false);
    expect(await importProgress(JSON.stringify({ schema: 2, items: {}, meta: {} }))).toBe(false);
  });
});

describe('import hardening: deep validation rejects corrupt-but-parseable backups (§1B)', () => {
  const base = () => ({
    schema: 1,
    items: {},
    meta: { streak: { current: 1, lastDay: 0, freezeUsedWeekOf: null }, settings: { lessonsPerDay: 8 }, unitDone: {}, dayLog: {} }
  });
  it('rejects a non-number streak.lastDay', async () => {
    const bad = base(); (bad.meta.streak as Record<string, unknown>).lastDay = {};
    expect(await importProgress(JSON.stringify(bad))).toBe(false);
  });
  it('rejects a dayLog entry whose counts are not numbers', async () => {
    const bad = base(); (bad.meta.dayLog as Record<string, unknown>)['7'] = { reviews: 'lots', newItems: 1 };
    expect(await importProgress(JSON.stringify(bad))).toBe(false);
  });
  it('rejects an unsafe item key (__proto__) — JSON.parse makes it an OWN key', async () => {
    // built as raw JSON so JSON.parse creates an own "__proto__" property (the
    // real import path); assigning obj['__proto__'] in JS would set the prototype.
    const rec = JSON.stringify({ srs: newItemSrs(T), lapses: 0, correct: 1, lastGrade: 'good', introducedDay: 0 });
    const json = `{"schema":1,"items":{"__proto__":${rec}},"meta":{"streak":{"current":1,"lastDay":0,"freezeUsedWeekOf":null},"settings":{"lessonsPerDay":8},"unitDone":{},"dayLog":{}}}`;
    expect(await importProgress(json)).toBe(false);
  });
  it('still accepts a clean, fully-typed backup', async () => {
    const good = base();
    (good.meta.dayLog as Record<string, unknown>)['0'] = { reviews: 3, newItems: 1 };
    (good.items as Record<string, unknown>)['dish:x'] = { srs: newItemSrs(T), lapses: 0, correct: 1, lastGrade: 'good', introducedDay: 0 };
    expect(await importProgress(JSON.stringify(good))).toBe(true);
  });
});
