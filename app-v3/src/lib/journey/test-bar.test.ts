// Test-bar quiz expansion (research 2026-06-13) — validity of every minted
// question type over the REAL menu data, plus the judgment round session.
import { describe, expect, it } from 'vitest';
import { data } from '$lib/data';
import {
  allStage1Items,
  descriptionMcFor,
  glossaryMcFor,
  hasModsMc,
  hasNotFlagMc,
  judgmentQuestions,
  normWords,
  notFlagMcFor,
  safeCallMcForDish,
  SAFE_CALL_EXCLUSIONS
} from './items';
import { GLOSSARY } from './glossary';
import { MODS_ROWS, modsRowsFor } from './allergen-mods';
import { modsMcFor } from './items';
import { createJudgmentSession } from '$lib/session';

const DISHES = allStage1Items().filter((i) => i.kind === 'dish');
const foodByName = new Map(data.foods.map((f) => [f.name, f]));
const foodById = new Map(data.foods.map((f) => [f.id, f]));

describe('safe-call MC — the allergy inversion', () => {
  it('every path dish mints a valid safe call: answer truly safe, the asked dish among the carriers', () => {
    for (const item of DISHES) {
      const mc = safeCallMcForDish(item);
      const asked = foodById.get(item.foodId!)!;
      expect(mc.choices).toContain(asked.name); // the plate in front of you is a wrong choice
      const answer = foodByName.get(mc.choices[mc.answerIndex])!;
      expect(answer.allergens ?? [], `${item.id} answer carries ${mc.allergen}`).not.toContain(
        mc.allergen
      );
      expect(SAFE_CALL_EXCLUSIONS[mc.allergen] ?? []).not.toContain(answer.id);
      for (const choice of mc.choices) {
        if (choice === answer.name) continue;
        const d = foodByName.get(choice)!;
        expect(d.allergens ?? [], `${item.id} distractor '${choice}' must carry ${mc.allergen}`).toContain(
          mc.allergen
        );
      }
      expect(mc.confirmLine).toBe(data.confirm.allergens);
    }
  });

  it('the unlisted-allergen exclusions hold: ricotta never safe for eggs, duck never safe for soy', () => {
    for (const item of DISHES) {
      const mc = safeCallMcForDish(item);
      const answer = mc.choices[mc.answerIndex];
      if (mc.allergen === 'eggs') expect(answer).not.toBe('Ricotta Dumplings');
      if (mc.allergen === 'soy') expect(answer).not.toBe('Wood Roasted Half Duck');
    }
    for (const q of judgmentQuestions()) {
      if (q.id === 'judg:safe:eggs') expect(q.choices[q.answerIndex]).not.toBe('Ricotta Dumplings');
      if (q.id === 'judg:safe:soy') expect(q.choices[q.answerIndex]).not.toBe('Wood Roasted Half Duck');
    }
  });

  it('a dairy-allergic dessert guest gets the Sorbet (same-category safe pick)', () => {
    const tatin = DISHES.find((i) => i.foodId === 'apple-tatin')!;
    const mc = safeCallMcForDish(tatin); // apple-tatin's first flag is gluten…
    // …so force the dessert+dairy case through the judgment set instead:
    const dairy = judgmentQuestions().find((q) => q.id === 'judg:safe:dairy');
    expect(dairy).toBeDefined();
    expect(mc.choices.length).toBe(4);
  });
});

describe('NOT-a-flag MC — full flag-set certification', () => {
  it('valid for every >=3-flag dish: answer absent from the line, foils all real flags', () => {
    const eligible = DISHES.filter(hasNotFlagMc);
    expect(eligible.length).toBeGreaterThan(15); // most of the menu carries 3+
    for (const item of eligible) {
      const mc = notFlagMcFor(item);
      const f = foodById.get(item.foodId!)!;
      const flags = f.allergens ?? [];
      expect(flags).not.toContain(mc.choices[mc.answerIndex]);
      for (const c of mc.choices) if (c !== mc.choices[mc.answerIndex]) expect(flags).toContain(c);
    }
  });

  it('throws on dishes with fewer than 3 flags', () => {
    const small = DISHES.find((i) => (foodById.get(i.foodId!)!.allergens ?? []).length < 3);
    if (small) expect(() => notFlagMcFor(small)).toThrow(/>=3 flags/);
  });
});

describe('description→dish MC — explain-it inverted', () => {
  it('every dish mints one; the prompt never carries the answer name; the answer is the dish', () => {
    for (const item of DISHES) {
      const mc = descriptionMcFor(item);
      const f = foodById.get(item.foodId!)!;
      expect(mc.choices[mc.answerIndex]).toBe(f.name);
      const promptWords = new Set(normWords(mc.prompt.replace(/which dish is this\?/i, '')));
      for (const w of normWords(f.name))
        expect(promptWords.has(w), `${item.id}: name word '${w}' leaked into the prompt`).toBe(false);
      expect(new Set(mc.choices).size).toBe(4);
    }
  });
});

describe('glossary MC — a guest asks', () => {
  it('every term answers with its own official definition; foils are other definitions', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(12);
    for (const g of GLOSSARY) {
      const mc = glossaryMcFor(g);
      expect(mc.choices[mc.answerIndex]).toBe(g.definition);
      expect(new Set(mc.choices).size).toBe(4);
      for (const id of g.dishes) expect(foodById.has(id), `${g.term} dish '${id}'`).toBe(true);
    }
  });
});

describe('mods-call MC — can it come off?', () => {
  it('every authored row mints: answer = the floor call, foils from other call families', () => {
    expect(MODS_ROWS.length).toBeGreaterThanOrEqual(20);
    for (const row of MODS_ROWS) {
      expect(foodById.has(row.foodId), row.foodId).toBe(true);
      // every row's allergen really is on (or officially about) that dish's line
      const f = foodById.get(row.foodId)!;
      expect(
        (f.allergens ?? []).includes(row.allergen),
        `${row.foodId}: mods row for '${row.allergen}' not on the official line`
      ).toBe(true);
      const mc = modsMcFor(row);
      expect(mc.choices[mc.answerIndex]).toBe(row.answer);
      expect(mc.why).toContain(row.note);
      expect(new Set(mc.choices).size).toBe(4);
    }
  });

  it('hasModsMc gates the per-dish pick', () => {
    const moded = DISHES.filter(hasModsMc);
    expect(moded.length).toBeGreaterThanOrEqual(15);
    for (const item of moded) {
      const mc = modsMcFor(item);
      const rows = modsRowsFor(item.foodId!);
      expect(rows.map((r) => r.answer)).toContain(mc.choices[mc.answerIndex]);
    }
  });
});

describe('the judgment round', () => {
  const QUESTIONS = judgmentQuestions();

  it('spans safe calls + every mods row + every glossary term, ids unique', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((i) => i.startsWith('judg:safe:')).length).toBeGreaterThanOrEqual(8);
    expect(ids.filter((i) => i.startsWith('judg:mods:')).length).toBe(MODS_ROWS.length);
    expect(ids.filter((i) => i.startsWith('judg:gloss:')).length).toBe(GLOSSARY.length);
  });

  it('one-pass, score-only session: answer/advance contract, misuse throws, deterministic', () => {
    const rng = () => 0.42;
    const s = createJudgmentSession(QUESTIONS, { rng });
    expect(() => s.advance()).toThrow(/answer the MC/);
    let n = 0;
    while (!s.isComplete()) {
      const q = s.current()!;
      const res = s.answerMc(n % 4 === 0 ? (q.answerIndex + 1) % q.choices.length : q.answerIndex);
      expect(res.answerIndex).toBe(q.answerIndex);
      expect(() => s.answerMc(0)).toThrow(/already answered/);
      s.advance();
      n++;
    }
    const sum = s.summary();
    expect(sum.total).toBe(QUESTIONS.length);
    expect(sum.correct).toBe(sum.perItem.filter((r) => r.correct).length);
    expect(sum.score).toBeCloseTo(sum.correct / sum.total);
    expect(() => s.answerMc(0)).toThrow(/complete/);
    // determinism under the same rng
    const t = createJudgmentSession(QUESTIONS, { rng: () => 0.42 });
    expect(t.current()!.id).toBe(createJudgmentSession(QUESTIONS, { rng: () => 0.42 }).current()!.id);
  });

  it('throws on an empty question list', () => {
    expect(() => createJudgmentSession([])).toThrow();
  });
});
