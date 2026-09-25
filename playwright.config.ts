import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    // Allows local verification with an installed Chrome when Playwright's bundled browser is unavailable.
    channel: (process.env.PLAYWRIGHT_CHANNEL || 'chrome') as any,
  },
  webServer: {
    command: 'npm run build:full && npm start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 180000,
  },
});
