# E2E Tests with Playwright

This repository contains end-to-end tests for STAC Browser implemented with Playwright.

## Overview

All E2E tests operate against **mock STAC data**; the fixtures live in the `catalogs/` folder at the repo root and are consumed by helper functions.  This strategy keeps the suite fast and deterministic by avoiding any real network calls.

The current test cases exercise the typical user flows:

- Homepage and catalog selection
- Catalog browsing and navigation (including nested catalogs)
- Collection pages with metadata, extents, assets, providers, and item lists
- Item pages with geometry, properties, assets, and links
- Validation view and links from the source popover
- Language switching, filtering, pagination, and error states

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test catalog.spec.js

# Run tests matching a pattern
npx playwright test --grep "should display catalog"
```

## Test Structure

```
# top‑level folders relevant to testing
catalogs/                  # mock fixture sets used by helpers
  microsoft-pc/            # example fixture used throughout the suite
    info.json              # catalog metadata
    collections.json       # list of child collections
    collections/           # folder containing collection details
      <id>/info.json       # collection metadata
      <id>/items.json      # paged items list
tests/
  e2e/
    homepage.spec.js       # Homepage and catalog selection tests
    catalog.spec.js        # Catalog view and navigation tests
    collection.spec.js     # Collection view tests
    item.spec.js           # Item view tests
    validation.spec.js     # Validation view and navigation tests
    helpers.js             # Shared helper functions for mocking & navigation
```

The `helpers.js` module includes `mockCatalogByFolder`, which resolves a catalog URL to a subfolder under `catalogs/` and automatically mocks all of the associated resources.  See the **Using Mock Data** section below for examples.

## Using Mock Data

### Folder‑based Fixtures

The primary way tests supply data is by pointing the browser at a mock catalog URL and letting `mockCatalogByFolder` load the corresponding fixture files.  Each folder mirrors the structure of a real STAC catalog and may include nested collections and items.

Example:

```javascript
import { test, expect } from '@playwright/test';
import { mockCatalogByFolder, loadMockCatalog } from './helpers';

// the folder name (last segment of URL) must match a directory under /catalogs
const url = 'https://example.com/microsoft-pc';

await mockCatalogByFolder(page, url);
await loadMockCatalog(page, await page.request.fetch(url), url);
// alternatively, loadMockCatalog can be called with the in-memory object

await expect(page.getByRole('heading', { name: /microsoft planetary computer stac api/i }))
  .toBeVisible();
```

(The helper functions used above are described in the following section.)

### Mocking individual resources

Some tests still create ad‑hoc mock objects or intercept specific URLs directly.  The helpers `mockStacResource`, `mockStacResources` and `mockStacError` make this easy, as shown earlier in the suite history.  For example:

```javascript
import { mockStacResource } from './helpers';

const item = { id: 'foo', type: 'Feature', properties: { title: 'Foo' } };
await mockStacResource(page, 'https://example.com/item.json', item);
await page.goto('/?catalogUrl=https://example.com/item.json');
```
### Mock Network Requests

```javascript
import { mockStacResource, createMockCollection } from './helpers';

test('should load collection', async ({ page }) => {
  const collection = createMockCollection({
    title: 'Test Collection'
  });
  
  const url = 'https://example.com/collection.json';
  await mockStacResource(page, url, collection);
  
  await page.goto(`/?catalogUrl=${encodeURIComponent(url)}`);
  
  // Test assertions...
});
```

### Mock Catalog Hierarchy

```javascript
import { mockCatalogHierarchy } from './helpers';

test('should navigate hierarchy', async ({ page }) => {
  await mockCatalogHierarchy(page, {
    catalogUrl: 'https://example.com/catalog.json',
    collectionCount: 3,
    itemsPerCollection: 5
  });
  
  await page.goto('/?catalogUrl=https://example.com/catalog.json');
  
  // Navigate through hierarchy...
});
```

### Mock Errors

```javascript
import { mockStacError } from './helpers';

test('should handle 404', async ({ page }) => {
  await mockStacError(page, 'https://example.com/missing.json', 404);
  
  await page.goto('/?catalogUrl=https://example.com/missing.json');
  
  await expect(page.locator('.error-alert')).toBeVisible();
});
```

## Helper Functions

All helpers live in [`tests/e2e/helpers.js`](tests/e2e/helpers.js).  Highlights:

- `mockStacResource(page, urlPattern, mockData, options)` - intercepts a request and returns `mockData`.
- `mockStacResources(page, mocks)` - batch version of the above.
- `mockCatalogByFolder(page, catalogUrl)` - load a full fixture set from `catalogs/<name>`.
- `loadMockCatalog(page, catalogData, catalogUrl)` - navigate the browser to a mocked catalog URL and wait for readiness.
- `waitForBrowserReady(page)` - helper that waits for initial loading indicators to disappear.
- `mockStacError(page, urlPattern, status, message)` - simulate HTTP errors.

## Fixtures

The actual JSON fixtures used by the tests are located under the top‑level `catalogs/` directory.  Each subfolder represents a different dataset (the suite currently uses a `microsoft-pc` fixture with a variety of catalog, collection, and item files).  See [`catalogs/README.md`](catalogs/README.md) for more details on the folder format.  The helpers load these files dynamically based on the catalog URL provided in the test.
## Writing Tests

Tests are located in the `tests/e2e` directory and follow the naming convention `*.spec.js`.

Example test structure:

```javascript
import { test, expect } from '@playwright/test';
import { createMockCatalog, loadMockCatalog } from './helpers';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    const catalog = createMockCatalog({
      title: 'Test Catalog'
    });
    
    await loadMockCatalog(page, catalog);
    
    // Add test assertions
    await expect(page.locator('h1')).toContainText('Test Catalog');
  });
});
```

## CI/CD Integration

Tests run automatically in CI with:
- Retry on failure (2 retries)
- Sequential execution for stability
- HTML report generation
- Screenshots and videos on failure

## Debugging

### Interactive UI Mode

```bash
npm run test:e2e:ui
```

Best for developing and debugging tests interactively.

### Debug Mode

```bash
npm run test:e2e:debug
```

Runs tests with the Playwright Inspector for step-by-step debugging.

### Headed Mode

```bash
npm run test:e2e:headed
```

See the browser while tests run.

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
