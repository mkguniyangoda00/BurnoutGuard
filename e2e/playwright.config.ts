import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: 'C:/Users/mguniyangoda/Documents/FYR/BurnoutGuard/e2e/reports/test-results',
  fullyParallel: false,
  retries: 1,
  timeout: 30_000,
  reporter: [
    ['html', { outputFolder: 'C:/Users/mguniyangoda/Documents/FYR/BurnoutGuard/e2e/reports/playwright-html' }],
    ['json', { outputFile: 'C:/Users/mguniyangoda/Documents/FYR/BurnoutGuard/e2e/reports/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node dev.js',
    cwd: '..',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  globalSetup: './playwright.global-setup.ts',
});
