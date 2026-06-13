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

test('romance exam: intro → start → structured self-check → lock in advances to 2 of 41', async ({ page }) => {
  await page.goto('/romance/exam');
  await expect(page.locator('.s-count')).toHaveCount(0); // deliberate intro
  await page.getByRole('button', { name: 'start the exam' }).click();

  await expect(page.locator('.s-count')).toContainText(/^1\s*of\s*41/);
  await expect(page.locator('.rom-exam .r-name')).toBeVisible();

  // Reveal → the STRUCTURED check (not a gestalt got-it): name toggle + chips.
  await page.locator('.rom-exam .act .btn').click();
  await expect(page.locator('.rom-exam .name-tog')).toBeVisible();
  const chips = page.locator('.rom-exam .chips .tog.chip');
  await expect(chips.first()).toBeVisible();

  // Mark the name + every component said, then lock it in.
  await page.locator('.rom-exam .name-tog').click();
  const n = await chips.count();
  for (let c = 0; c < n; c++) await chips.nth(c).click();
  await page.getByRole('button', { name: 'lock it in' }).click();
  await expect(page.locator('.s-count')).toContainText(/^2\s*of\s*41/);
});

test('romance exam: a missed dish surfaces in the shaky list with a one-tap re-drill link', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/romance/exam');
  await page.getByRole('button', { name: 'start the exam' }).click();

  // Drive the whole pass: fail the FIRST dish (reveal + lock in, nothing tapped),
  // romance every other dish clean.
  for (let i = 0; i < 60; i++) {
    const card = page.locator('article.rom-exam');
    if ((await card.count()) === 0) break; // summary reached
    await card.locator('.act .btn').click();
    await card.locator('.check').waitFor();
    if (i !== 0) {
      await card.locator('.name-tog').click();
      const chips = card.locator('.chips .tog.chip');
      const cn = await chips.count();
      for (let c = 0; c < cn; c++) await chips.nth(c).click();
    }
    await card.locator('.gradebar .btn').click();
  }

  // The readiness summary lists the one shaky dish and the re-drill points at it.
  await expect(page.locator('.sum-card .ring')).toBeVisible();
  const drill = page.locator('.sum-actions a.btn').first();
  await expect(drill).toHaveAttribute('href', /^\/romance\?drill=.+/);
  await expect(page.locator('.sum-misses li')).toHaveCount(1);
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

test('cram-to-a-date: set a test date → countdown shows → clear removes it', async ({ page }) => {
  await page.goto('/today');
  // fresh profile: the date-set affordance shows, no countdown yet
  const dateInput = page.locator('.cram-set input[type="date"]');
  await expect(dateInput).toBeVisible();
  await expect(page.locator('.cram')).toHaveCount(0);

  // set a date three days out → the countdown appears
  const d = new Date();
  d.setDate(d.getDate() + 3);
  await dateInput.fill(d.toISOString().slice(0, 10));
  await expect(page.locator('.cram-count')).toContainText(/menu test/i);

  // clear → back to the date-set affordance
  await page.getByRole('button', { name: 'clear date' }).click();
  await expect(page.locator('.cram-set input[type="date"]')).toBeVisible();
});

test('sure/shaky: flagging "I wasn’t sure" records shaky confidence on the daily review', async ({ page }) => {
  const rec = {
    srs: { due: 0, stability: 5, difficulty: 5, elapsed_days: 1, scheduled_days: 1, learning_steps: 0, reps: 2, lapses: 0, state: 2, last_review: 0 },
    lapses: 0, correct: 2, lastGrade: 'good', introducedDay: 0
  };
  const seed = JSON.stringify({
    schema: 1,
    items: { 'dish:french-fries': rec },
    meta: { streak: { current: 0, lastDay: null, freezeUsedWeekOf: null }, settings: { lessonsPerDay: 8 }, unitDone: {}, dayLog: {}, writeSeq: 9999 }
  });
  await page.addInitScript((s) => localStorage.setItem('bb3_progress_v1', s), seed);
  await page.goto('/review');

  await page.locator('.frv .act .btn').click(); // Show answer
  await page.locator('.frv .shaky-tog').click(); // flag "I wasn't sure"
  await page.getByRole('button', { name: 'Got it' }).click();

  // the flagged confidence lands in the persisted mirror
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const m = JSON.parse(localStorage.getItem('bb3_progress_v1') || '{}');
        return Object.values(m.items || {}).map((r) => r.confidence);
      })
    )
    .toContain('shaky');
});

test('path resume: lands on the current node when it is deep in the spine (seeded stages 1+2)', async ({ page }) => {
  // stages 1+2 complete → the current node (bar-arc) sits far down the 5-stage spine
  const units = ['day-one','snacks','snacks-2','small-plates','vegetables','pizza','pasta','mains','dessert','checkpoint-food','allergens-seafood','allergens-nuts','allergens-diet','allergens-common','checkpoint-allergens'];
  const seed = JSON.stringify({
    schema: 1, items: {},
    meta: { streak: { current: 0, lastDay: null, freezeUsedWeekOf: null }, settings: { lessonsPerDay: 8 }, unitDone: Object.fromEntries(units.map((u) => [u, 'gate'])), dayLog: {}, writeSeq: 9999 }
  });
  await page.addInitScript((s) => localStorage.setItem('bb3_progress_v1', s), seed);
  await page.goto('/');
  const current = page.locator('.path-list .node.current');
  await expect(current).toBeVisible();
  // without the land-on-current scroll this node is ~3000px below the fold
  await expect(current).toBeInViewport();
});

test('backup: the "your data" card offers export/import and rejects a bad file safely', async ({ page }) => {
  await page.goto('/progress');
  const card = page.locator('.card.data');
  await expect(card).toBeVisible();
  await expect(card.getByRole('button', { name: 'download a backup' })).toBeVisible();
  // feed an invalid file → a safe error, current progress untouched (no reload)
  await card.locator('input[type="file"]').setInputFiles({
    name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{not a backup')
  });
  await expect(card.locator('.data-err')).toBeVisible();
  await expect(page).toHaveURL(/\/progress$/);
});

test('pour drill: gated until Stage 5, then intro → start → reveal → got it advances', async ({ page }) => {
  // locked (fresh profile) → bounced off /pour
  await page.goto('/pour');
  await expect(page).toHaveURL(/\/$/);

  // seeded past Stage 4 → the drill is reachable
  const units = ['day-one','snacks','snacks-2','small-plates','vegetables','pizza','pasta','mains','dessert','checkpoint-food','allergens-seafood','allergens-nuts','allergens-diet','allergens-common','checkpoint-allergens','bar-arc','bar-bright','bar-floral','bar-spirit','bar-zero','checkpoint-bar','wine-bubbles','wine-bright','wine-round','wine-light','wine-structured','checkpoint-wine'];
  const seed = JSON.stringify({ schema: 1, items: {}, meta: { streak: { current: 0, lastDay: null, freezeUsedWeekOf: null }, settings: { lessonsPerDay: 8 }, unitDone: Object.fromEntries(units.map((u) => [u, 'gate'])), dayLog: {}, writeSeq: 9999 } });
  await page.addInitScript((s) => localStorage.setItem('bb3_progress_v1', s), seed);
  await page.goto('/pour');

  await expect(page.locator('.s-count')).toHaveCount(0); // deliberate intro
  await page.getByRole('button', { name: 'start the drill' }).click();
  await expect(page.locator('.s-count')).toContainText(/^1\s*of/);
  await expect(page.locator('article.frv')).toBeVisible();
  await page.locator('.frv .act .btn').click(); // reveal the pour
  await expect(page.locator('.frv .rv')).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('.s-count')).toContainText(/^2\s*of/);
});
