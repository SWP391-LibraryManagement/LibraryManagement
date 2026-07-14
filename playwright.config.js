const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node tests/e2e/support/systemTestServer.js',
      url: 'http://127.0.0.1:3100/health',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'npx vite --host 127.0.0.1 --port 4173 --strictPort',
      cwd: path.join(__dirname, 'frontend'),
      url: 'http://127.0.0.1:4173/login',
      env: {
        ...process.env,
        VITE_API_BASE_URL: 'http://127.0.0.1:3100/api',
      },
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
