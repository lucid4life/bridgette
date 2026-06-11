// Task C — v3's single source of progress truth (spec: docs/handoffs/2026-06-11-v3-phase1-spec.md).
// Pure-ish async persistence core: NO Svelte in here (the runes wrapper lives in
// progress.svelte.ts). Offline-first phone PWA:
//   - IndexedDB `bb3` via `idb` (stores: `items` keyed by itemId, `meta` single record)
//   - COMPACT full-state JSON mirrored to localStorage `bb3_progress_v1` on every
//     write — iOS has a history of eating IndexedDB, the mirror is the recovery path.
//   - Load order: idb first; if idb is empty/unavailable/corrupt but the mirror
//     exists, restore from the mirror and write it back to idb.
//   - SSR/test-safe: missing indexedDB/localStorage fall back to in-memory, never throw.
// FRESH START — no v2 progress import.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  isDue,
  newItemSrs,
  rankOf,
  reviewItem,
  type Grade,
  type ItemSrs,
  type Rank
} from '../srs/scheduler';

// ---------------------------------------------------------------------------
// State shape (all plain JSON)
// ---------------------------------------------------------------------------

export interface ItemRecord {
  srs: ItemSrs;
  lapses: number;
  correct: number;
  lastGrade: Grade | null;
  introducedDay: number; // dayNumber the item was introduced
}

export interface DayEntry {
  reviews: number;
  newItems: number;
}

export interface StreakState {
  current: number;
  lastDay: number | null; // last day counted into the streak (or freeze-bridged)
  freezeUsedWeekOf: number | null; // week-start dayNumber the weekly freeze was spent in
}

export type UnitDoneVia = 'gate' | 'test-out';

export interface ProgressMeta {
  streak: StreakState;
  settings: { lessonsPerDay: number };
  unitDone: Record<string, UnitDoneVia>;
  dayLog: Record<number, DayEntry>;
}

export interface ProgressState {
  schema: 1;
  items: Record<string, ItemRecord>;
  meta: ProgressMeta;
}

export const MIRROR_KEY = 'bb3_progress_v1';
export const DB_NAME = 'bb3';
const DB_VERSION = 1;
const META_KEY = 'meta';
const DAY_MS = 86_400_000;

export function defaultState(): ProgressState {
  return {
    schema: 1,
    items: {},
    meta: {
      streak: { current: 0, lastDay: null, freezeUsedWeekOf: null },
      settings: { lessonsPerDay: 8 },
      unitDone: {},
      dayLog: {}
    }
  };
}

// ---------------------------------------------------------------------------
// Day convention — whole days since epoch in LOCAL time
// ---------------------------------------------------------------------------

/** Whole days since 1970-01-01 in LOCAL time (DST-safe: built from calendar components). */
export function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

/** dayNumber of the Monday on/before `day` (epoch day 0 = a Thursday). */
export function weekStartOf(day: number): number {
  return day - ((((day + 3) % 7) + 7) % 7);
}

// ---------------------------------------------------------------------------
// Persistence backends — idb when available, in-memory otherwise
// ---------------------------------------------------------------------------

interface Bb3Db extends DBSchema {
  items: { key: string; value: ItemRecord };
  meta: { key: string; value: ProgressMeta };
}

interface Backend {
  read(): Promise<ProgressState | null>; // null = empty OR corrupt
  putItem(id: string, rec: ItemRecord): Promise<void>;
  putMeta(meta: ProgressMeta): Promise<void>;
  writeAll(state: ProgressState): Promise<void>;
  close(): void;
}

/**
 * Deep-copy to a plain object. Svelte 5 `$state` hands the wrapper a Proxy and
 * IndexedDB's structured clone throws DataCloneError on proxies — every value
 * crossing into a backend goes through here. State is small plain JSON by design.
 */
function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function isItemRecord(v: unknown): v is ItemRecord {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  const srs = r.srs as Record<string, unknown> | undefined;
  return (
    !!srs &&
    typeof srs === 'object' &&
    typeof srs.due === 'number' &&
    typeof r.lapses === 'number' &&
    typeof r.correct === 'number' &&
    typeof r.introducedDay === 'number'
  );
}

function isProgressState(v: unknown): v is ProgressState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  if (s.schema !== 1) return false;
  if (!s.items || typeof s.items !== 'object') return false;
  const m = s.meta as Record<string, unknown> | null | undefined;
  if (!m || typeof m !== 'object') return false;
  const streak = m.streak as Record<string, unknown> | undefined;
  if (!streak || typeof streak !== 'object' || typeof streak.current !== 'number') return false;
  const settings = m.settings as Record<string, unknown> | undefined;
  if (!settings || typeof settings !== 'object' || typeof settings.lessonsPerDay !== 'number')
    return false;
  if (!m.unitDone || typeof m.unitDone !== 'object') return false;
  if (!m.dayLog || typeof m.dayLog !== 'object') return false;
  return Object.values(s.items).every(isItemRecord);
}

function idbBackend(db: IDBPDatabase<Bb3Db>): Backend {
  return {
    async read() {
      const tx = db.transaction(['items', 'meta']);
      const itemStore = tx.objectStore('items');
      const [keys, vals, meta] = await Promise.all([
        itemStore.getAllKeys(),
        itemStore.getAll(),
        tx.objectStore('meta').get(META_KEY)
      ]);
      await tx.done;
      if (meta === undefined && keys.length === 0) return null; // empty
      const items: Record<string, ItemRecord> = {};
      keys.forEach((k, i) => (items[k] = vals[i]));
      const state = { schema: 1, items, meta } as ProgressState;
      return isProgressState(state) ? state : null; // corrupt → mirror fallback
    },
    async putItem(id, rec) {
      await db.put('items', rec, id);
    },
    async putMeta(meta) {
      await db.put('meta', meta, META_KEY);
    },
    async writeAll(state) {
      const tx = db.transaction(['items', 'meta'], 'readwrite');
      const itemStore = tx.objectStore('items');
      await itemStore.clear();
      for (const [id, rec] of Object.entries(state.items)) void itemStore.put(rec, id);
      void tx.objectStore('meta').put(state.meta, META_KEY);
      await tx.done;
    },
    close() {
      db.close();
    }
  };
}

function memoryBackend(): Backend {
  let snap: ProgressState | null = null;
  return {
    async read() {
      return snap ? plain(snap) : null;
    },
    async putItem(id, rec) {
      (snap ??= defaultState()).items[id] = rec;
    },
    async putMeta(meta) {
      (snap ??= defaultState()).meta = meta;
    },
    async writeAll(state) {
      snap = plain(state);
    },
    close() {
      snap = null;
    }
  };
}

let backend: Backend | null = null;
let storagePersistRequested = false;

async function getBackend(): Promise<Backend> {
  if (backend) return backend;
  if (typeof indexedDB !== 'undefined' && indexedDB) {
    try {
      const db = await openDB<Bb3Db>(DB_NAME, DB_VERSION, {
        upgrade(d) {
          if (!d.objectStoreNames.contains('items')) d.createObjectStore('items');
          if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
        }
      });
      backend = idbBackend(db);
      return backend;
    } catch {
      // idb unavailable/broken — in-memory keeps the session alive, mirror persists
    }
  }
  backend = memoryBackend();
  return backend;
}

/** Test/teardown hook: drop the cached backend (closing idb) + per-session flags. */
export function _resetStore(): void {
  backend?.close();
  backend = null;
  storagePersistRequested = false;
}

// --- localStorage mirror (best-effort; never throws) -----------------------

function readMirror(): ProgressState | null {
  try {
    const raw = globalThis.localStorage?.getItem(MIRROR_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isProgressState(parsed) ? parsed : null;
  } catch {
    return null; // absent, blocked, or corrupt JSON
  }
}

function writeMirror(state: ProgressState): void {
  try {
    globalThis.localStorage?.setItem(MIRROR_KEY, JSON.stringify(state));
  } catch {
    // quota/private-mode/SSR — idb (or memory) still holds the state
  }
}

/** Ask the browser to exempt our storage from eviction — once per session. */
function requestStoragePersist(): void {
  if (storagePersistRequested) return;
  storagePersistRequested = true;
  try {
    const nav = globalThis.navigator as Navigator | undefined;
    void nav?.storage?.persist?.()?.catch?.(() => {});
  } catch {
    // non-browser
  }
}

// --- write path -------------------------------------------------------------

/** Mirror first (the iOS safety net), then idb. Mutations never throw on persistence. */
async function persist(state: ProgressState, itemId?: string): Promise<void> {
  writeMirror(state);
  const b = await getBackend();
  try {
    if (itemId !== undefined && state.items[itemId]) {
      await b.putItem(itemId, plain(state.items[itemId]));
    }
    await b.putMeta(plain(state.meta));
  } catch {
    // idb write failed — the mirror above is the recovery path
  }
}

/** Persist meta + mirror without an item write (for wrapper-level tickStreak calls). */
export function persistMeta(state: ProgressState): Promise<void> {
  return persist(state);
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export async function loadProgress(now: Date = new Date()): Promise<ProgressState> {
  const b = await getBackend();
  let state: ProgressState | null = null;
  try {
    state = await b.read();
  } catch {
    state = null; // unreadable idb counts as corrupt
  }
  if (!state) {
    const mirrored = readMirror();
    if (mirrored) {
      state = mirrored;
      try {
        await b.writeAll(plain(mirrored)); // restore idb from the mirror
      } catch {
        // keep going — the mirror itself still exists
      }
    }
  }
  if (!state) state = defaultState();
  tickStreak(state, now); // a freeze may be spent (or a dead streak zeroed) at open
  await persist(state);
  requestStoragePersist();
  return state;
}

// ---------------------------------------------------------------------------
// Streak — one FREE freeze per calendar week (weeks start Monday)
// ---------------------------------------------------------------------------

function studiedOn(state: ProgressState, day: number): boolean {
  const e = state.meta.dayLog[day];
  return !!e && e.reviews + e.newItems > 0;
}

/**
 * Advance the streak to `now`. Call on load + after mutations (mutations do it
 * internally). Pure-sync on the state; callers persist.
 *
 * - A "study day" = any day with ≥1 review or new item.
 * - Consecutive study days extend `current`.
 * - Exactly ONE missed day is absorbed by the week's free freeze if unused
 *   (`freezeUsedWeekOf` = week-start dayNumber of the missed day; one per
 *   calendar week, Monday start): `lastDay` advances over the bridged day and
 *   the streak survives unchanged.
 * - A gap the freeze can't cover resets `current` to 0 (today's study then makes it 1).
 */
export function tickStreak(state: ProgressState, now: Date): void {
  const today = dayNumber(now);
  const st = state.meta.streak;
  const studiedToday = studiedOn(state, today);

  if (st.lastDay === null) {
    if (studiedToday) {
      st.current = 1;
      st.lastDay = today;
    }
    return;
  }
  if (today <= st.lastDay) return; // same day already counted (or clock moved backwards)

  let gap = today - st.lastDay - 1; // full days missed between lastDay and today
  if (gap === 1 && st.current > 0) {
    const missed = st.lastDay + 1;
    const week = weekStartOf(missed);
    if (st.freezeUsedWeekOf !== week) {
      st.freezeUsedWeekOf = week; // spend the freeze: the missed day is bridged
      st.lastDay = missed;
      gap = 0;
    }
  }
  if (gap > 0) st.current = 0; // unbridgeable gap — streak dies
  if (studiedToday) {
    st.current = gap > 0 ? 1 : st.current + 1;
    st.lastDay = today;
  }
}

// ---------------------------------------------------------------------------
// Mutations — mutate `state` in place, then persist (idb + mirror)
// ---------------------------------------------------------------------------

function bumpDay(state: ProgressState, day: number, field: keyof DayEntry): void {
  const entry = (state.meta.dayLog[day] ??= { reviews: 0, newItems: 0 });
  entry[field] += 1;
}

function introduceLocal(state: ProgressState, itemId: string, now: Date): ItemRecord {
  const rec: ItemRecord = {
    srs: newItemSrs(now),
    lapses: 0,
    correct: 0,
    lastGrade: null,
    introducedDay: dayNumber(now)
  };
  state.items[itemId] = rec;
  bumpDay(state, dayNumber(now), 'newItems');
  return rec;
}

/** Introduce a new item (no-op if already introduced). Marks the day studied. */
export async function introduceItem(state: ProgressState, itemId: string, now: Date): Promise<void> {
  if (state.items[itemId]) return; // idempotent
  introduceLocal(state, itemId, now);
  tickStreak(state, now);
  await persist(state, itemId);
}

/**
 * Record a graded review. 'again' on an already-introduced item counts a lapse;
 * any other grade counts correct. An unseen item is auto-introduced first (its
 * initial 'again' is NOT a lapse — it was never known). Marks the day studied.
 */
export async function recordReview(
  state: ProgressState,
  itemId: string,
  grade: Grade,
  now: Date
): Promise<void> {
  const existing = state.items[itemId];
  const rec = existing ?? introduceLocal(state, itemId, now);
  rec.srs = reviewItem(rec.srs, grade, now);
  if (grade === 'again') {
    if (existing) rec.lapses += 1;
  } else {
    rec.correct += 1;
  }
  rec.lastGrade = grade;
  bumpDay(state, dayNumber(now), 'reviews');
  tickStreak(state, now);
  await persist(state, itemId);
}

/** Mark a unit complete (via its gate session or a test-out). */
export async function completeUnit(
  state: ProgressState,
  unitId: string,
  via: UnitDoneVia
): Promise<void> {
  state.meta.unitDone[unitId] = via;
  await persist(state);
}

// ---------------------------------------------------------------------------
// Derived selectors — pure, synchronous, on the loaded state
// ---------------------------------------------------------------------------

/** Introduced items due ≤ now, most-overdue first (ties broken by id). */
export function dueItems(state: ProgressState, now: Date): string[] {
  return Object.entries(state.items)
    .filter(([, r]) => isDue(r.srs, now))
    .sort(([aId, a], [bId, b]) => a.srs.due - b.srs.due || (aId < bId ? -1 : 1))
    .map(([id]) => id);
}

/** Items introduced on the local day of `now` (feeds the lessonsPerDay throttle). */
export function newToday(state: ProgressState, now: Date): number {
  const today = dayNumber(now);
  return Object.values(state.items).filter((r) => r.introducedDay === today).length;
}

/** Rank histogram over introduced items. */
export function rankCounts(state: ProgressState): Record<Rank, number> {
  const counts: Record<Rank, number> = { new: 0, learning: 0, solid: 0, 'locked-in': 0 };
  for (const r of Object.values(state.items)) counts[rankOf(r.srs)] += 1;
  return counts;
}

/** Lapsed items, shakiest first: lapses desc, then most-overdue, then id. Top `n` if given. */
export function shakyItems(state: ProgressState, n?: number): string[] {
  const ranked = Object.entries(state.items)
    .filter(([, r]) => r.lapses > 0)
    .sort(
      ([aId, a], [bId, b]) =>
        b.lapses - a.lapses || a.srs.due - b.srs.due || (aId < bId ? -1 : 1)
    )
    .map(([id]) => id);
  return n === undefined ? ranked : ranked.slice(0, n);
}
