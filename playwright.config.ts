import { defineConfig, devices } from '@playwright/test';

// Încarcă variabilele din .env (dacă există); valorile deja setate în shell au prioritate.
try {
  process.loadEnvFile('.env');
} catch {
  // fără .env se folosesc valorile implicite
}

const BASE_URL = process.env.BASE_URL ?? 'https://dauron-trust.com';
// HEADLESS=true pentru rulare fără fereastră (implicit: browser vizibil)
const HEADLESS = process.env.HEADLESS === 'true' || !!process.env.CI;
const SLOW_MO = Number(process.env.SLOW_MO ?? 0);

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: Number(process.env.WORKERS ?? (process.env.CI ? 2 : 4)),
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    // site-ul expune id-uri stabile (menu-logo, contact-submit-button...): getByTestId('x') caută după id
    testIdAttribute: 'id',
    headless: HEADLESS,
    launchOptions: { slowMo: SLOW_MO },
    locale: 'ro-RO',
    timezoneId: 'Europe/Bucharest',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    extraHTTPHeaders: { 'X-E2E-Test': 'dauron-trust-e2e' },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] }, testIgnore: /visual\.spec|tour\.spec/ },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, testIgnore: /visual\.spec|tour\.spec/ },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] }, grep: /@smoke/, testIgnore: /visual\.spec|tour\.spec/ },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] }, grep: /@smoke/, testIgnore: /visual\.spec|tour\.spec/ },
    // tur prin toate paginile, câte un proiect pe motor – rulat separat: npm run test:tour (repetat) sau test:tour:once
    { name: 'tour-chromium', use: { ...devices['Desktop Chrome'], launchOptions: { slowMo: SLOW_MO, args: ['--disable-blink-features=AutomationControlled'] } }, testMatch: /tour\.spec/ },
    { name: 'tour-firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /tour\.spec/ },
    { name: 'tour-webkit', use: { ...devices['Desktop Safari'] }, testMatch: /tour\.spec/ },
    // regresie vizuală – rulată separat: npm run test:visual
    { name: 'visual-desktop', use: { ...devices['Desktop Chrome'] }, testMatch: /visual\.spec/ },
    { name: 'visual-mobile', use: { ...devices['Pixel 7'] }, testMatch: /visual\.spec/ },
  ],
});
