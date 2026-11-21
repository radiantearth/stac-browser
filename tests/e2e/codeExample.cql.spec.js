import { test, expect } from './fixtures.js';
import API from '../fixtures/instances/api.js';
import {
  openExampleCodeModal,
  readClipboard,
  copyCodeFromModal,
} from './helpers.js';

test.describe('STAC Browser code example CQL modal', () => {
  let api;
  
  test('generates valid example code for text-only CQL backend', async ({ page, worker }) => {
    api = API.minimalApi({})
      .addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension({ methods: ['POST']})
      .addFilterExtension();
    api.addQueryablesEndpoint();
    api.root.addConformsTo('http://www.opengis.net/spec/cql2/1.0/conf/cql2-text');
    api.addCollection('test-collection-1', {});
    await api.createServer(worker);
    
    await page.goto(api.root.getSearchPath());
    
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
    
    await test.step('Verify snippet contains text CQL fields', () => {
      expect(javascriptCode).toContain('"filter-lang": "cql2-text"');
      expect(javascriptCode).toContain('"filter": "id = \'test123\'"');
      expect(javascriptCode).not.toContain('"filters":');
    });
  });
  
  test('escapes every apostrophe in cql2-text strings', async ({ page, worker }) => {
    api = API.minimalApi({})
      .addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension({ methods: ['POST']})
      .addFilterExtension();
    api.addQueryablesEndpoint();
    api.root.addConformsTo('http://www.opengis.net/spec/cql2/1.0/conf/cql2-text');
    api.addCollection('test-collection-1', {});
    await api.createServer(worker);
    
    await page.goto(api.root.getSearchPath());
    
    await test.step('Add CQL identifier filter and submit search', async () => {
      await page.getByRole('button', { name: /add filter/i }).click();
      await page.getByRole('menuitem', { name: /identifier/i }).click();
      const queryableInput = page.getByRole('textbox', { name: /additional filters/i });
      await queryableInput.fill("it's Tom's");
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
    
    await test.step('Verify snippet contains text CQL fields', () => {
      expect(javascriptCode).toContain('"filter-lang": "cql2-text"');
      expect(javascriptCode).toContain(`"filter": "id = 'it''s Tom''s'"`);
      expect(javascriptCode).not.toContain('"filters":');
    });
  });
  
  test('keeps the negation in cql2-text', async ({ page, worker }) => {
    api = API.minimalApi({})
      .addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension({ methods: ['POST']})
      .addFilterExtension();
    api.addQueryablesEndpoint();
    api.root.addConformsTo('http://www.opengis.net/spec/cql2/1.0/conf/cql2-text');
    api.addCollection('test-collection-1', {});
    await api.createServer(worker);
    
    await page.goto(api.root.getSearchPath());
    
    await test.step('Add CQL identifier filter and submit search', async () => {
      await page.getByRole('button', { name: /add filter/i }).click();
      await page.getByRole('menuitem', { name: /identifier/i }).click();
      const queryableInput = page.getByRole('textbox', { name: /additional filters/i });
      await queryableInput.fill('test123');
      await page.locator('.queryable-row .op .dropdown-toggle-split').click();
      await page.locator('.queryable-row .queryable-item', { hasText: /negate filter/i }).click();
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
    
    await test.step('Verify snippet contains text CQL fields', () => {
      expect(javascriptCode).toContain('"filter-lang": "cql2-text"');
      expect(javascriptCode).toContain(`"filter": "NOT id = 'test123'"`);
      expect(javascriptCode).not.toContain('"filters":');
    });
  });
  
  test('writes backslashes, unusual property names and incomplete filters as the CQL2 grammar requires', async ({ page, worker }) => {
    api = API.minimalApi({})
      .addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension({ methods: ['POST']})
      .addFilterExtension();
    api.addQueryablesEndpoint();
    const queryables = api.endpoints.find(endpoint => endpoint.data?.properties?.id).data.properties;
    queryables['my-prop'] = { type: 'string', title: 'Hyphenated' };
    queryables.date = { type: 'string', title: 'Keyword' };
    queryables.gsd = { type: 'number', title: 'Resolution' };
    api.root.addConformsTo('http://www.opengis.net/spec/cql2/1.0/conf/cql2-text');
    api.root.addConformsTo('http://www.opengis.net/spec/cql2/1.0/conf/advanced-comparison-operators');
    api.addCollection('test-collection-1', {});
    await api.createServer(worker);

    await page.goto(api.root.getSearchPath());

    const addFilter = async (name) => {
      await page.getByRole('button', { name: /add filter/i }).click();
      await page.getByRole('menuitem', { name }).click();
      return page.locator('.queryable-row').last();
    };

    await test.step('Add filters and submit search', async () => {
      await (await addFilter(/identifier/i)).locator('input.value').fill('C:' + String.fromCharCode(92) + 'new');
      await (await addFilter(/hyphenated/i)).locator('input.value').fill('a');
      await (await addFilter(/keyword/i)).locator('input.value').fill('b');
      await (await addFilter(/resolution/i)).locator('input.value').fill('');
      const list = await addFilter(/identifier/i);
      await list.locator('.op .dropdown-toggle-split').click();
      await list.locator('.queryable-item', { hasText: '∈' }).click();
      await page.getByRole('button', { name: /submit/i }).click();
    });

    const modal = await openExampleCodeModal(page);
    await modal.getByRole('tab', { name: 'JavaScript' }).click();
    await copyCodeFromModal(page, modal.getByRole('tabpanel', { name: 'JavaScript' }));
    const javascriptCode = await readClipboard(page);

    const filter = JSON.parse(javascriptCode.match(/"filter": (".*")/)[1]);
    expect(filter).toBe(`id = 'C:${String.fromCharCode(92).repeat(2)}new' AND "my-prop" = 'a' AND "date" = 'b'`);
  });

  test('keeps cql2-json filter as object for GET item-search JavaScript code', async ({ page, worker }) => {
    api = API.minimalApi({})
      .addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension({ methods: ['GET']})
      .addFilterExtension();
    api.addQueryablesEndpoint();
    api.root.addConformsTo('http://www.opengis.net/spec/cql2/1.0/conf/cql2-json');
    api.addCollection('test-collection-1', {});
    await api.createServer(worker);
    
    await page.goto(api.root.getSearchPath());
    
    await test.step('Add CQL identifier filter for GET search', async () => {
      const cqlGroup = page.getByRole('group', { name: /additional filters/i });
      await expect(cqlGroup).toBeVisible();
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
    
    await test.step('Verify GET snippet has cql2-json filter in URL', () => {
      expect(javascriptCode).toContain('const url = "https://stac.example/api/search?');
      expect(javascriptCode).toContain('filter-lang=cql2-json');
      expect(javascriptCode).toContain('filter=');
      expect(javascriptCode).toContain('await fetch(url);');
      expect(javascriptCode).not.toContain('method: "POST"');
    });
  });
});
