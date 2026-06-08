import { test, expect } from '@playwright/test';

test('core loop: focus a deck, answer a card, get feedback + the why, grade, advance', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /build the muscle memory/i })).toBeVisible();

  // start a Focus session (first deck tile = Translator)
  await page.locator('button.deck-tile').first().click();
  const flash = page.locator('.flash');
  await expect(flash).toBeVisible();
  await expect(page.locator('.session-top .bar')).toBeVisible();

  // answer (MC) → instant feedback + the why + grade buttons appear
  await page.locator('.choices button.choice').first().click();
  await expect(page.locator('.feedback')).toBeVisible();
  await expect(page.getByRole('button', { name: /I got it/i })).toBeVisible();
  await page.getByRole('button', { name: /I got it/i }).click();
  // still in a session (advanced) or at the summary
  await expect(page.locator('.flash, .screen h1')).toBeVisible();
});

test('guest simulator runs a turn', async ({ page }) => {
  await page.goto('/practice/simulator');
  await expect(page.getByRole('heading', { name: /talk to the table/i })).toBeVisible();
  await page.locator('.choices button.choice').first().click();
  await expect(page.locator('.ans')).toBeVisible();
});

test('reference renders 17 wines with speak buttons + meters', async ({ page }) => {
  await page.goto('/reference');
  await expect(page.locator('.winecard')).toHaveCount(17);
  await expect(page.locator('.speak')).toHaveCount(17);
  await expect(page.locator('.meter').first()).toBeVisible();
});

test('wine school shows the reasoning layer', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.locator('.family')).toHaveCount(5);
  await expect(page.locator('.stylemap')).toBeVisible();
  await expect(page.locator('.regionmap')).toBeVisible();
});
