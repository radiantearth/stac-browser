# Testing

## Fixtures

Test data is built dynamically using **builders**, **instances**, and **templates**. This approach avoids hardcoding JSON fixtures for each edge case.

### Instances

Instance classes (in `tests/fixtures/instances/`) use builders and register MSW [(Mock Service Worker)](https://github.com/valendres/playwright-msw) handlers for the test.

**Key classes:**
- `API` – Dynamic mocking of a STAC API.
- `Static` – Simple static STAC catalog.

**Typical workflow:**

Dynamic API:
```javascript
import API from '../fixtures/instances/api.js';

// 1. Create an API instance (loads api-root.json template)
const api = API.defaultApi();

// 2. Add collections and items using builders
const collection = api.addCollection('sentinel-2', {
  url: 'collections/sentinel-2'
});
collection.setMetadata({ 
  title: 'Sentinel-2 L2A',
  extent: { spatial: {...}, temporal: {...} }
});

// 3. Add items to the collection
const item = api.addItem(collection, 'S2A_MSIL2A_20230101', {
  url: 'collections/sentinel-2/items/S2A_MSIL2A_20230101'
});

// 4. Register the mock server with MSW for the test
await api.createServer(worker);
```

After `createServer(worker)`, all registered endpoints respond with built JSON. Use `createServer(worker, {verbose: true})` to view registered endpoints in the console during testing. `createServer(worker)` needs to be executed within the scope of a test to be functional - with recurring setups, use `test.beforeEach()` to prevent duplication.

The default root-uri of the API is set to be `https://stac.example/api/`. It can be overridden by passing `{ url: 'https://other-stac.example/' }` as options to the constructor.

Static catalogs are created similarly:

```javascript
import StaticCatalog from '../fixtures/instances/static.js';
const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
const collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
    
collection.addItem({ url: 'https://stac.example/item.json' });

await catalog.createServer(worker);
```

### Builders

Builder classes (in `tests/fixtures/builders/`) construct STAC objects. The class hierarchy is based off the structure found in [stac-js](https://github.com/moregeo-it/stac-js).

**Example usage:**
```javascript
const catalog = new Catalog(instance, templateData, 'https://example.com/catalog');
catalog.addConformsTo('https://stac-spec.org/v1.1.0/json-schema/catalog.json')
  .addChildLink(childCatalog)
  .addSearchLink()
  .setMetadata({ title: 'My Catalog' });
```

Builders maintain internal JSON (`data`). Calling `.build()` on a STAC object will return the STAC-conformant JSON representation of the given object.

### Templates

Reusable JSON skeletons stored in `tests/fixtures/templates/`. Each builder type loads a default template:

- `catalog/` – STAC Catalog skeleton
- `collection/` – STAC Collection skeleton  
- `item/` – STAC Item skeleton
- `collectionCollection/` – Collection list response
- `itemCollection/` – Item collection response
- `catalogs.json` – STAC index mock for homepage testing

`minimal.json` templates contain only required fields, while `default.json` templates may include additional common optional fields and example data. 
Templates are loaded once and cloned for each builder instance.

## Helpers (`helpers.js`)

HTTP mocking is driven by [playwright-msw](https://github.com/valendres/playwright-msw). Convenience functions build handler arrays from fixtures or inline data.

| Function | Purpose |
|---|---|
| `mockStacResource(worker, url, mockData, options)` | Mock a single URL |
| `mockStacError(page, url, status)` | Mock an error response |
| `waitForBrowserReady(page)` | Wait for loading indicators to clear |
| `waitForMapReady(page)` | Wait for the OpenLayers map to render |
| `waitForSearchPost(page)` | Capture the next `POST /search` request body |
| `readClipboard(page)` | Read text from system clipboard |
| `clearClipboard(page)` | Clear the system clipboard |
| `openExampleCodeModal(page)` | Click "Example Code" button and wait for modal |
| `copyCodeFromModal(page, panel)` | Copy code snippet from modal panel |
| `copyDependenciesFromModal(page, panel)` | Copy dependencies from modal panel |
| `copyFilenameFromModal(page, panel)` | Copy output filename from modal panel |