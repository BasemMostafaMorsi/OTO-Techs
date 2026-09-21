import { defineConfig, devices } from '@playwright/test';
declare const require: (moduleName: string) => any;
declare const __dirname: string;
const fs = require('fs');
const path = require('path');
declare const process: {
  env: Record<string, string | undefined>;
};

function loadLocalEnvironment(): void {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^\uFEFF/, '');
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');

    process.env[key] ??= value;
  }
}

loadLocalEnvironment();
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 45_000,
  expect: { timeout: 10_000 },

  // ERP tests create and reuse business data, so serial execution is safer.
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://luxora.poweritech.com',
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
