import { defineConfig, devices } from '@playwright/test';

// NOT 4319 (v2's e2e port): reuseExistingServer would happily reuse a running
// v2 preview and test the wrong app. 4321 is the dev-preview server; stay clear.
const PORT = 4323;

// E2E gates (spec §16) run against the PRODUCTION build served by `vite preview`,
// so the service worker + precache are real (needed for the offline test).
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  // reducedMotion: axe must measure the settled state, not a mid-entrance fade
  // (the .screen fade transiently lowers opacity → false-positive contrast hits).
  use: { baseURL: `http://localhost:${PORT}`, trace: 'on-first-retry', reducedMotion: 'reduce' },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: true
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
