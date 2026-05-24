import { defineConfig, devices } from '@playwright/test';

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
  // Per assertion (toBeVisible, toHaveCount, etc.). 3s was tight enough that
  // webkit, under heavy parallel-worker load, occasionally missed its mark
  // before Svelte's reactivity + render cycle finished. 5s keeps fast paths
  // fast while absorbing webkit's worst-case under contention.
  expect: { timeout: 5_000 },
  // Run as many parallel workers as the host has cores. With 3 browser projects
  // (chromium / firefox / webkit) and ~24 specs per project, parallelism is the
  // difference between a 30s suite and a multi-minute one.
  workers: '100%',
  testDir: 'tests',
  testMatch: /.*\.spec\.ts/,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
