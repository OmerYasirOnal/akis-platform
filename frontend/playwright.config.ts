import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

// Use 127.0.0.1 to avoid IPv6 localhost (::1) ECONNREFUSED issues on macOS
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';

const reporters: ReporterDescription[] = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
];

if (process.env.CI) {
  reporters.push(['github']);
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 240_000,
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  expect: {
    timeout: 5_000,
  },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: reporters,
  outputDir: 'test-results/playwright',
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

