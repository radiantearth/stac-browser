import { defineConfig, devices } from '@playwright/test';

function getEnvWithoutSB() {
  const env = {};
  for (const key in process.env) {
    if (!key.startsWith('SB_')) {
      env[key] = process.env[key];
    }
  }
  return env;
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  
  /* GitHub ubuntu-latest runners have 4 vCPUs; the suite is fully parallel
     (per-test MSW mocks, no shared state) and runs ~10x faster than serial. */
  workers: process.env.CI ? 4 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.CI
      ? 'http://localhost:4173'  // Vite preview server port
      : 'http://localhost:8181', // Dedicated test port; 8080 may be occupied by unrelated local services
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Clipboard permissions for copy-related tests */
    permissions: ['clipboard-read', 'clipboard-write'],
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',

    /* Force English locale so tests are deterministic regardless of host/CI locale.
       The app auto-detects language from navigator.languages when detectLocaleFromBrowser is true. */
    locale: 'en',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test on Firefox and WebKit
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI
    ? {
        // In CI: Build and serve the production build
        command: 'pnpm run build && pnpm exec vite preview --port 4173 --strictPort',
        env: getEnvWithoutSB(),
        url: 'http://localhost:4173',
        reuseExistingServer: false,
        timeout: 120 * 1000,
      }
    : {
        // Dedicated port + strictPort so the tests never silently reuse an
        // unrelated service that happens to listen on the default dev port.
        command: 'pnpm start --port 8181 --strictPort',
        url: 'http://localhost:8181',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
});
