import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run build && npm run preview',
    port: 3000,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:3000',
    // The site is static + SSR — every assertion either resolves in <1s or signals
    // a real problem. Tight timeouts make failures surface instantly instead of
    // hanging for the default 30s.
    actionTimeout: 5_000,
    navigationTimeout: 10_000
  },
  // Per-test cap — covers setup + actions + assertions.
  timeout: 15_000,
  // Per assertion (toBeVisible, toHaveCount, etc.).
  expect: { timeout: 3_000 },
  testDir: 'tests',
  testMatch: /.*\.spec\.ts/
});
