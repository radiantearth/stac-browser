export const HOME_PATH = '/';

/**
 * Mock a STAC resource by URL pattern
 * @param {Page} page - Playwright page object
 * @param {string|RegExp} urlPattern - URL pattern to match
 * @param {Object} mockData - Mock STAC data to return
 * @param {Object} options - Additional options (status, contentType)
 */
export async function mockStacResource(page, urlPattern, mockData, options = {}) {
  const {
    status = 200,
    contentType = 'application/json',
    delay = 0
  } = options;

  await page.route(urlPattern, async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    await route.fulfill({
      status,
      contentType,
      body: JSON.stringify(mockData)
    });
  });
}

/**
 * Navigate to a catalog using mock data
 * @param {Page} page - Playwright page object
 * @param {Object} catalogData - Mock catalog data  
 * @param {string} catalogUrl - URL of the catalog (defaults to example.com)
 */
export async function loadMockCatalog(page, catalogData, catalogUrl = 'https://example.com/catalog.json') {
  // Set up route mock FIRST, before navigation
  await mockStacResource(page, catalogUrl, catalogData);
  
  // Convert URL to browser path (e.g., /external/example.com/catalog.json)
  const url = new URL(catalogUrl);
  const protocol = url.protocol !== 'https:' ? url.protocol : '';
  const protocolPart = protocol ? `/${protocol}` : '';
  const browserPath = `/external${protocolPart}/${url.host}${url.pathname}${url.search}`;
  
  // Navigate to the browser path
  await page.goto(browserPath);
  
  // Wait for the catalog to load
  await waitForBrowserReady(page);
}

/**
 * Wait for STAC Browser to finish loading
 * @param {Page} page - Playwright page object
 */
export async function waitForBrowserReady(page) {
  // Wait for loading to finish
  await page.waitForSelector('.loading', { state: 'hidden', timeout: 10000 }).catch(() => {
    // Loading indicator might not appear for fast loads
  });
  
  // Wait for main content to be visible
  await page.waitForSelector('main, .browse, .catalog, .item', { timeout: 10000 });
}

/**
 * Mock an error response for a STAC resource
 * @param {Page} page - Playwright page object
 * @param {string|RegExp} urlPattern - URL pattern to match
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 */
export async function mockStacError(page, urlPattern, status = 404, message = 'Not Found') {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        code: status,
        description: message
      })
    });
  });
}


/**
 * Mock a catalog and its collections/items based on a fixtures folder name.
 * The URL's last path segment is used as the folder under tests/fixtures/catalogs
 * e.g. catalogUrl 'https://example.com/microsoft-pc' -> fixtures/catalogs/microsoft-pc/*
 */
import path from 'path';
import fs from 'fs';
export async function mockCatalogByFolder(page, catalogUrl) {
  const name = catalogUrl.replace(/.*\/([^/]+)$/, '$1');
  // compute base path relative to this module using import.meta.url
  const fixturesRoot = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname);
  const base = path.join(fixturesRoot, name);

  function loadJson(rel) {
    const full = path.join(base, rel);
    if (!fs.existsSync(full)) {
      throw new Error(`fixture not found: ${full}`);
    }
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  }

  const catalog = loadJson('info.json');
  await mockStacResource(page, catalogUrl, catalog);

  // collections list if present
  try {
    const collList = loadJson('collections.json');
    await mockStacResource(page, `${catalogUrl}/collections`, collList);
    for (const c of collList.collections) {
      const id = c.id;
      const collUrl = new URL(c.links.find(l => l.rel==='self').href).href;
      const relPath = `collections/${id}/info.json`;
      await mockStacResource(page, collUrl, loadJson(relPath));
      const itemsPath = `collections/${id}/items.json`;
      if (fs.existsSync(path.join(base, itemsPath))) {
        await mockStacResource(page, `${collUrl.replace(/\/[^/]+$/,'')}/items`, loadJson(itemsPath));
      }
    }
  } catch (err) {
    // no collections.json – ignore
  }
}
