import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { data } from '../data/index';
import golden from './__fixtures__/golden-progress.v1.json';

const validIds = new Set(T.allCards(data).map((c: any) => c.id));

describe('bb_progress_v1 migration (a real v1 user must not lose progress)', () => {
  it('uses the byte-exact localStorage key', () => {
    expect(T.STORAGE_KEY).toBe('bb_progress_v1');
  });

  it('preserves boxes + counters for every valid card', () => {
    const out = T.migrateProgress(golden, validIds);
    for (const [id, st] of Object.entries(golden.cards)) {
      if (id === 'DEAD:orphan:card') continue;
      expect(out.cards[id], 'lost valid card ' + id).toBeDefined();
      expect(out.cards[id].box).toBe((st as any).box);
      expect(out.cards[id].wrong).toBe((st as any).wrong);
      expect(out.cards[id].consecutiveWrong).toBe((st as any).consecutiveWrong);
      // scheduling fields must survive too — a regression that reset due/lastSeen
      // or zeroed correct would silently collapse a real user's whole schedule.
      expect(out.cards[id].due).toBe((st as any).due);
      expect(out.cards[id].lastSeen).toBe((st as any).lastSeen);
      expect(out.cards[id].correct).toBe((st as any).correct);
    }
  });

  it('drops orphan ids that no longer exist', () => {
    const out = T.migrateProgress(golden, validIds);
    expect(out.cards['DEAD:orphan:card']).toBeUndefined();
  });

  it('preserves the streak and the readiness record', () => {
    const out = T.migrateProgress(golden, validIds);
    expect(out.streak.current).toBe(6);
    expect(out.streak.lastStudyDate).toBe(20287);
    expect(out.readiness?.lastScore).toBe(78);
  });

  it('round-trips through export/import without losing card state', () => {
    const migrated = T.migrateProgress(golden, validIds);
    const json = T.exportProgress(migrated, data);
    const back = T.importProgress(json, validIds)!;
    expect(back.cards).toEqual(migrated.cards);
    expect(back.streak).toEqual(migrated.streak);
  });
});
