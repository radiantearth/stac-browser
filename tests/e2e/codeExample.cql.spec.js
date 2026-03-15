import { test, expect } from '@playwright/test';
import { SEARCH_PATH } from './helpers';

const openExampleCodeModal = async (page) => {
  await page.getByRole('button', { name: /example code/i }).click();
  const modal = page.getByRole('dialog', { name: /example code/i });
  await expect(modal, 'Example Code Modal should be visible').toBeVisible();
  return modal;
};

const readClipboard = async (page) => page.evaluate(() => navigator.clipboard.readText());
const clearClipboard = async (page) => page.evaluate(() => navigator.clipboard.writeText(''));
const copyCodeFromModal = async (page, panel) => {
  await clearClipboard(page);
  await panel.locator('[id="exampleCodeCopyExampleCode"]').click();
  return expect.poll(async () => readClipboard(page)).not.toEqual('');
};

const mockTextOnlyCqlApi = async (page) => {
  const API_ROOT_URL = 'https://earth-search.aws.test.com/v1';
  const SEARCH_API_URL = `${API_ROOT_URL}/search`;
  const API_COLLECTIONS_URL = `${API_ROOT_URL}/collections`;
  const API_QUERYABLES_URL = `${API_ROOT_URL}/queryables`;

  await page.route(API_ROOT_URL, async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stac_version: '1.0.0',
          id: 'test-api',
          title: 'Test API',
          description: 'Test API root with text-only CQL support',
          conformsTo: [
            'https://api.stacspec.org/v1.0.0/item-search',
            'https://api.stacspec.org/v1.0.0/item-search#filter',
            'http://www.opengis.net/spec/cql2/1.0/conf/cql2-text'
          ],
          links: [
            { rel: 'self', type: 'application/json', href: API_ROOT_URL },
            { rel: 'search', type: 'application/geo+json', href: SEARCH_API_URL, method: 'POST' },
            { rel: 'collections', type: 'application/json', href: API_COLLECTIONS_URL },
            { rel: 'queryables', type: 'application/schema+json', href: API_QUERYABLES_URL }
          ]
        })
      });
      return;
    }
    await route.continue();
  });

  await page.route(API_COLLECTIONS_URL, async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collections: [],
          links: [
            { rel: 'self', type: 'application/json', href: API_COLLECTIONS_URL },
            { rel: 'root', type: 'application/json', href: API_ROOT_URL }
          ],
          context: { page: 1, limit: 0, matched: 0, returned: 0 }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/queryables**', async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/schema+json',
        body: JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            id: {
              type: 'string',
              title: 'Identifier'
            }
          }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.route(SEARCH_API_URL, async (route, request) => {
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'FeatureCollection',
          features: [],
          links: []
        })
      });
      return;
    }
    await route.continue();
  });
};

const mockGetSearchWithJsonCqlApi = async (page) => {
  const API_ROOT_URL = 'https://earth-search.aws.test.com/v1';
  const SEARCH_API_URL = `${API_ROOT_URL}/search`;
  const API_COLLECTIONS_URL = `${API_ROOT_URL}/collections`;
  const API_QUERYABLES_URL = `${API_ROOT_URL}/queryables`;

  await page.route(API_ROOT_URL, async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stac_version: '1.0.0',
          id: 'test-api',
          title: 'Test API',
          description: 'Test API root with GET item search and JSON CQL support',
          conformsTo: [
            'https://api.stacspec.org/v1.0.0/item-search',
            'https://api.stacspec.org/v1.0.0/item-search#filter',
            'http://www.opengis.net/spec/cql2/1.0/conf/cql2-json'
          ],
          links: [
            { rel: 'self', type: 'application/json', href: API_ROOT_URL },
            { rel: 'search', type: 'application/geo+json', href: SEARCH_API_URL, method: 'GET' },
            { rel: 'collections', type: 'application/json', href: API_COLLECTIONS_URL },
            { rel: 'queryables', type: 'application/schema+json', href: API_QUERYABLES_URL }
          ]
        })
      });
      return;
    }
    await route.continue();
  });

  await page.route(API_COLLECTIONS_URL, async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collections: [],
          links: [
            { rel: 'self', type: 'application/json', href: API_COLLECTIONS_URL },
            { rel: 'root', type: 'application/json', href: API_ROOT_URL }
          ],
          context: { page: 1, limit: 0, matched: 0, returned: 0 }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/queryables**', async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/schema+json',
        body: JSON.stringify({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            id: {
              type: 'string',
              title: 'Identifier'
            }
          }
        })
      });
      return;
    }
    await route.continue();
  });
};

test.describe('STAC Browser code example CQL modal', () => {
  test('generates valid example code for text-only CQL backend', async ({ page }) => {
    await mockTextOnlyCqlApi(page);
    await page.goto(SEARCH_PATH);

    await test.step('Add CQL identifier filter and submit search', async () => {
      await page.getByRole('button', { name: /add filter/i }).click();
      await page.getByRole('menuitem', { name: /identifier/i }).click();
      const queryableInput = page.getByRole('textbox', { name: /additional filters/i });
      await queryableInput.fill('test123');
      await page.getByRole('button', { name: /submit/i }).click();
    });

    const modal = await openExampleCodeModal(page);
    const javascriptPanel = await test.step('Open JavaScript panel in Example Code modal', async () => {
      await modal.getByRole('tab', { name: 'JavaScript' }).click();
      return modal.getByRole('tabpanel', { name: 'JavaScript' });
    });

    const javascriptCode = await test.step('Copy generated JavaScript code', async () => {
      await copyCodeFromModal(page, javascriptPanel);
      return readClipboard(page);
    });

    await test.step('Verify snippet contains text CQL fields', async () => {
      expect(javascriptCode).toContain('"filter-lang": "cql2-text"');
      expect(javascriptCode).toContain('"filter": "id = \'test123\'"');
      expect(javascriptCode).not.toContain('"filters":');
    });
  });

  test('keeps cql2-json filter as object for GET item-search JavaScript code', async ({ page }) => {
    await mockGetSearchWithJsonCqlApi(page);
    await page.goto(SEARCH_PATH);

    await test.step('Add CQL identifier filter for GET search', async () => {
      const cqlGroup = page.getByRole('group', { name: /additional filters/i });
      await expect(cqlGroup).toBeVisible({ timeout: 10000 });
      await cqlGroup.getByRole('button', { name: /add filter/i }).click();
      await page.getByRole('menuitem', { name: /identifier/i }).click();
      const queryableInput = page.getByRole('textbox', { name: /additional filters/i });
      await queryableInput.fill('clouds');
    });

    const modal = await openExampleCodeModal(page);
    const javascriptPanel = await test.step('Open JavaScript panel in Example Code modal', async () => {
      await modal.getByRole('tab', { name: 'JavaScript' }).click();
      return modal.getByRole('tabpanel', { name: 'JavaScript' });
    });

    const javascriptCode = await test.step('Copy generated JavaScript code', async () => {
      await copyCodeFromModal(page, javascriptPanel);
      return readClipboard(page);
    });

    await test.step('Verify GET snippet has cql2-json filter in URL', async () => {
      expect(javascriptCode).toContain('const url = "https://earth-search.aws.test.com/v1/search?');
      expect(javascriptCode).toContain('filter-lang=cql2-json');
      expect(javascriptCode).toContain('filter=');
      expect(javascriptCode).toContain('await fetch(url);');
      expect(javascriptCode).not.toContain('method: "POST"');
    });
  });
});
