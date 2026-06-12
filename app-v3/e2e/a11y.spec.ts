import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const ROUTES = [
  '/',
  '/today',
  '/playbook',
  '/playbook/cram',
  '/progress',
  '/review',
  '/preshift',
  '/checkpoint/food-runner' // intro state — the session never starts
];
const THEMES = ['light', 'dark'] as const;

// Axe must measure the SETTLED state — the card-in entrance fade transiently
// lowers opacity, which axe samples as a false-positive contrast hit.
// Hard-disable all animation/transition before analyzing (a static-a11y measurement).
async function freeze(page: Page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none !important;transition:none !important}' });
}
function report(violations: { id: string; nodes: unknown[] }[]) {
  return JSON.stringify(violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2);
}
async function scan(page: Page) {
  await freeze(page);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations, report(results.violations)).toEqual([]);
}

// ---------------------------------------------------------------------------
// Learn-session driver. The session card is one of three faces:
//   .fmc   — MC question (pretest or quiz mc rung)
//   .tcard — teach card (the menu page)
//   .frv   — cued/free reveal card
// MC content is deterministic per item (seeded shuffle), and the QUIZ asks the
// SAME questions the PRETEST did — so recording prompt → correct-choice while
// answering the pretest lets the driver answer every quiz MC right and reach
// the cued rung without ever looping on a recycled miss.
// ---------------------------------------------------------------------------
type Face = 'mc' | 'teach' | 'reveal';

async function currentFace(page: Page): Promise<Face> {
  const card = page.locator('article.fmc, article.tcard, article.frv').first();
  await card.waitFor();
  const cls = (await card.getAttribute('class')) ?? '';
  return cls.includes('fmc') ? 'mc' : cls.includes('tcard') ? 'teach' : 'reveal';
}

/** Answer the visible MC (using `known` when this prompt was seen before),
 * record the marked correct choice, then Continue. */
async function answerMc(page: Page, known: Map<string, string>): Promise<void> {
  const prompt = (await page.locator('.fmc .q').innerText()).trim();
  const choices = page.locator('.fmc .choices .choice');
  const want = known.get(prompt);
  let pick = 0;
  if (want) {
    const n = await choices.count();
    for (let i = 0; i < n; i++) {
      const t = (await choices.nth(i).locator('.t').innerText()).trim();
      if (t === want) {
        pick = i;
        break;
      }
    }
  }
  await choices.nth(pick).click();
  const right = (await page.locator('.fmc .choice.right .t').innerText()).trim();
  known.set(prompt, right);
  await page.locator('.fmc .fb .btn').click();
}

/** Drive /unit/day-one (16 service items) until `target` is the visible face. */
async function driveTo(page: Page, target: Face): Promise<void> {
  await page.goto('/unit/day-one');
  const known = new Map<string, string>();
  // worst case to the first reveal: 16 pretest + 16 teach + 16 quiz-mc steps
  for (let guard = 0; guard < 80; guard++) {
    const face = await currentFace(page);
    if (face === target) return;
    if (face === 'mc') await answerMc(page, known);
    else if (face === 'teach') await page.locator('.tcard .t-actions .btn').click();
    else throw new Error(`driver passed an unexpected ${face} face seeking ${target}`);
  }
  throw new Error(`never reached the ${target} face`);
}

// Every scan runs in BOTH themes: bb_theme is set before any script runs, so the
// FOUC guard applies the theme exactly as it would for a returning user.
for (const theme of THEMES) {
  test.describe(`theme: ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('bb_theme', t), theme);
    });

    for (const route of ROUTES) {
      test(`axe: ${route} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(route);
        await scan(page);
      });
    }

    test('axe: unit pretest MC face', async ({ page }) => {
      await page.goto('/unit/day-one');
      await expect(page.locator('.fmc .choices .choice').first()).toBeVisible();
      await scan(page);
    });

    test('axe: unit pretest answered (feedback) state', async ({ page }) => {
      await page.goto('/unit/day-one');
      await page.locator('.fmc .choices .choice').first().click();
      await expect(page.locator('.fmc .fb')).toBeVisible();
      await scan(page);
    });

    test('axe: teach card', async ({ page }) => {
      test.setTimeout(90_000); // drives through the 16-step pretest first
      await driveTo(page, 'teach');
      await expect(page.locator('.tcard')).toBeVisible();
      await scan(page);
    });

    test('axe: reveal (cued) face + revealed state', async ({ page }) => {
      test.setTimeout(120_000); // drives pretest + teach + quiz-mc to the cued rung
      await driveTo(page, 'reveal');
      await expect(page.locator('.frv')).toBeVisible();
      await scan(page); // the question face (with hint)
      await page.locator('.frv .act .btn').click();
      await expect(page.locator('.frv .rv')).toBeVisible();
      await scan(page); // the revealed answer + grade bar
    });
  });
}
