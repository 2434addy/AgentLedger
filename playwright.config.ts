import { defineConfig } from 'playwright/test';

/**
 * Playwright config for AgentLedger E2E tests.
 * These are pure API tests — no browser is launched.
 * Base URL points at the NestJS backend running locally on port 3001.
 *
 * Run: npx playwright test --config playwright.config.ts
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Journey tests are sequential; run serially
  timeout: 30_000, // 30 s per test
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker — tests share state across the journey
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:3001',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
    trace: 'on-first-retry',
  },
});
