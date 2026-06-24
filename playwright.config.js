import { defineConfig, devices } from '@playwright/test'

// Target the running dev server by default; override with BASE_URL=... to point
// at a preview build or a deployed URL.
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const isLocal = /localhost|127\.0\.0\.1/.test(BASE_URL)

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  // Only manage the dev server when testing locally. reuseExistingServer keeps
  // the already-running `npm run dev` (it won't spawn a second one).
  ...(isLocal && {
    webServer: {
      command: 'npm run dev',
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  }),
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
