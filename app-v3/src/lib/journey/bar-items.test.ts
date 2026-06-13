// Stage 3 — "Running drinks" (bar-arc) authored service items (service:bar-*).
// Facts sourced from the official Service Guide / Onboarding Package extracts
// (docs/handoffs/2026-06-10-service-extract.md §4/§9 + onboarding deep extract).
import { describe, expect, it } from 'vitest';
import { BAR_SERVICE_ITEMS } from './bar-items';
import { SERVICE_ITEMS } from './service-items';

const EXPECTED_IDS = [
  'service:bar-tray',
  'service:bar-garnish-right',
  'service:bar-romance-drink',
  'service:bar-glass-handling',
  'service:bar-inspect',
  'service:bar-coaster',
  'service:bar-no-verbal',
  'service:bar-id-25',
  'service:bar-taster',
  'service:bar-matinee',
  'service:bar-corkage',
  'service:bar-wine-reintro'
];

describe('bar service items: shape', () => {
  it('authors exactly the 12 locked ids, in module order', () => {
    expect(BAR_SERVICE_ITEMS.map((s) => s.id)).toEqual(EXPECTED_IDS);
  });

  it('ids are unique and disjoint from day-one service ids', () => {
    expect(new Set(BAR_SERVICE_ITEMS.map((s) => s.id)).size).toBe(12);
    const dayOne = new Set(SERVICE_ITEMS.map((s) => s.id));
    for (const s of BAR_SERVICE_ITEMS) expect(dayOne.has(s.id), s.id).toBe(false);
  });

  it.each(BAR_SERVICE_ITEMS.map((s) => [s.id, s] as const))(
    '%s has prompt, answer, 4 distinct choices (answer included), hint, why, title',
    (_id, s) => {
      expect(s.prompt.length).toBeGreaterThan(0);
      expect(s.answer.length).toBeGreaterThan(0);
      expect(s.hint.length).toBeGreaterThan(0);
      expect(s.why.length).toBeGreaterThan(0);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.choices.length).toBe(4);
      expect(new Set(s.choices).size).toBe(4);
      expect(s.choices.filter((c) => c === s.answer).length).toBe(1);
    }
  );
});

describe('bar service items: facts match the official extracts', () => {
  const byId = Object.fromEntries(BAR_SERVICE_ITEMS.map((s) => [s.id, s]));

  it('drinks run on a tray', () => {
    expect(byId['service:bar-tray'].answer.toLowerCase()).toContain('tray');
  });

  it('down on the right, garnish facing right', () => {
    const a = byId['service:bar-garnish-right'].answer.toLowerCase();
    expect(a).toContain('right');
    expect(a).toContain('garnish');
  });

  it('romance the drink: say the name at the proper seat', () => {
    const a = byId['service:bar-romance-drink'].answer.toLowerCase();
    expect(a).toContain('name');
    expect(a).toContain('seat');
  });

  it('glassware by the bottom or the stem, never the top', () => {
    const a = byId['service:bar-glass-handling'].answer.toLowerCase();
    expect(a).toContain('bottom');
    expect(a).toContain('stem');
    expect(a).toContain('never the top');
  });

  it('coaster for beers and crushed-ice cocktails', () => {
    const a = byId['service:bar-coaster'].answer.toLowerCase();
    expect(a).toContain('coaster');
    expect(a).toContain('crushed-ice');
  });

  it('no verbal bills — rung in before poured', () => {
    const a = byId['service:bar-no-verbal'].answer.toLowerCase();
    expect(a).toContain('verbal');
    expect(a).toContain('rung in');
  });

  it('ID anyone who appears under 25', () => {
    expect(byId['service:bar-id-25'].answer).toContain('25');
  });

  it('matinee runs 2–5pm, 50% off all drinks', () => {
    const a = byId['service:bar-matinee'].answer.toLowerCase();
    expect(a).toContain('2:00');
    expect(a).toContain('5:00');
    expect(a).toContain('50%');
  });

  it('corkage: max two 750ml bottles at $30, decanted', () => {
    const a = byId['service:bar-corkage'].answer.toLowerCase();
    expect(a).toContain('750ml');
    expect(a).toContain('$30');
    expect(a).toContain('decant');
  });

  it('every why cites its source rule (names the guide or package)', () => {
    for (const s of BAR_SERVICE_ITEMS) {
      expect(s.why, s.id).toMatch(/service guide|onboarding/i);
    }
  });
});
