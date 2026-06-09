import { describe, it, expect } from 'vitest';
import * as T from './training.js';
import { data } from '../data/index';

describe('missFeedback — you-said / correct / why', () => {
  it('returns said + correct + why for any miss', () => {
    const card: any = { answer: 'St. John Claret', why: 'It is the safe steak red.' };
    const fb = T.missFeedback(card, 'Meiomi', data);
    expect(fb.said).toBe('Meiomi');
    expect(fb.correct).toBe('St. John Claret');
    expect(fb.why).toBe('It is the safe steak red.');
  });

  it('surfaces a same-family wine confusion', () => {
    const byFam = new Map<string, any[]>();
    for (const w of data.wines) {
      const arr = byFam.get(w.family) ?? [];
      arr.push(w);
      byFam.set(w.family, arr);
    }
    const pair = [...byFam.values()].find((arr) => arr.length >= 2)!;
    const [answerWine, chosenWine] = pair;
    const card: any = { answer: answerWine.name, why: 'x' };
    const fb = T.missFeedback(card, chosenWine.name, data);
    expect(fb.confusion).toBeTruthy();
    expect(fb.confusion!.chose.name).toBe(chosenWine.name);
    expect(fb.confusion!.answer.name).toBe(answerWine.name);
  });

  it('no confusion when the chosen value is not a same-family wine', () => {
    const card: any = { answer: 'St. John Claret', why: 'x' };
    const fb = T.missFeedback(card, 'not a wine at all', data);
    expect(fb.confusion).toBeFalsy();
  });
});
