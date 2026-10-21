import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a production web export that points at a fake Supabase project
 * (`npm run export:e2e` → dist-e2e/); e2e/backend.ts answers its requests with in-test fixtures.
 * Three viewports mirror the prototype's device modes: phone 390 · tablet 820 · desktop 1280.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: { baseURL: 'http://127.0.0.1:4174', locale: 'ar', trace: 'retain-on-failure' },
  webServer: { command: 'node tools/serve-dist.mjs 4174 dist-e2e', url: 'http://127.0.0.1:4174', reuseExistingServer: true },
  projects: [
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
});
