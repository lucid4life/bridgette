import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { basicsIdSet } from './basics.js';
import { data } from '../data/index';

describe('Floor Basics soft gate in buildSession', () => {
  it('Smart Review draws ONLY basics cards when basicsOnly is on', () => {
    const progress = T.defaultProgress();
    const session = T.buildSession(null, { data, progress, basicsOnly: true, rng: () => 0 });
    const basics = basicsIdSet(data);
    expect(session.length).toBeGreaterThan(0);
    for (const c of session) expect(basics.has(c.id), `${c.id} not in basics`).toBe(true);
  });

  it('a Focus deck session is NOT filtered by basicsOnly (explicit choice)', () => {
    const progress = T.defaultProgress();
    const session = T.buildSession('mystery', { data, progress, basicsOnly: true });
    const basics = basicsIdSet(data);
    expect(session.length).toBeGreaterThan(0);
    // mystery cards aren't in the basics set, proving the gate only touches Smart Review
    expect(session.every((c) => !basics.has(c.id))).toBe(true);
  });

  it('reads basicsOnly from progress.settings when not passed in ctx', () => {
    const progress = T.defaultProgress();
    progress.settings.basicsOnly = true;
    const session = T.buildSession(null, { data, progress, rng: () => 0 });
    const basics = basicsIdSet(data);
    for (const c of session) expect(basics.has(c.id)).toBe(true);
  });
});

describe('basicsOnly migration default', () => {
  it('defaults ON for a brand-new (empty) profile', () => {
    const fresh = T.migrateProgress({ cards: {} }, new Set());
    expect(fresh.settings.basicsOnly).toBe(true);
  });

  it('defaults OFF for a profile that already has studied cards', () => {
    const validIds = new Set(T.allCards(data).map((c) => c.id));
    const someId = [...validIds][0];
    const existing = T.migrateProgress({ cards: { [someId]: { box: 3, due: 0, lastSeen: 0 } } }, validIds);
    expect(existing.settings.basicsOnly).toBe(false);
  });

  it('respects an explicitly saved value', () => {
    const explicit = T.migrateProgress({ cards: {}, settings: { basicsOnly: false } }, new Set());
    expect(explicit.settings.basicsOnly).toBe(false);
  });
});
