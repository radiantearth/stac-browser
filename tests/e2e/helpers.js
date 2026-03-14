/**
 * E2E test helpers for STAC Browser.
 *
 * All HTTP mocking is driven by **MSW (Mock Service Worker)** handlers.
 * Handler-building functions return arrays of MSW `http.*` request handlers.
 * Mocking helpers accept a `worker` fixture (from playwright-msw) and call
 * `worker.use()` to install handlers for the current test.
 *
 * Navigation / assertion helpers still accept a Playwright `page` object.
 */

import { expect } from '@playwright/test';
import { http, HttpResponse } from 'msw';

// ─── Constants ───────────────────────────────────────────────────────────────

export const HOME_PATH = '/';

export async function mockStacResource(worker, url, mockData, options = {}) {
  const status = options.status ?? 200;
  const delay = options.delay ?? 0;
  await worker.use(
    http.all(url, async () => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return HttpResponse.json(mockData, { status });
    }),
  );
}

/**
 * Register an error response for a URL via MSW.
 *
 * @param {import('playwright-msw').MockServiceWorker} worker
 * @param {string} url – exact URL to intercept
 * @param {number} [status=404]
 * @param {string} [message='Not Found']
 */
export async function mockStacError(worker, url, status = 404, message = 'Not Found') {
  await worker.use(
    http.all(url, () => {
      return HttpResponse.json(
        { code: status, description: message },
        { status },
      );
    }),
  );
}

/**
 * Wait for STAC Browser to finish loading.
 */
export async function waitForBrowserReady(page) {
  await page.waitForSelector('.loading', { state: 'hidden', timeout: 10000 }).catch(() => {
    // Loading indicator might not appear for fast loads
  });
  await page.waitForSelector('main, .browse, .catalog, .item', { timeout: 10000 });
}

// ─── Search-page helpers ────────────────────────────────────────────────────

/**
 * Wait for the OpenLayers map to be interactive on the search page.
 * Returns the map container locator for clicking.
 */
export async function waitForMapReady(page) {
  const mapContainer = page.locator('.map-container .map');
  await mapContainer.waitFor({ state: 'visible', timeout: 10000 });
  await mapContainer.locator('.ol-viewport').waitFor({ state: 'attached', timeout: 10000 });
  return mapContainer;
}

/**
 * Wait until the bounding-box coordinate inputs have been auto-populated
 * (i.e. all four fields are non-empty).
 */
export async function waitForBboxInputsPopulated(page) {
  const labels = [/west longitude/i, /south latitude/i, /east longitude/i, /north latitude/i];
  for (const label of labels) {
    const input = page.getByLabel(label);
    await expect(input).not.toHaveValue('', { timeout: 10000 });
  }
}

/**
 * Wait for the next POST /search request and return its parsed body.
 * Call this *before* the action that triggers the search.
 *
 * Uses `page.waitForRequest` which fires at the CDP level — it sees the
 * request even when MSW's service worker intercepts it before the network.
 */
export async function waitForSearchPost(page) {
  const request = await page.waitForRequest(
    req => req.method() === 'POST' && req.url().includes('/search'),
  );
  return { body: JSON.parse(request.postData() || '{}'), url: request.url() };
}
