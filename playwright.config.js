const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 4173);
const backendPort = Number(process.env.E2E_BACKEND_PORT || 3100);
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}`;

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
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node tests/e2e/support/systemTestServer.js',
      url: `${backendUrl}/health`,
      env: { ...process.env, E2E_BACKEND_PORT: String(backendPort) },
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: `npx vite --host 127.0.0.1 --port ${frontendPort} --strictPort`,
      cwd: path.join(__dirname, 'frontend'),
      url: `${frontendUrl}/login`,
      env: {
        ...process.env,
        VITE_API_BASE_URL: `${backendUrl}/api`,
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
