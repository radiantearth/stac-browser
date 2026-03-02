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

Search page fixtures live in `tests/fixtures/api/` (root, collections, search responses) and are loaded by `apiRootHandlers()` in `helpers.js`.
