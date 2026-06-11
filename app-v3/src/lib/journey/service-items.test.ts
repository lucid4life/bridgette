// Task D — Unit 0 "Day one" authored service items (service:* namespace).
// Facts sourced from the official Service Guide / Onboarding Package extracts
// (docs/handoffs/2026-06-10-service-extract.md §2-3 + onboarding deep extract).
import { describe, expect, it } from 'vitest';
import { SERVICE_ITEMS } from './service-items';

const EXPECTED_IDS = [
  'service:seat-1-left',
  'service:seat-1-middle',
  'service:seat-1-banquette',
  'service:seat-0-shared',
  'service:tables-bar-top',
  'service:tables-bar-tables',
  'service:tables-loft',
  'service:tables-east',
  'service:tables-west',
  'service:tables-pdr-patio',
  'service:no-auction',
  'service:romance-formula',
  'service:fifo-drinks',
  'service:priority-one',
  'service:allergy-every-item',
  'service:open-hand'
];

describe('service items: shape', () => {
  it('authors exactly the 16 locked ids, in path order', () => {
    expect(SERVICE_ITEMS.map((s) => s.id)).toEqual(EXPECTED_IDS);
  });

  it('ids are unique', () => {
    expect(new Set(SERVICE_ITEMS.map((s) => s.id)).size).toBe(16);
  });

  it.each(SERVICE_ITEMS.map((s) => [s.id, s] as const))(
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

describe('service items: facts match the official extracts', () => {
  const byId = Object.fromEntries(SERVICE_ITEMS.map((s) => [s.id, s]));

  it('seat 1 = your LEFT as you approach, clockwise', () => {
    expect(byId['service:seat-1-left'].answer.toLowerCase()).toContain('left');
    expect(byId['service:seat-1-left'].answer.toLowerCase()).toContain('clockwise');
  });

  it('shared dishes ring under seat 0', () => {
    expect(byId['service:seat-0-shared'].answer).toMatch(/seat 0/i);
  });

  it('table ranges are the real ones', () => {
    expect(byId['service:tables-bar-top'].answer).toContain('101');
    expect(byId['service:tables-bar-top'].answer).toContain('108');
    expect(byId['service:tables-bar-tables'].answer).toContain('121');
    expect(byId['service:tables-loft'].answer).toContain('131');
    expect(byId['service:tables-east'].answer).toContain('201');
    expect(byId['service:tables-east'].answer).toContain('221');
    expect(byId['service:tables-west'].answer).toContain('301');
    expect(byId['service:tables-west'].answer).toContain('321');
    expect(byId['service:tables-pdr-patio'].answer).toContain('401');
    expect(byId['service:tables-pdr-patio'].answer).toContain('141');
  });

  it('never auction; romance = name + 3 components', () => {
    expect(byId['service:no-auction'].answer.toLowerCase()).toContain('seat number');
    expect(byId['service:no-auction'].answer.toLowerCase()).toContain('auction');
    expect(byId['service:romance-formula'].answer).toMatch(/3 components/i);
    // the worked example from the guide rides along as the hint
    expect(byId['service:romance-formula'].hint.toLowerCase()).toContain('octopus');
  });

  it('FIFO + the one-minute rule; running is priority #1', () => {
    expect(byId['service:fifo-drinks'].answer.toLowerCase()).toContain('first');
    expect(byId['service:fifo-drinks'].answer.toLowerCase()).toContain('minute');
    expect(byId['service:priority-one'].answer.toLowerCase()).toContain('running');
  });

  it('allergy noted on every item that seat orders + shared seat-0 items', () => {
    const a = byId['service:allergy-every-item'].answer.toLowerCase();
    expect(a).toContain('every item');
    expect(a).toContain('seat 0');
  });

  it('open hand, never reach across a guest', () => {
    const a = byId['service:open-hand'].answer.toLowerCase();
    expect(a).toContain('open hand');
    expect(a).toContain('reach');
  });

  it('every why cites its source rule (non-empty, names the guide)', () => {
    for (const s of SERVICE_ITEMS) {
      expect(s.why, s.id).toMatch(/service guide|onboarding/i);
    }
  });
});
