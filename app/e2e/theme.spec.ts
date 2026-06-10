import { test, expect } from '@playwright/test';

// Computed canvas colours (body background-color) per theme.
const CREAM = 'rgb(255, 238, 214)'; // #ffeed6
const ESPRESSO = 'rgb(34, 27, 21)'; // #221b15

test('defaults to the light cream theme with no saved choice (light OS)', async ({ page }) => {
  await page.goto('/today');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  await expect(page.locator('body')).toHaveCSS('background-color', CREAM);
});

test('toggle switches to dark, persists across reload, and updates theme-color', async ({ page }) => {
  await page.goto('/today');
  // fresh profile = auto; first cycle lands on dark
  await page.getByRole('button', { name: /^Theme: Auto/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', ESPRESSO);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#2a211a');
  expect(await page.evaluate(() => localStorage.getItem('bb_theme'))).toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', ESPRESSO);

  // cycle on: dark -> light -> auto (storage cleared)
  await page.getByRole('button', { name: /^Theme: Dark/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', CREAM);
  expect(await page.evaluate(() => localStorage.getItem('bb_theme'))).toBe('light');
  await page.getByRole('button', { name: /^Theme: Light/ }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  expect(await page.evaluate(() => localStorage.getItem('bb_theme'))).toBeNull();
});

test.describe('OS dark preference with no saved choice', () => {
  test.use({ colorScheme: 'dark' });
  test('auto applies the espresso dark theme', async ({ page }) => {
    await page.goto('/today');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(page.locator('body')).toHaveCSS('background-color', ESPRESSO);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#2a211a');
  });
});

test('saved light choice beats the OS dark preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('bb_theme', 'light'));
  await page.goto('/today');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', CREAM);
});
