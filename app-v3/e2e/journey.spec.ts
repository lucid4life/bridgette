import { test, expect } from '@playwright/test';

// Smoke: the Phase-1 happy path end to end — the Path renders, Day one starts,
// a pretest MC answers + advances, and the Playbook lookup actually filters.

test('path → start the first module → answer a pretest MC → continue advances', async ({ page }) => {
  await page.goto('/');

  // Fresh profile: only Stage 1 renders a spine (Stage 2+ are locked previews) —
  // its ten stations (9 lessons + the shift check).
  await expect(page.locator('ol.path-list li.node')).toHaveCount(10);

  // The one big continue card points at the first module (Seats & service).
  const start = page.locator('a.continue');
  await expect(start).toContainText(/start/i);
  await expect(start).toContainText('Seats & service');
  await start.click();

  await expect(page).toHaveURL(/\/unit\/day-one$/);
  const card = page.locator('article.fmc');
  await expect(card).toBeVisible();
  // Svelte collapses the whitespace around the inner " of " span — match loosely.
  await expect(page.locator('.s-count')).toContainText(/^1\s*of/);

  // Answer (any choice — pretest misses are the point) → feedback renders on-card.
  await card.locator('.choices .choice').first().click();
  await expect(page.locator('.fmc .fb')).toBeVisible();

  // Continue advances to the next step.
  await page.locator('.fmc .fb .btn').click();
  await expect(page.locator('.s-count')).toContainText(/^2\s*of/);
});

test('romance drill: intro → start → reveal → got it advances to 2 of 41', async ({ page }) => {
  await page.goto('/romance');

  // Deliberate entry: the intro card, no session chrome yet.
  await expect(page.locator('.s-count')).toHaveCount(0);
  await page.getByRole('button', { name: 'start the drill' }).click();

  // The drill face: 1 of 41, dish name big, reveal → pass bar → self-grade.
  await expect(page.locator('.s-count')).toContainText(/^1\s*of\s*41/);
  await expect(page.locator('.rom .r-name')).toBeVisible();
  await page.locator('.rom .act .btn').click();
  await expect(page.locator('.rom .targets li').first()).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('.s-count')).toContainText(/^2\s*of\s*41/);
});

test('food test: intro → start → answer the first MC → feedback shows', async ({ page }) => {
  await page.goto('/test');

  // Deliberate entry: the intro card, no session chrome yet.
  await expect(page.locator('.s-count')).toHaveCount(0);
  await page.getByRole('button', { name: 'start the test' }).click();
  await expect(page.locator('.s-count')).toContainText(/^1\s*of\s*41/);

  // The type wheel deals at most one romance face before an MC — clear it.
  await expect(page.locator('article.fmc, article.rom').first()).toBeVisible();
  for (let i = 0; i < 2; i++) {
    if (await page.locator('article.fmc').isVisible()) break;
    await page.locator('.rom .act .btn').click(); // Check yourself
    await page.getByRole('button', { name: 'Got it' }).click();
  }
  await expect(page.locator('article.fmc')).toBeVisible();
  await page.locator('.fmc .choices .choice').first().click();
  await expect(page.locator('.fmc .fb')).toBeVisible();
});

test('allergen sweep: start → answer → feedback carries the confirm line', async ({ page }) => {
  await page.goto('/allergens');

  await expect(page.locator('.s-count')).toHaveCount(0);
  await page.getByRole('button', { name: 'start the sweep' }).click();

  await expect(page.locator('.s-count')).toContainText(/^1\s*of\s*41/);
  await expect(page.locator('article.fmc')).toBeVisible();
  await page.locator('.fmc .choices .choice').first().click();
  await expect(page.locator('.fmc .fb')).toBeVisible();
  // the teach-back + the non-negotiable safety framing, visible on every answer
  await expect(page.locator('.fmc .fb-why')).toContainText(/^Allergen flags:/);
  await expect(page.locator('.fmc .fb-confirm')).toContainText('Never guess');
});

test('playbook search narrows to the one octopus dish', async ({ page }) => {
  await page.goto('/playbook');
  // the dish search (the page also has a guest-ask translator search)
  await page.getByPlaceholder('search a dish…').fill('octopus');
  await expect(page.locator('article.dish')).toHaveCount(1);
  await expect(page.locator('article.dish .nm')).toHaveText('Grilled Octopus Salad');
  await expect(page.locator('.count')).toContainText('1 of');
});
