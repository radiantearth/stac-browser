# E2E Tests

End-to-end tests for STAC Browser using [Playwright](https://playwright.dev). All tests run against mock data — no real network calls.

## Running

```bash
npm run test:e2e            # all tests
npm run test:e2e:ui         # interactive UI mode
npm run test:e2e:headed     # headed browser
npm run test:e2e:debug      # with Playwright Inspector
npm run test:e2e:report     # view HTML report
npx playwright test catalog.spec.js          # single file
npx playwright test --grep "map click"       # by name
```

## Structure

```
tests/
  fixtures/
    catalogs.json                              # STAC Index mock (homepage)
    catalogs/
      test-catalog/
        catalog.json                           # root static catalog
        eo-collection/collection.json          # collection with items
        eo-collection/item-2025-001.json
        eo-collection/item-2025-002.json
        climate-collection/collection.json     # second collection
  e2e/
    helpers.js             # mock registration & navigation utilities
    homepage.spec.js       # homepage / catalog index
    catalog.spec.js        # catalog browsing & navigation
    collection.spec.js     # collection metadata & assets
    item.spec.js           # item properties, geometry & assets
    searchpage.spec.js     # STAC API search page
```

## Helpers (`helpers.js`)

HTTP mocking is driven by **handler objects** — plain descriptors registered via `registerHandlers(page, handlers)`. Convenience functions build handler arrays from fixtures or inline data.

| Function | Purpose |
|---|---|
| `registerHandlers(page, handlers)` | Install an array of `{ url, method?, status?, body }` route handlers |
| `mockCatalogByFolder(page, catalogUrl)` | Mock all JSON files in a fixture folder (matched by `self` links) |
| `mockApiRootAndCollections(page)` | Mock a STAC API root + `/collections` + `/search` (for search page tests) |
| `loadMockCatalog(page, data, url)` | Navigate to a mocked catalog and wait for readiness |
| `mockStacResource(page, url, data)` | Mock a single URL |
| `mockStacError(page, url, status)` | Mock an error response |
| `waitForBrowserReady(page)` | Wait for loading indicators to clear |
| `waitForMapReady(page)` | Wait for the OpenLayers map to render |
| `waitForSearchPost(page)` | Capture the next `POST /search` request body |

## Fixtures

Static catalog fixtures live in `tests/fixtures/catalogs/<name>/`. Each JSON file must have a `self` link — `mockCatalogByFolder` uses these to register route handlers automatically.

The search page tests use inline mock data (API root with `conformsTo`, collections, empty search results) built by `apiRootHandlers()` in `helpers.js`.
