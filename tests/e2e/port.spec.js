import { test, expect } from '@playwright/test';

// Simulates a server on port 3000 that returns absolute links WITHOUT the port,
// as commonly happens with reverse proxies. See #857.

const PORT_API_URL = "https://atlas.stacindex.org:3000";

// The server returns links without the port (reverse proxy scenario)
const NO_PORT_HOST = "https://atlas.stacindex.org";

const PORT_API_ROOT = {
  stac_version: "1.0.0",
  id: "test-port-api",
  title: "Test Port API",
  description: "Test API with port",
  type: "Catalog",
  conformsTo: [
    "https://api.stacspec.org/v1.0.0/item-search",
  ],
  links: [
    // Server returns absolute links WITHOUT the port
    { rel: "self", type: "application/json", href: `${NO_PORT_HOST}/` },
    { rel: "root", type: "application/json", href: `${NO_PORT_HOST}/` },
    { rel: "data", type: "application/json", href: `${NO_PORT_HOST}/collections` },
  ],
};

const PORT_COLLECTIONS = {
  collections: [
    {
      type: "Collection",
      id: "test-collection-1",
      title: "Test Collection 1",
      description: "Test collection 1",
      stac_version: "1.0.0",
      extent: {
        spatial: { bbox: [[-180, -90, 180, 90]] },
        temporal: { interval: [["2020-01-01T00:00:00Z", null]] },
      },
      links: [
        // Also returns self link without port
        { rel: "self", type: "application/json", href: `${NO_PORT_HOST}/collections/test-collection-1` },
        { rel: "root", type: "application/json", href: `${NO_PORT_HOST}/` },
      ],
    },
  ],
  links: [
    { rel: "self", type: "application/json", href: `${NO_PORT_HOST}/collections` },
    { rel: "root", type: "application/json", href: `${NO_PORT_HOST}/` },
  ],
};

test.describe('Port preservation in external URLs (#857)', () => {

  test('should preserve port when server returns absolute links without port', async ({ page }) => {
    const stacRequests = [];
    const requestsWithoutPort = [];

    // Intercept requests WITH port (correct behavior)
    await page.route(`${PORT_API_URL}/**`, async (route) => {
      const url = route.request().url();
      stacRequests.push(url);
      if (url.includes('/collections') && !url.includes('test-collection')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(PORT_COLLECTIONS),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(PORT_API_ROOT),
        });
      }
    });

    // Intercept requests WITHOUT port (indicates bug - port was lost)
    await page.route(`${NO_PORT_HOST}/**`, async (route) => {
      const url = route.request().url();
      if (!url.includes(':3000')) {
        requestsWithoutPort.push(url);
        await route.fulfill({
          status: 404,
          contentType: 'text/plain',
          body: 'Port missing - bug!',
        });
      }
    });

    // Navigate to the external URL with port
    await page.goto('/external/atlas.stacindex.org:3000/');

    // Wait for catalog title to appear, indicating successful load
    await expect(page.locator('h1').first()).toContainText('Test Port API', { timeout: 10000 });

    // Wait for background requests to complete
    await page.waitForTimeout(2000);

    // All subsequent requests should still include the port
    expect(stacRequests.length, 'At least one STAC request should be made').toBeGreaterThan(0);
    expect(requestsWithoutPort, 'No requests should be missing the port').toHaveLength(0);
  });
});
