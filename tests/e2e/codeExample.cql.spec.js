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
    
    await test.step('Verify snippet contains text CQL fields', async () => {
      expect(javascriptCode).toContain('"filter-lang": "cql2-text"');
      expect(javascriptCode).toContain('"filter": "id = \'test123\'"');
      expect(javascriptCode).not.toContain('"filters":');
    });
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
      expect(javascriptCode).toContain('const url = "https://stac.example/api/search?');
      expect(javascriptCode).toContain('filter-lang=cql2-json');
      expect(javascriptCode).toContain('filter=');
      expect(javascriptCode).toContain('await fetch(url);');
      expect(javascriptCode).not.toContain('method: "POST"');
    });
  });
});
