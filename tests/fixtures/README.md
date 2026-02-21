# Test Fixtures

The E2E tests rely on a set of static STAC resources packaged under the `catalogs/` folder at the repository root.  Each subdirectory corresponds to a mock catalog and may contain collections, items, and other supporting JSON files.  These fixtures remove any dependency on external servers and are consumed by the helper functions in `tests/e2e/helpers.js`.

Mock data are purely JSON and mirror the structure that the browser expects when loading a real STAC catalog or API.

## Adding new fixtures

To introduce a new fixture dataset:

1. Create a new folder under `catalogs/` with a unique name (e.g. `my-test-catalog`).
2. Place an `info.json` file that represents the catalog object itself.
3. If the catalog has collections, add a `collections.json` listing the child links and a `collections/` subfolder containing each collection's `info.json` and optional `items.json` files.
4. For items-only catalogs, you can provide an `items.json` directly alongside `info.json`.

By convention the last segment of the catalog URL used in a test (`https://example.com/my-test-catalog`) maps to the fixture folder name.

(The previous factory-based mechanism has been retired in favor of the static folder layout described above.  Tests that require ad‑hoc data still build their own objects in-place using plain JavaScript.)

## Usage in Tests

### Folder fixture example

```javascript
import { test, expect } from '@playwright/test';
import { mockCatalogByFolder, loadMockCatalog } from '../e2e/helpers';

const url = 'https://example.com/microsoft-pc';
test('open the microsoft catalog via fixtures', async ({ page }) => {
  await mockCatalogByFolder(page, url);
  await loadMockCatalog(page, await page.request.fetch(url), url);
  await expect(page.getByRole('heading', { name: /microsoft planetary computer stac api/i })).toBeVisible();
});
```

### Direct mocks

For small, one-off cases tests can still create simple objects on the fly and intercept the request with `mockStacResource` or `mockStacError` (see `tests/e2e/helpers.js`).

### Mock Errors

```javascript
import { mockStacError } from './helpers';

test('should handle 404 error', async ({ page }) => {
  await mockStacError(page, 'https://example.com/missing.json', 404);
  
  await page.goto('/?catalogUrl=https://example.com/missing.json');
  
  await expect(page.locator('.error-alert')).toBeVisible();
});
```

<!-- no longer applicable -->

## Best Practices

1. **Organize fixtures by folder** – a clear name makes it easy to reuse in multiple tests.
2. **Mirror production structure** – keep the JSON as close to real API responses as possible.
3. **Keep related files together** – child collections and their items belong in the same subdirectory.
4. **Use `mockCatalogByFolder` wherever possible** – it automatically mocks all expected endpoints.
5. **For ad‑hoc cases, build objects inline** – there’s no longer a separate factory library.

## STAC Compliance

All fixtures comply with STAC specification:
- Version: 1.0.0
- Follow proper link relationships (self, root, parent, child, item, collection)
- Include required fields for each entity type
- Use valid STAC extensions where applicable

## Real Data Fixtures

For testing with actual production STAC data from public APIs:

- **`real-planetary-computer-api.json`** - Microsoft Planetary Computer STAC API
- **`real-earth-search-api.json`** - Earth Search by Element 84
- **`real-sentinel-2-collection.json`** - Real Sentinel-2 satellite collection (14 KB)
- **`real-sentinel-2-item.json`** - Real Sentinel-2 item with full assets (22 KB)

**See [REAL_DATA.md](REAL_DATA.md) for detailed documentation and usage examples.**

### Quick Example with Real Data

```javascript
import realCollection from '../fixtures/real-sentinel-2-collection.json' with { type: 'json' };
import { loadMockCatalog } from './helpers';

test('should display real Sentinel-2 collection', async ({ page }) => {
  await loadMockCatalog(page, realCollection);
  
  await expect(page.getByText(/Sentinel-2 Level-2A/i)).toBeVisible();
  await expect(page.getByText(/ESA/i)).toBeVisible();
});
```

## Fetching Fresh Real Data

Use the included script to fetch the latest data from public STAC APIs:

```bash
node tests/fixtures/fetch-real-data.js catalog "https://planetarycomputer.microsoft.com/api/stac/v1/"
node tests/fixtures/fetch-real-data.js collection "https://planetarycomputer.microsoft.com/api/stac/v1/collections/naip"
```

## Resources

- [Real Data Documentation](REAL_DATA.md) - Detailed guide to real STAC fixtures
- [STAC Index](https://stacindex.org) - Directory of 100+ public STAC catalogs
- [STAC Specification](https://github.com/radiantearth/stac-spec)
- [STAC Examples](https://github.com/radiantearth/stac-spec/tree/master/examples)
- [Playwright Documentation](https://playwright.dev/docs/intro)
