import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT || '3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'tablet-chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
        viewport: { width: 360, height: 780 },
      },
    },
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI && !process.env.PLAYWRIGHT_PORT,
    timeout: 120_000,
  },
});

