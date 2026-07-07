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
        await new Promise(resolve => {
          setTimeout(resolve, delay);
        });
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

// ─── Management / Transaction Helpers ───────────────────────────────────────

/**
* Inject STAC Browser config overrides before the app boots.
*
* Merged-config reads `window.STAC_BROWSER_CONFIG` at module load, so this must
* run before any navigation. Use it to toggle the transaction options that
* otherwise default to `true` (requiring login and an OPTIONS preflight).
*
* @param {import('@playwright/test').Page} page
* @param {object} [overrides] – config keys to override (e.g. transactionsRequireLogin)
*/
export async function configureBrowser(page, overrides = {}) {
  await page.addInitScript((config) => {
    window.STAC_BROWSER_CONFIG = Object.assign({}, window.STAC_BROWSER_CONFIG, config);
  }, overrides);
}

/**
* Enable the management UI without login or preflight so the transaction
* controls are reachable in a test. Callers still need a server that advertises
* the relevant transaction conformance classes.
*
* @param {import('@playwright/test').Page} page
* @param {object} [overrides] – extra config overrides merged on top
*/
export async function enableTransactions(page, overrides = {}) {
  await configureBrowser(page, {
    transactions: true,
    transactionsRequireLogin: false,
    transactionsRequirePreflight: false,
    ...overrides
  });
}

/**
* Mock an OPTIONS preflight response that advertises the allowed HTTP methods
* via the `Allow` header (comma-separated, as real servers send it).
*
* @param {import('playwright-msw').MockServiceWorker} worker
* @param {string} url – exact URL to intercept
* @param {string[]} [methods=[]] – allowed methods, e.g. ['GET', 'PUT', 'DELETE']
*/
export async function mockOptions(worker, url, methods = []) {
  await worker.use(
    http.options(url, () =>
      // Use 200 with a (empty) body rather than 204: MSW's service worker drops
      // response headers on a null-body 204, which would hide the Allow header.
      // `Allow` is not a CORS-safelisted response header, so a cross-origin server
      // must also expose it explicitly for the browser to let JS read it.
      HttpResponse.json({}, {
        status: 200,
        headers: {
          Allow: methods.join(', '),
          'Access-Control-Expose-Headers': 'Allow'
        }
      })
    )
  );
}

/**
* Mock a transactional write (PUT/POST/DELETE) response for a URL.
*
* @param {import('playwright-msw').MockServiceWorker} worker
* @param {'put'|'post'|'delete'} method
* @param {string} url – exact URL to intercept
* @param {object} [options]
* @param {number} [options.status] – response status (defaults per method)
* @param {string} [options.location] – Location header (for POST create)
* @param {object|null} [options.body] – JSON body to return (null → empty body)
*/
export async function mockTransaction(worker, method, url, options = {}) {
  let status = options.status;
  if (status === undefined) {
    if (method === 'post') {
      status = 201;
    } else if (method === 'delete') {
      status = 204;
    } else {
      status = 200;
    }
  }
  const headers = {};
  if (options.location) {
    headers.Location = options.location;
  }
  await worker.use(
    http[method](url, () => {
      if (options.body === null || status === 204) {
        return new HttpResponse(null, { status, headers });
      }
      return HttpResponse.json(options.body ?? {}, { status, headers });
    })
  );
}

/**
* Open the "Manage" dropdown in the source toolbar and return its locator.
*
* @param {import('@playwright/test').Page} page
* @returns {Promise<import('@playwright/test').Locator>} the open dropdown menu
*/
export async function openManageMenu(page) {
  const button = page.getByRole('button', { name: /manage/i });
  await expect(button).toBeVisible();
  await button.click();
  const menu = page.locator('.dropdown-menu.show');
  await expect(menu).toBeVisible();
  return menu;
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
* Read the STAC Browser map state: the OpenLayers view (zoom + center in lon/lat)
* and the rendered footprint geometry. The OL map isn't exposed to the DOM, so we
* locate it via the MapView component instance, walking up from the map element
* through Vue's `__vueParentComponent`. This works in dev builds and in the e2e
* production build (which enables `__VUE_PROD_DEVTOOLS__` via STAC_BROWSER_E2E);
* real production builds are unaffected, so no test hook is needed in the
* application code. Assumes the map uses Web Mercator (EPSG:3857), the STAC
* Browser default. `lon`/`lat` are `null` when the view has no center yet.
*
* @param {import('@playwright/test').Page} page
* @returns {Promise<{zoom: number, lon: number|null, lat: number|null, footprintType: string|null, footprintPolygons: number}|null>} map state, or null if no map found
*/
export function getMapState(page) {
  return page.evaluate(() => {
    // Locate the OpenLayers map via the MapView component instance, walking up
    // from the map element through Vue's `__vueParentComponent`. This is available
    // in dev builds and in the e2e production build (which sets
    // __VUE_PROD_DEVTOOLS__ via STAC_BROWSER_E2E); real production builds are
    // unaffected, so no test hook is needed in the application code.
    let el = document.querySelector('.map-container .map') || document.querySelector('.map');
    let map = null;
    while (el) {
      const inst = el.__vueParentComponent;
      let candidate;
      try {
        candidate = inst?.proxy?.map ?? inst?.ctx?.map;
      } catch {
        candidate = null;
      }
      if (candidate && typeof candidate.getView === 'function') {
        map = candidate;
        break;
      }
      el = el.parentElement;
    }
    if (!map) {
      return null;
    }

    const view = map.getView();
    const center = view.getCenter();
    const zoom = view.getZoom();

    // Rendered footprint: ol-stac splits an antimeridian-crossing footprint into a
    // MultiPolygon, so report the number of polygons.
    const bounds = map.getAllLayers().find(l => l.get && l.get('bounds'));
    const features = (bounds?.getSource?.().getFeatures?.()) ?? [];
    const geom = features[0]?.getGeometry?.();
    const footprintType = geom?.getType?.() ?? null;
    let footprintPolygons = 0;
    if (footprintType === 'MultiPolygon') {
      footprintPolygons = geom.getPolygons().length;
    } else if (footprintType === 'Polygon') {
      footprintPolygons = 1;
    }

    let lon = null;
    let lat = null;
    if (center) {
      // Inverse spherical Mercator (EPSG:3857 -> EPSG:4326).
      const R = 20037508.342789244;
      lon = (center[0] / R) * 180;
      lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((center[1] / R) * Math.PI)) - Math.PI / 2);
    }
    return { zoom, lon, lat, footprintType, footprintPolygons };
  });
}

/**
* Wait until the bounding-box coordinate inputs have been auto-populated
* (i.e. all four fields are non-empty).
* 
* @param {import('@playwright/test').Page} page
*/
export async function waitForBboxInputsPopulated(page) {
  const labels = [/west longitude/i, /south latitude/i, /east longitude/i, /north latitude/i];
  await Promise.all(labels.map(label => {
    const input = page.getByLabel(label);
    return expect(input).not.toHaveValue('', { timeout: 10000 });
  }));
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
export const readClipboard = (page) => page.evaluate(() => navigator.clipboard.readText());

/**
* Clear system clipboard.
*
* @param {import('@playwright/test').Page} page
* @returns {Promise<void>}
*/
export const clearClipboard = (page) => page.evaluate(() => navigator.clipboard.writeText(''));

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
  return expect.poll(() => readClipboard(page)).not.toEqual('');
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
  return expect.poll(() => readClipboard(page)).not.toEqual('');
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
  return expect.poll(() => readClipboard(page)).not.toEqual('');
};
