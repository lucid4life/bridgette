import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const ROUTES = ['/', '/today', '/on-the-floor', '/learn', '/reference', '/reference/wine/hiedler-loss', '/progress', '/practice/simulator'];

// Axe must measure the SETTLED state — the .screen entrance fade transiently lowers
// opacity, which axe samples as a false-positive contrast hit. Hard-disable all
// animation/transition before analyzing (a static-a11y measurement).
async function freeze(page: Page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none !important;transition:none !important}' });
}
function report(violations: { id: string; nodes: unknown[] }[]) {
  return JSON.stringify(violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2);
}

for (const route of ROUTES) {
  test(`axe: ${route} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route);
    await freeze(page);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations, report(results.violations)).toEqual([]);
  });
}

test('axe: practice in-session (flashcard) state', async ({ page }) => {
  await page.goto('/');
  await page.locator('button.deck-tile').first().click();
  await expect(page.locator('.flash')).toBeVisible();
  await freeze(page);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations, report(results.violations)).toEqual([]);
});

test('axe: practice revealed (feedback) state', async ({ page }) => {
  await page.goto('/');
  await page.locator('button.deck-tile').first().click();
  await page.locator('.choices button.choice').first().click();
  // either the "Correct." line (hit) or the you-said/correct miss-banner (miss)
  await expect(page.locator('.feedback, .miss-banner')).toBeVisible();
  await freeze(page);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations, report(results.violations)).toEqual([]);
});
