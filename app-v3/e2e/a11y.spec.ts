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
  '/checkpoint/food-runner', // intro state — the session never starts
  '/romance', // intro state — the drill never starts
  '/test', // intro state — the mock never starts
  '/allergens', // intro state — the sweep never starts
  '/burst' // intro state (no introduced items yet — the "nothing to burst" copy)
];
const THEMES = ['light', 'dark'] as const;

// Seed Stages 1+2 complete (the localStorage mirror, which wins over a fresh,
// empty idb on its higher writeSeq) so the gated Stage-3 surfaces are reachable.
const STAGE12_UNITS = [
  'day-one', 'snacks', 'snacks-2', 'small-plates', 'vegetables', 'pizza', 'pasta', 'mains',
  'dessert', 'checkpoint-food', 'allergens-seafood', 'allergens-nuts', 'allergens-diet',
  'allergens-common', 'checkpoint-allergens'
];
const BAR_UNITS = ['bar-arc', 'bar-bright', 'bar-floral', 'bar-spirit', 'bar-zero', 'checkpoint-bar'];
const WINE_UNITS = ['wine-bubbles', 'wine-bright', 'wine-round', 'wine-light', 'wine-structured', 'checkpoint-wine'];
function seedMirror(units: string[]): string {
  return JSON.stringify({
    schema: 1,
    items: {},
    meta: {
      streak: { current: 0, lastDay: null, freezeUsedWeekOf: null },
      settings: { lessonsPerDay: 8 },
      unitDone: Object.fromEntries(units.map((u) => [u, 'gate'])),
      dayLog: {},
      writeSeq: 9999
    }
  });
}
const SEED_STAGE12 = seedMirror(STAGE12_UNITS);
const SEED_STAGE123 = seedMirror([...STAGE12_UNITS, ...BAR_UNITS]); // unlocks Wine (Stage 4)
const SEED_STAGE1234 = seedMirror([...STAGE12_UNITS, ...BAR_UNITS, ...WINE_UNITS]); // unlocks Pairings (Stage 5)

// Burst game: a mirror with a handful of INTRODUCED items (a store record exists)
// of mixed kinds, so /burst has a deck to play.
const SEED_BURST = (() => {
  const rec = {
    srs: { due: 0, stability: 2, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: 1, last_review: 0 },
    lapses: 0, correct: 1, lastGrade: 'good', introducedDay: 0
  };
  const ids = ['dish:french-fries', 'dish:garlic-bread', 'dish:tuna-crudo', 'allergen:tuna-crudo'];
  const items: Record<string, typeof rec> = {};
  for (const id of ids) items[id] = rec;
  return JSON.stringify({
    schema: 1,
    items,
    meta: {
      streak: { current: 0, lastDay: null, freezeUsedWeekOf: null },
      settings: { lessonsPerDay: 8 },
      unitDone: Object.fromEntries(STAGE12_UNITS.map((u) => [u, 'gate'])),
      dayLog: {},
      writeSeq: 9999
    }
  });
})();

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

    test('axe: romance drill face + revealed state', async ({ page }) => {
      await page.goto('/romance');
      await page.getByRole('button', { name: 'start the drill' }).click();
      await expect(page.locator('article.rom')).toBeVisible();
      await scan(page); // the question face (name + prompt)
      await page.locator('.rom .act .btn').click();
      await expect(page.locator('.rom .rv')).toBeVisible();
      await scan(page); // the pass bar + model line + grade bar
    });

    test('axe: food test in-question state', async ({ page }) => {
      await page.goto('/test');
      await page.getByRole('button', { name: 'start the test' }).click();
      // the first face is dealt per run: an MC variant OR the romance card
      await expect(page.locator('article.fmc, article.rom').first()).toBeVisible();
      await scan(page);
    });

    test('axe: allergen sweep question + feedback (why + confirm line) states', async ({ page }) => {
      await page.goto('/allergens');
      await page.getByRole('button', { name: 'start the sweep' }).click();
      await expect(page.locator('article.fmc')).toBeVisible();
      await scan(page); // the question face
      await page.locator('.fmc .choices .choice').first().click();
      await expect(page.locator('.fmc .fb')).toBeVisible();
      await scan(page); // feedback with the flags teach-back + confirm line
    });

    test('axe: build drill intro (seeded — the drill is gated to Stage 3)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE12);
      await page.goto('/build');
      await expect(page.getByRole('button', { name: 'start the drill' })).toBeVisible();
      await scan(page);
    });

    test('axe: build drill face + revealed state (with the bar-confirm line)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE12);
      await page.goto('/build');
      await page.getByRole('button', { name: 'start the drill' }).click();
      await expect(page.locator('article.frv')).toBeVisible();
      await scan(page); // the build-it-out-loud question face
      await page.locator('.frv .act .btn').click();
      await expect(page.locator('.frv .rv')).toBeVisible();
      await scan(page); // the revealed build + grade bar (incl. the standalone bar-confirm line)
    });

    test('axe: build teach card (cocktail recipe, via reteach)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE12);
      await page.goto('/build');
      await page.getByRole('button', { name: 'start the drill' }).click();
      await page.locator('.frv .act .btn').click(); // reveal
      await page.getByRole('button', { name: 'Missed it' }).click(); // miss → reteach
      await expect(page.locator('.tcard')).toBeVisible();
      await scan(page);
    });

    test('axe: bar unit pretest MC (seeded past Stage 2)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE12);
      await page.goto('/unit/bar-bright');
      await expect(page.locator('.fmc .choices .choice').first()).toBeVisible();
      await scan(page);
    });

    test('axe: bar checkpoint intro (seeded past Stage 2)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE12);
      await page.goto('/checkpoint/behind-the-bar');
      await expect(page.getByRole('button', { name: /start the shift check/i })).toBeVisible();
      await scan(page);
    });

    test('axe: wine unit pretest MC (seeded past Stage 3)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE123);
      await page.goto('/unit/wine-bubbles');
      await expect(page.locator('.fmc .choices .choice').first()).toBeVisible();
      await scan(page);
    });

    test('axe: wine teach card (identity + structure meters + pronunciation)', async ({ page }) => {
      test.setTimeout(90_000); // drives the wine-bubbles pretest first
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE123);
      await page.goto('/unit/wine-bubbles');
      const known = new Map<string, string>();
      for (let guard = 0; guard < 40; guard++) {
        if (await page.locator('article.tcard').count()) break;
        const mc = page.locator('article.fmc');
        if (await mc.count()) {
          const prompt = (await page.locator('.fmc .q').innerText()).trim();
          const choices = page.locator('.fmc .choices .choice');
          let pick = 0;
          const want = known.get(prompt);
          if (want) {
            const n = await choices.count();
            for (let i = 0; i < n; i++) {
              if ((await choices.nth(i).locator('.t').innerText()).trim() === want) { pick = i; break; }
            }
          }
          await choices.nth(pick).click();
          known.set(prompt, (await page.locator('.fmc .choice.right .t').innerText()).trim());
          await page.locator('.fmc .fb .btn').click();
        }
      }
      await expect(page.locator('.tcard .t-meters')).toBeVisible();
      await scan(page);
    });

    test('axe: wine checkpoint intro (seeded past Stage 3)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE123);
      await page.goto('/checkpoint/wine');
      await expect(page.getByRole('button', { name: /start the shift check/i })).toBeVisible();
      await scan(page);
    });

    test('axe: prep-my-bottle picker (seeded past Stage 3)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE123);
      await page.goto('/prep');
      await expect(page.locator('.pick').first()).toBeVisible(); // full menu fetched
      await scan(page);
    });

    test('axe: prep-my-bottle deep-dive + presentation script', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE123);
      await page.goto('/prep');
      await page.locator('.pick').first().click();
      await expect(page.locator('.deep .d-meters')).toBeVisible();
      await scan(page); // the deep-dive
      await page.getByRole('button', { name: 'build my script' }).click();
      await expect(page.locator('.s-beats li').first()).toBeVisible();
      await scan(page); // the 60-second teleprompter
    });

    test('axe: prep-my-bottle self-check question + answer', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE123);
      await page.goto('/prep');
      await page.locator('.pick').first().click();
      await page.getByRole('button', { name: 'test myself' }).click();
      await expect(page.locator('.c-q')).toBeVisible();
      await scan(page); // the question face
      await page.getByRole('button', { name: 'show answer' }).click();
      await expect(page.locator('.c-a')).toBeVisible();
      await scan(page); // revealed answer + self-rate
    });

    test('prep is gated: a locked user (no progress) is redirected, never sees pours', async ({ page }) => {
      await page.goto('/prep'); // no seed → Wine stage locked
      await expect(page).toHaveURL(/\/$/); // bounced to the path home
      await expect(page.locator('.pick')).toHaveCount(0);
    });

    test('axe: pairing unit pretest MC (seeded past Stage 4)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE1234);
      await page.goto('/unit/pair-snacks');
      await expect(page.locator('.fmc .choices .choice').first()).toBeVisible();
      await scan(page);
    });

    test('axe: pairing teach card (dish → pour + lever)', async ({ page }) => {
      test.setTimeout(120_000); // drives the pair-snacks pretest first
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE1234);
      await page.goto('/unit/pair-snacks');
      const known = new Map<string, string>();
      for (let guard = 0; guard < 80; guard++) {
        if (await page.locator('article.tcard').count()) break;
        const mc = page.locator('article.fmc');
        if (await mc.count()) {
          const prompt = (await page.locator('.fmc .q').innerText()).trim();
          const choices = page.locator('.fmc .choices .choice');
          let pick = 0;
          const want = known.get(prompt);
          if (want) {
            const n = await choices.count();
            for (let i = 0; i < n; i++) {
              if ((await choices.nth(i).locator('.t').innerText()).trim() === want) { pick = i; break; }
            }
          }
          await choices.nth(pick).click();
          known.set(prompt, (await page.locator('.fmc .choice.right .t').innerText()).trim());
          await page.locator('.fmc .fb .btn').click();
        }
      }
      await expect(page.locator('.tcard')).toBeVisible();
      await scan(page);
    });

    test('axe: pairings checkpoint intro (seeded past Stage 4)', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_STAGE1234);
      await page.goto('/checkpoint/pairings');
      await expect(page.getByRole('button', { name: /start the shift check/i })).toBeVisible();
      await scan(page);
    });

    test('axe: 60-second burst — intro (seeded introduced items) + playing card', async ({ page }) => {
      await page.addInitScript((seed) => localStorage.setItem('bb3_progress_v1', seed), SEED_BURST);
      await page.goto('/burst');
      await expect(page.getByRole('button', { name: 'start the burst' })).toBeVisible();
      await scan(page); // the populated intro
      await page.getByRole('button', { name: 'start the burst' }).click();
      await expect(page.locator('.bcard .b-choice').first()).toBeVisible();
      await scan(page); // the rapid-fire MC card + HUD
    });
  });
}
