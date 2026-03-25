import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-demo',
  timeout: 300_000,
  expect: { timeout: 30_000 },

  use: {
    baseURL: 'http://localhost:5173',
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    screenshot: 'on',
    viewport: { width: 1280, height: 720 },
    launchOptions: { slowMo: 300 },
    trace: 'on',
  },

  projects: [{ name: 'demo', use: { channel: 'chromium' } }],

  outputDir: './demo-videos/',
  workers: 1,
  fullyParallel: false,
});
