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

/**
* Register a mock STAC resource response via MSW.
* Mocks a successful JSON response with the provided data.
* Used for homepage.spec.js tests to mock the STAC Index.
* 
* @param {import('playwright-msw').MockServiceWorker} worker
* @param {string} url – exact URL to intercept
* @param {object} mockData – the JSON data to return in the response
* @param {object} [options] – additional options for the mock response
* @param {number} [options.status=200] – HTTP status code for the response
* @param {number} [options.delay=0] – artificial delay in milliseconds before responding
*/
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

// ─── Page interaction Helpers ──────────────────────────────────────────────

/**
* Wait for STAC Browser to finish loading.
* 
* @param {import('@playwright/test').Page} page
*/
export async function waitForBrowserReady(page) {
  await page.waitForSelector('.loading', { state: 'hidden', timeout: 10000 }).catch(() => {
    // Loading indicator might not appear for fast loads
  });
  await page.waitForSelector('main, .browse, .catalog, .item', { timeout: 10000 });
}

/**
* Wait for the OpenLayers map to be interactive and fully initialized on the search page.
* This ensures the map has not only attached but also rendered its base layers,
* controls, and extent interaction.
* Returns the map container locator for clicking.
* 
* @param {import('@playwright/test').Page} page
* @returns {import('@playwright/test').Locator} mapContainer – Locator for the map container element
*/
export async function waitForMapReady(page) {
  const mapContainer = page.locator('.map-container .map');
  await mapContainer.waitFor({ state: 'visible', timeout: 10000 });
  
  // Wait for the viewport to be attached
  await mapContainer.locator('.ol-viewport').waitFor({ state: 'attached', timeout: 10000 });
  
  // Wait for OpenLayers to have rendered at least one layer (base layer)
  await page.locator('.ol-layer').first().waitFor({ state: 'visible', timeout: 10000 });
  
  return mapContainer;
}

/**
* Wait until the bounding-box coordinate inputs have been auto-populated
* (i.e. all four fields are non-empty).
* 
* @param {import('@playwright/test').Page} page
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
* @see https://playwright.dev/docs/network#wait-for-network-requests
* 
* @param {import('@playwright/test').Page} page
* @returns {Promise<{ body: object, url: string }>} The parsed request body and URL
*/
export async function waitForSearchPost(page) {
  const request = await page.waitForRequest(
    req => req.method() === 'POST' && req.url().includes('/search'),
  );
  return { body: JSON.parse(request.postData() || '{}'), url: request.url() };
}

/**
* Click the Source toolbar button and wait for the panel to appear.
* Returns the panel locator so callers can run further assertions on it.
* 
* @param {import('@playwright/test').Page} page
* @returns {import('@playwright/test').Locator} sourcePanel – Locator for the source panel element
*/
export async function openSourcePanel(page) {
  const sourceButton = page.getByRole('button', { name: /source/i });
  await expect(sourceButton).toBeVisible();
  await sourceButton.click();
  
  // The source panel/popover should appear after the click.
  const sourcePanel = page.locator('#popover-link');
  await expect(sourcePanel).toBeVisible();
  return sourcePanel;
}

// ─── Example Code Modal Helpers ──────────────────────────────────────────────

/**
* Read text from system clipboard.
*
* @param {import('@playwright/test').Page} page
* @returns {Promise<string>} clipboard content
*/
export const readClipboard = async (page) => page.evaluate(() => navigator.clipboard.readText());

/**
* Clear system clipboard.
*
* @param {import('@playwright/test').Page} page
* @returns {Promise<void>}
*/
export const clearClipboard = async (page) => page.evaluate(() => navigator.clipboard.writeText(''));

/**
* Click the "Example Code" button and wait for the modal to appear.
* Returns the modal locator for subsequent interactions.
*
* @param {import('@playwright/test').Page} page
* @returns {Promise<import('@playwright/test').Locator>} modal – Locator for the Example Code modal
*/
export const openExampleCodeModal = async (page) => {
  await page.getByRole('button', { name: /example code/i }).click();
  const modal = page.getByRole('dialog', { name: /example code/i });
  await expect(modal, 'Example Code Modal should be visible').toBeVisible();
  return modal;
};

/**
* Copy code from an Example Code modal panel.
* Clears clipboard, clicks the copy button, and polls until clipboard is populated.
*
* @param {import('@playwright/test').Page} page
* @param {import('@playwright/test').Locator} panel – The tabpanel locator (e.g. Python, JavaScript)
* @returns {Promise<string>} clipboard content after copy
*/
export const copyCodeFromModal = async (page, panel) => {
  await clearClipboard(page);
  await panel.locator('[id="exampleCodeCopyExampleCode"]').click();
  return expect.poll(async () => readClipboard(page)).not.toEqual('');
};

/**
* Copy dependencies from an Example Code modal panel.
* Clears clipboard, clicks the copy button, and polls until clipboard is populated.
*
* @param {import('@playwright/test').Page} page
* @param {import('@playwright/test').Locator} panel – The tabpanel locator (e.g. Python, JavaScript)
* @returns {Promise<string>} clipboard content after copy
*/
export const copyDependenciesFromModal = async (page, panel) => {
  await clearClipboard(page);
  await panel.locator('[id="exampleCodeCopyDependencies"]').click();
  return expect.poll(async () => readClipboard(page)).not.toEqual('');
};

/**
* Copy output filename from an Example Code modal panel.
* Clears clipboard, clicks the copy button, and polls until clipboard is populated.
*
* @param {import('@playwright/test').Page} page
* @param {import('@playwright/test').Locator} panel – The tabpanel locator (e.g. Python, JavaScript)
* @returns {Promise<string>} clipboard content after copy
*/
export const copyFilenameFromModal = async (page, panel) => {
  await clearClipboard(page);
  await panel.locator('[id="exampleCodeCopyOutputFilename"]').click();
  return expect.poll(async () => readClipboard(page)).not.toEqual('');
};
