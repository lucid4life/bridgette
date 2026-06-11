// Task D2 — "Cocktail Builds" drill deck over the official Beverage Syllabus:
// builds:<cocktailId>:pick. One card per cocktail carrying the official `build`
// (13 today — spicy-sandia and lovers-mountain are menu items without an official
// build and mint NO card). Written TDD-first: these specs define the deck.
// Mirrors the Dish Components precedent (components-allergens.test.ts) — with ONE
// deliberate difference: drinks come from the BAR, so the standing compliance
// sentence says "the bar", never "the kitchen".
import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { EXAM_BLUEPRINT } from './exam.js';
import { data } from '../data/index';

const BAR_CONFIRM = 'Always confirm allergens with the bar before promising a guest.';
const KITCHEN_CONFIRM = 'Always confirm allergens with the kitchen before promising a guest.';
const lc = (s: any) => String(s).toLowerCase();
const words = (s: any) => lc(s).split(/[^a-z0-9]+/).filter(Boolean);
const endStop = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : s.trim() + '.');

const cocktailById = new Map(data.cocktails.map((c: any) => [c.id, c]));
const withBuild = data.cocktails.filter((c: any) => c.build && c.build.length >= 1);
const withoutBuild = data.cocktails.filter((c: any) => !(c.build && c.build.length >= 1));

describe('Cocktail Builds deck', () => {
  const cards = T.generateDeck('builds', data);

  it('is registered in DECKS with the know-the-build learnLink, appended after allergens', () => {
    expect((T.DECKS as any).builds).toBeTruthy();
    expect((T.DECKS as any).builds.label).toBe('Cocktail Builds');
    expect((T.DECKS as any).builds.learnLink).toBe('know-the-build');
    const keys = Object.keys(T.DECKS);
    expect(keys.indexOf('builds')).toBeGreaterThan(keys.indexOf('allergens'));
  });

  it('mints one card per cocktail with an official build (derived count, 13 today)', () => {
    expect(withBuild.length).toBeGreaterThanOrEqual(1);
    expect(cards.length).toBe(withBuild.length);
  });

  it('every id mints ONLY the new builds:<cocktailId>:pick namespace', () => {
    for (const c of cards) {
      expect(c.id, c.id).toMatch(/^builds:[a-z0-9-]+:pick$/);
      expect(c.id).toBe('builds:' + c.sourceId + ':pick');
      expect(c.deck).toBe('builds');
      expect(c.kind).toBe('recall');
      expect(c.sourceKind).toBe('cocktail');
      expect(c.learnLink).toBe('know-the-build');
      expect(cocktailById.get(c.sourceId), 'unknown cocktail: ' + c.sourceId).toBeTruthy();
    }
  });

  it('cocktails WITHOUT an official build (spicy-sandia, lovers-mountain) mint NO card', () => {
    // Guard the premise in the data itself, then the generator's exclusion.
    for (const id of ['spicy-sandia', 'lovers-mountain']) {
      const ck: any = cocktailById.get(id);
      expect(ck, 'cocktail missing from data: ' + id).toBeTruthy();
      expect(ck.build && ck.build.length >= 1, id + ' unexpectedly grew a build — update this test').toBeFalsy();
    }
    const minted = new Set(cards.map((c: any) => c.sourceId));
    for (const ck of withoutBuild) {
      expect(minted.has(ck.id), 'card minted for build-less cocktail: ' + ck.id).toBe(false);
    }
  });

  it('answer is genuinely IN the build; NO distractor is (case-insensitive); 4 unique choices from other builds', () => {
    const vocab = new Set<string>();
    withBuild.forEach((ck: any) => ck.build.forEach((b: string) => vocab.add(lc(b))));
    for (const c of cards) {
      const ck: any = cocktailById.get(c.sourceId);
      const mine = new Set(ck.build.map(lc));
      expect(mine.has(lc(c.answer)), c.id + ' answer not in build: ' + c.answer).toBe(true);
      expect(c.choices.length, c.id).toBe(4);
      expect(new Set(c.choices).size, c.id + ' dup choices').toBe(4);
      expect(c.choices).toContain(c.answer);
      for (const ch of c.choices) {
        if (ch === c.answer) continue;
        expect(mine.has(lc(ch)), c.id + ' distractor IS in the build: ' + ch).toBe(false);
        expect(vocab.has(lc(ch)), c.id + " distractor not from another cocktail's build: " + ch).toBe(true);
      }
    }
  });

  it('answer drills the NON-OBVIOUS component: first build item sharing no word with the drink name (fallback = first item)', () => {
    for (const c of cards) {
      const ck: any = cocktailById.get(c.sourceId);
      const nameWords = new Set(words(ck.name));
      const sharesNone = (item: string) => !words(item).some((w) => nameWords.has(w));
      const expected = ck.build.find(sharesNone) || ck.build[0];
      expect(c.answer, c.id).toBe(expected);
    }
  });

  it('prompt and scenario carry the exact guest-facing wording', () => {
    for (const c of cards) {
      const ck: any = cocktailById.get(c.sourceId);
      expect(c.prompt, c.id).toBe('Which of these is IN the ' + ck.name + '?');
      expect(c.scenario, c.id).toBe("A guest asks what's in the " + ck.name + '. Name the build.');
    }
  });

  it('why teaches the full official build; aliases accept any component; tags carry builds + cocktail', () => {
    for (const c of cards) {
      const ck: any = cocktailById.get(c.sourceId);
      expect(c.why.startsWith('Official build: ' + ck.build.join(', ') + '.'), c.id + ' why: ' + c.why).toBe(true);
      expect(c.aliases, c.id).toEqual(ck.build);
      expect(c.tags, c.id).toContain('builds');
      expect(c.tags, c.id).toContain('cocktail');
    }
  });

  it('every why with allergens carries flags + note and ends with the EXACT bar-confirm sentence; never "kitchen"', () => {
    let flagged = 0;
    for (const c of cards) {
      const ck: any = cocktailById.get(c.sourceId);
      expect(lc(c.why).includes('kitchen'), c.id + ' drinks come from the BAR: ' + c.why).toBe(false);
      if (ck.allergens && ck.allergens.length >= 1) {
        flagged++;
        expect(c.why, c.id).toContain(ck.allergens.join(', '));
        if (ck.allergenNote) expect(c.why, c.id).toContain(endStop(ck.allergenNote));
        expect(c.why.endsWith(BAR_CONFIRM), c.id + ' why must end with the bar-confirm sentence: ' + c.why).toBe(true);
      } else {
        // No flags -> the why is ONLY the build teach (no dangling compliance boilerplate).
        expect(c.why, c.id).toBe('Official build: ' + ck.build.join(', ') + '.');
      }
    }
    expect(flagged, 'data premise: some cocktails carry allergen flags').toBeGreaterThanOrEqual(1);
  });

  it('is enrolled in the produce-at-higher-boxes mechanism (REASON_DECKS)', () => {
    expect(T.REASON_DECKS.has('builds')).toBe(true);
    expect(T.modeForBox({ kind: 'recall', deck: 'builds' } as any, 1)).toBe('mc');
    expect(T.modeForBox({ kind: 'recall', deck: 'builds' } as any, 2)).toBe('mc');
    expect(T.modeForBox({ kind: 'recall', deck: 'builds' } as any, 3)).toBe('produce');
    expect(T.modeForBox({ kind: 'recall', deck: 'builds' } as any, 5)).toBe('produce');
  });

  it('produce grading accepts ANY genuine build component via gradeTyped', () => {
    const c: any = cards.find((x: any) => x.sourceId === 'heartbreak-mountain');
    expect(c).toBeTruthy();
    const ck: any = cocktailById.get('heartbreak-mountain');
    for (const item of ck.build) expect(T.gradeTyped(c, item), item).toBe(true);
  });

  it('is deterministic: two generations are byte-identical', () => {
    expect(JSON.stringify(T.generateDeck('builds', data)))
      .toBe(JSON.stringify(T.generateDeck('builds', data)));
  });
});

describe('wiring — allCards, sourceForCard, expandFor, food sentence untouched', () => {
  it('allCards picks up the builds deck', () => {
    const all = T.allCards(data).map((c: any) => c.id);
    expect(all.filter((id: string) => id.startsWith('builds:')).length).toBe(withBuild.length);
  });

  it('sourceForCard resolves every builds card to its cocktail record', () => {
    for (const c of T.generateDeck('builds', data)) {
      const src: any = T.sourceForCard(c, data);
      expect(src, c.id).toBeTruthy();
      expect(src.id, c.id).toBe(c.sourceId);
    }
  });

  it('expandFor on a builds card surfaces the official build, flavor tags, and bar-confirm allergen flags', () => {
    const c = T.generateDeck('builds', data).find((x: any) => x.sourceId === 'heartbreak-mountain');
    const ck: any = cocktailById.get('heartbreak-mountain');
    const sections = T.expandFor(c, data).sections;
    const byLabel: Record<string, any> = {};
    sections.forEach((s: any) => { byLabel[s.label] = s; });
    expect(byLabel['The official build']?.text).toContain(ck.build.join(', '));
    expect(byLabel['Flavor tags']?.items).toEqual(ck.flavorTags);
    expect(byLabel['Allergen flags']?.text).toContain(ck.allergens.join(', '));
    expect(byLabel['Allergen flags']?.text).toContain(endStop(ck.allergenNote)); // heartbreak-mountain has a note
    expect(byLabel['Allergen flags']?.text.endsWith(BAR_CONFIRM)).toBe(true);
    expect(lc(byLabel['Allergen flags']?.text).includes('kitchen')).toBe(false);
  });

  it('expandFor on a flag-less cocktail omits the allergen section (no empty boilerplate)', () => {
    const c = T.generateDeck('builds', data).find((x: any) => x.sourceId === 'doctor-jones');
    const labels = T.expandFor(c, data).sections.map((s: any) => s.label);
    expect(labels).toContain('The official build');
    expect(labels).not.toContain('Allergen flags');
  });

  it('the FOOD allergen sentence still says "the kitchen", byte-identical to before (shared helper must not drift it)', () => {
    const foodCard: any = T.generateDeck('allergens', data).find((x: any) => x.sourceId === 'tuna-crudo');
    expect(foodCard.why.endsWith(KITCHEN_CONFIRM)).toBe(true);
    const f: any = data.foods.find((x: any) => x.id === 'tuna-crudo');
    const sections = T.expandFor(foodCard, data).sections;
    const flags = sections.find((s: any) => s.label === 'Allergen flags');
    expect(flags?.text).toBe(
      f.allergens.join(', ') + '. ' + (f.allergenNote ? endStop(f.allergenNote) + ' ' : '') + KITCHEN_CONFIRM
    );
  });

  it('mock exams are NOT coupled to the builds deck', () => {
    expect(EXAM_BLUEPRINT).not.toHaveProperty('builds');
  });
});
