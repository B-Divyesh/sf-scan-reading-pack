import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // Keep the release gate at two workers, while resource-intensive OCR checks
  // explicitly run once in the desktop project (see their project guards).
  workers: 2,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-390', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run preview:test',
    url: 'http://127.0.0.1:4173',
    // The release suite must own its preview server. Reusing a process that is
    // being torn down by another browser command can turn a clean run into
    // intermittent connection-refused failures.
    reuseExistingServer: false,
  },
});
