import { test, expect } from '@playwright/test';

// Spec §16: setOffline → the app shell + a flashcard still work from the SW precache.
test('works offline after first visit (service-worker precache)', async ({ page, context }) => {
  await page.goto('/');
  // wait for the service worker to register + take control
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) await navigator.serviceWorker.ready;
  });
  await page.reload(); // ensure the SW controls this client
  await page.waitForFunction(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller), null, { timeout: 20_000 });

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole('heading', { name: /build the muscle memory/i })).toBeVisible();

    // navigate + run the core loop entirely offline
    await page.goto('/reference');
    await expect(page.locator('.winecard').first()).toBeVisible();
    await page.goto('/');
    await page.locator('button.deck-tile').first().click();
    await expect(page.locator('.flash')).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
