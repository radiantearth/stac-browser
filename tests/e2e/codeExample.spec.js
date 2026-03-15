import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  SEARCH_PATH,
  mockApiRootAndCollections,
  waitForMapReady
} from './helpers';

const COLLECTION_ITEMS_PATH = '/external/earth-search.aws.test.com/v1/collections/test-collection-1?.language=en';

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

const copyDependenciesFromModal = async (page, panel) => {
  await clearClipboard(page);
  await panel.locator('[id="exampleCodeCopyDependencies"]').click();
  return expect.poll(async () => readClipboard(page)).not.toEqual('');
};

const copyFilenameFromModal = async (page, panel) => {
  await clearClipboard(page);
  await panel.locator('[id="exampleCodeCopyOutputFilename"]').click();
  return expect.poll(async () => readClipboard(page)).not.toEqual('');
};

test.describe('STAC Browser code example modal', () => {

  test('shows modal and copies default Python dependencies', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    let copied;
    await test.step('Open Example Code modal and copy default dependencies', async () => {
      const modal = await openExampleCodeModal(page);
      await test.step('open Python panel', async () => {
        await modal.getByRole('tab', { name: 'Python' }).click();
      });
      const pythonPanel = modal.getByRole('tabpanel', { name: 'Python' });
      await expect(pythonPanel.getByText('pip install')).toBeVisible();
      await copyDependenciesFromModal(page, pythonPanel);
      copied = await readClipboard(page);
    });

    await test.step('Verify copied dependencies are Python install command', async () => {
      expect(copied, 'should contain minimal Python dependency install command').toContain('pip install');
      expect(copied, 'should not contain Rust dependency install command').not.toContain('cargo add');
    });
  });

  test('copies updated dependencies after switching tab from Python to Rust', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    const modal = await openExampleCodeModal(page);

    let pythonDependencies;
    await test.step('Copy Python dependencies from default tab', async () => {
      await test.step('open Python panel', async () => {
        await modal.getByRole('tab', { name: 'Python' }).click();
      });
      const pythonPanel = modal.getByRole('tabpanel', { name: 'Python' });
      await expect(pythonPanel.getByText('pip install')).toBeVisible();
      await copyDependenciesFromModal(page, pythonPanel);
      pythonDependencies = await readClipboard(page);
      expect(pythonDependencies, 'should contain minimal Python dependency install command').toContain('pip install');
    });

    let rustDependencies;
    await test.step('Switch to Rust tab and copy dependencies', async () => {
      await modal.getByRole('tab', { name: 'Rust' }).click();
      const rustPanel = modal.getByRole('tabpanel', { name: 'Rust' });
      await expect(rustPanel.getByText('cargo add')).toBeVisible();
      await copyDependenciesFromModal(page, rustPanel);
      rustDependencies = await readClipboard(page);
    });

    await test.step('Verify copied dependencies were updated to Rust install command', async () => {
      expect(rustDependencies, 'should contain Rust dependency install command').toContain('cargo add serde_json stac stac-io');
      expect(rustDependencies, 'should not contain Python dependency install command').not.toContain('pip install pystac-client');
      expect(rustDependencies, 'should differ from initial Python copied dependencies').not.toEqual(pythonDependencies);
    });
  });

  test('shows modal and copies default Python code when no filters are touched', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    let copied;
    await test.step('Open Example Code modal and copy default code', async () => {
      const modal = await openExampleCodeModal(page);
      await test.step('open Python panel', async () => {
        await modal.getByRole('tab', { name: 'Python' }).click();
      });
      const pythonPanel = modal.getByRole('tabpanel', { name: 'Python' });
      await copyCodeFromModal(page, pythonPanel);
      copied = await readClipboard(page);
    });

    await test.step('Verify copied code is Python default snippet', async () => {
      expect(copied, 'should contain Python client import').toContain('from pystac_client import Client');
      expect(copied, 'should contain unfiltered search call').toContain('results = catalog.search()');
      expect(copied, 'should not contain JavaScript fetch snippet').not.toContain('const searchUrl =');
    });
  });

  test('shows modal and copies default Python output filename', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    let copied;
    await test.step('Open Example Code modal and copy default output filename', async () => {
      const modal = await openExampleCodeModal(page);
      await test.step('open Python panel', async () => {
        await modal.getByRole('tab', { name: 'Python' }).click();
      });
      const pythonPanel = modal.getByRole('tabpanel', { name: 'Python' });
      await expect(pythonPanel.getByText('search.py'), 'Python filename should be visible').toBeVisible();
      await copyFilenameFromModal(page, pythonPanel);
      copied = await readClipboard(page);
    });

    await test.step('Verify copied filename is Python default output filename', async () => {
      expect(copied, 'Python filename should be search.py').toBe('search.py');
    });
  });

  test('copies updated output filename after switching tab from Python to JavaScript', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    const modal = await openExampleCodeModal(page);

    let pythonFilename;
    await test.step('Copy Python output filename from default tab', async () => {
      await test.step('open Python panel', async () => {
        await modal.getByRole('tab', { name: 'Python' }).click();
      });
      const pythonPanel = modal.getByRole('tabpanel', { name: 'Python' });
      await expect(pythonPanel.getByText('search.py')).toBeVisible();
      await copyFilenameFromModal(page, pythonPanel);
      pythonFilename = await readClipboard(page);
      expect(pythonFilename, 'Python filename should be search.py').toBe('search.py');
    });

    let javascriptFilename;
    await test.step('Switch to JavaScript tab and copy output filename', async () => {
      await modal.getByRole('tab', { name: 'JavaScript' }).click();
      const javascriptPanel = modal.getByRole('tabpanel', { name: 'JavaScript' });
      await expect(javascriptPanel.getByText('search.mjs')).toBeVisible();
      await copyFilenameFromModal(page, javascriptPanel);
      javascriptFilename = await readClipboard(page);
    });

    await test.step('Verify copied filename was updated to JavaScript output filename', async () => {
      expect(javascriptFilename, 'JavaScript filename should be search.mjs').toBe('search.mjs');
    });
  });

  test('copies updated language code after switching tab from Python to JavaScript', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    const modal = await openExampleCodeModal(page);

    let pythonCode;
    await test.step('Copy Python code from default tab', async () => {
      await test.step('open Python panel', async () => {
        await modal.getByRole('tab', { name: 'Python' }).click();
      });
      const pythonPanel = modal.getByRole('tabpanel', { name: 'Python' });
      await copyCodeFromModal(page, pythonPanel);
      pythonCode = await readClipboard(page);
      expect(pythonCode, 'should contain Python client import').toContain('from pystac_client import Client');
    });

    let javascriptCode;
    await test.step('Switch to JavaScript tab and copy code', async () => {
      await modal.getByRole('tab', { name: 'JavaScript' }).click();
      const javascriptPanel = modal.getByRole('tabpanel', { name: 'JavaScript' });
      await copyCodeFromModal(page, javascriptPanel);
      javascriptCode = await readClipboard(page);
    });

    await test.step('Verify copied code was updated to JavaScript snippet', async () => {
      expect(javascriptCode, 'should contain JavaScript fetch call').toContain('await fetch(');
      expect(javascriptCode, 'should not contain Python snippet').not.toContain('from pystac_client import Client');
      expect(javascriptCode, 'should differ from initial Python copied code').not.toEqual(pythonCode);
    });
  });

  test('shows modal and includes values from filter inputs after toggling them', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    await test.step('Enter a datetime range', async () => {
      const temporalInput = page.getByPlaceholder(/select date range/i);
      await temporalInput.click();
      await temporalInput.fill('2025-01-01 - 2026-12-31');
      await temporalInput.press('Escape');
      await expect(page.locator('.dp__menu'), 'range picker should be hidden').toBeHidden();
    })

    await page.getByRole('checkbox', { name: /filter by spatial extent/i }).check();
    await waitForMapReady(page);
    await test.step('manually enter bbox values', async () => {
      const westLongitude = page.getByLabel(/west longitude/i);
      await expect(westLongitude).toBeVisible();
      await westLongitude.fill('-116.1');
      await westLongitude.blur();

      const southLatitude = page.getByLabel(/south latitude/i);
      await southLatitude.fill('44.3');
      await southLatitude.blur();

      const eastLongitude = page.getByLabel(/east longitude/i);
      await eastLongitude.fill('-104');
      await eastLongitude.blur();

      const northLatitude = page.getByLabel(/north latitude/i);
      await northLatitude.fill('49');
      await northLatitude.blur();

      await northLatitude.press('Enter');
    });

    await test.step('Enter a collection ID', async () => {
      const collectionSelect = page.locator('.filter-collection .multiselect');
      await collectionSelect.click();

      const collectionInput = collectionSelect.locator('input.multiselect__input');
      await collectionInput.fill('test-collection-1');
      await collectionInput.press('Enter');
    });

    await test.step('Enter an item ID', async () => {
      const itemIdsGroup = page.locator('.filter-item-id');
      const multiselect = itemIdsGroup.locator('.multiselect');

      // Click the visible tags/placeholder area to activate
      await multiselect.locator('.multiselect__tags').click();

      const idInput = multiselect.locator('input.multiselect__input');
      await expect(idInput, 'item ID input should be visible').toBeVisible();

      await idInput.fill('test-item-123');
      await idInput.press('Enter');
    });

    await test.step('Select to sort by title field', async () => {
      const sortSelect = page.locator('.sort .multiselect');
      await sortSelect.locator('.multiselect__select').click();

      const sortInput = sortSelect.locator('input.multiselect__input');
      await sortInput.fill('title');
      await sortInput.press('Enter');
    });

    await test.step('Set limit of 99 items per page', async () => {
      const limitInput = page.getByLabel(/items per page/i);
      await limitInput.fill('99');
    });

    const modal = await openExampleCodeModal(page);
    await expect(modal, 'Example Code Modal should be visible').toBeVisible();
    await test.step('open Python panel', async () => {
      await modal.getByRole('tab', { name: 'Python' }).click();
    });
    const pythonPanel = modal.getByRole('tabpanel', { name: 'Python' });
    await copyCodeFromModal(page, pythonPanel);

    const copied = await readClipboard(page);
    expect(copied, 'should contain search results').toContain('results = catalog.search(');
    expect(copied, 'should contain selected collection').toContain('collections=["test-collection-1"]');
    expect(copied, 'should contain selected item ID').toContain('ids=["test-item-123"]');
    expect(copied, 'should contain bbox').toContain('bbox');
    const bboxMatch = copied.match(/bbox\s*=\s*\[([^\]]+)\]/);
    expect(bboxMatch).not.toBeNull();
    await test.step('Verify bbox values in copied code', async () => {
      // work around floating point precision issues by allowing for closeTo rather than exact equality
      const bbox = bboxMatch[1].split(',').map(v => Number(v.trim()));
      expect(bbox).toHaveLength(4);
      expect(bbox[0]).toBeCloseTo(-116.1, 6);
      expect(bbox[1]).toBeCloseTo(44.3, 6);
      expect(bbox[2]).toBeCloseTo(-104, 6);
      expect(bbox[3]).toBeCloseTo(49, 6);
    });
    await test.step('Verify datetime range in copied code', async () => {
      expect(copied).toContain('datetime=');
      expect(copied).toContain('2025-01-01');
      expect(copied).toContain('2026-12-31');
    });
    expect(copied, 'should contain max items').toContain('max_items=99');
    expect(copied, 'should contain sort by title').toContain('sortby="properties.title"');
  });

  test('downloads example code that matches the displayed snippet', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    const modal = await openExampleCodeModal(page);

    const pythonPanel = modal.getByRole('tabpanel', { name: 'Python' });

    let expectedCode;
    await test.step('copy current example code', async () => {
      await copyCodeFromModal(page, pythonPanel);
      expectedCode = await readClipboard(page);
      expect(expectedCode).not.toEqual('');
    });

    let downloadedCode;
    await test.step('download example code', async () => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        pythonPanel.getByRole('button', { name: /download/i }).click()
      ]);

      expect(download.suggestedFilename()).toBe('search.py');

      const path = await download.path();
      expect(path, 'download path should exist').not.toBeNull();
      downloadedCode = await readFile(path, 'utf8');
    });

    await test.step('verify downloaded code matches displayed snippet', async () => {
      // Normalize line endings: clipboard may use \r\n on Windows and \r on MacOS
      // while Blob downloads preserve LF only
      const normalize = s => s.replace(/\r\n|\r/g, '\n');
      expect(normalize(downloadedCode)).toEqual(normalize(expectedCode));
    });
  });

  test('closes modal when close button is clicked', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    const modal = await openExampleCodeModal(page);
    await modal.locator('.modal-footer').getByRole('button', { name: /close/i }).click();
    await expect(modal, 'Example Code Modal should not be visible').not.toBeVisible();
  });

  test('shows example code from the Items filter on collection item search', async ({ page }) => {
    await mockApiRootAndCollections(page);

    await page.route('https://earth-search.aws.test.com/v1/collections/test-collection-1', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'Collection',
            id: 'test-collection-1',
            title: 'Test Collection 1',
            description: 'Test collection for item filter example code',
            stac_version: '1.0.0',
            extent: {
              spatial: { bbox: [[-180, -90, 180, 90]] },
              temporal: { interval: [['2020-01-01T00:00:00Z', null]] }
            },
            links: [
              {
                rel: 'self',
                type: 'application/json',
                href: 'https://earth-search.aws.test.com/v1/collections/test-collection-1'
              },
              {
                rel: 'root',
                type: 'application/json',
                href: 'https://earth-search.aws.test.com/v1'
              },
              {
                rel: 'parent',
                type: 'application/json',
                href: 'https://earth-search.aws.test.com/v1'
              },
              {
                rel: 'items',
                type: 'application/geo+json',
                href: 'https://earth-search.aws.test.com/v1/collections/test-collection-1/items'
              }
            ]
          })
        });
        return;
      }
      await route.continue();
    });

    await page.route('https://earth-search.aws.test.com/v1/collections/test-collection-1/items**', async (route, request) => {
      if (request.method() === 'GET' || request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/geo+json',
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

    await page.goto(COLLECTION_ITEMS_PATH);

    await expect(page.getByRole('heading', { name: /test collection 1/i }), 'collection page should load').toBeVisible();

    const toggleFilterButton = page.getByRole('button', { name: /show filter|hide filter/i });
    await expect(toggleFilterButton, 'item filter toggle should be visible').toBeVisible();
    await toggleFilterButton.click();

    const openExampleButton = page.getByRole('button', { name: /example code/i });
    await expect(openExampleButton, 'example code button should be visible for Items filter').toBeVisible();
    await openExampleButton.click();

    const modal = page.getByRole('dialog', { name: /example code/i });
    await expect(modal, 'Example Code Modal should be visible').toBeVisible();

    const pythonPanel = modal.getByRole('tabpanel', { name: 'Python' });
    await copyCodeFromModal(page, pythonPanel);
    const copied = await readClipboard(page);
    expect(copied, 'should contain python search snippet').toContain('results = catalog.search(');
    expect(copied, 'should include scoped collection id for collection item search').toContain('collections=["test-collection-1"]');
  });
});
