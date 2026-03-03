/**
 * Custom Playwright test fixture with MSW (Mock Service Worker) integration.
 *
 * Re-exports `test` extended with a `worker` fixture that installs MSW's
 * service worker in the browser page.  Individual tests add handlers via
 * `worker.use(handler)`.
 *
 * Usage in spec files:
 *   import { test, expect } from './fixtures';
 *   test('...', async ({ page, worker }) => { ... });
 */
import { test as base, expect } from '@playwright/test';
import { createWorkerFixture } from 'playwright-msw';

const test = base.extend({
  worker: createWorkerFixture([]),
});

export { test, expect };
