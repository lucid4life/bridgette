import { test, expect } from '@playwright/test';

test('core loop: focus a deck, answer a card, get feedback + the why, grade, advance', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /build the muscle memory/i })).toBeVisible();

  // start a Focus session (first deck tile = Translator)
  await page.locator('button.deck-tile').first().click();
  const flash = page.locator('.flash');
  await expect(flash).toBeVisible();
  await expect(page.locator('.session-top .bar')).toBeVisible();

  // answer (MC) → instant reveal: "Correct." feedback on a hit, or the rich
  // you-said/correct miss-banner on a miss (spec §4c); then the why + a Continue button
  await page.locator('.choices button.choice').first().click();
  await expect(page.locator('.feedback, .miss-banner')).toBeVisible();
  await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
  await page.getByRole('button', { name: /Continue/i }).click();
  // still in a session (advanced) or at the summary
  await expect(page.locator('.flash, .screen h1')).toBeVisible();
});

test('deep-link: /?deck=<id> starts a focused session (Learn "Drill it now" CTA)', async ({ page }) => {
  await page.goto('/?deck=structure');
  // a valid deck id starts straight into a session, skipping the home screen
  await expect(page.locator('.flash')).toBeVisible();
  await expect(page.locator('.session-top')).toBeVisible();
});

test('deep-link: an unknown ?deck= falls back to the Practice home screen', async ({ page }) => {
  await page.goto('/?deck=not-a-real-deck');
  await expect(page.getByRole('heading', { name: /build the muscle memory/i })).toBeVisible();
  await expect(page.locator('.flash')).toHaveCount(0);
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

test('wine deep-dive: /reference/wine/<id> renders the record', async ({ page }) => {
  await page.goto('/reference/wine/hiedler-loss');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hiedler');
  await expect(page.locator('.meter').first()).toBeVisible();
});

test('course: the 5 families module shows the reasoning layer', async ({ page }) => {
  await page.goto('/learn');
  // The reasoning layer now lives inside the "The 5 families" module. Its map card
  // is unlocked-or-jump-ahead, so it's always clickable.
  await page.locator('button.mod-card', { hasText: 'The 5 families' }).click();
  await expect(page.locator('.family')).toHaveCount(5);
  await expect(page.locator('.stylemap')).toBeVisible();
  await expect(page.locator('.regionmap')).toBeVisible();
});
