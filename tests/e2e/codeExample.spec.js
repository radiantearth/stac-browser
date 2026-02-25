import { test, expect } from '@playwright/test';
import {
  SEARCH_PATH,
  mockApiRootAndCollections,
  waitForMapReady
} from './helpers';

const openExampleCodeModal = async (page) => {
  await page.getByRole('button', { name: /example code/i }).click();
  const modal = page.getByRole('dialog', { name: /example code/i });
  await expect(modal, 'Example Code Modal should be visible').toBeVisible();
  return modal;
};

const readClipboard = async (page) => page.evaluate(() => navigator.clipboard.readText());

const copyCodeFromModal = async (page, modal) => {
  await modal.getByRole('button', { name: /copy/i }).click();
  return expect.poll(async () => readClipboard(page)).not.toEqual('');
};

// const addTagToMultiselect = async (page, containerSelector, value) => {
//   const multiselect = page.locator(`${containerSelector} .multiselect`);
//   await multiselect.locator('.multiselect__tags').click();
//   const input = multiselect.locator('input.multiselect__input');
//   await expect(input).toBeVisible();
//   await input.fill(value);
//   await input.press('Enter');
// };

test.describe('STAC Browser code example modal', () => {
  test.describe.configure({ mode: 'serial' });

  test('shows modal and copies default Python code when no filters are touched', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    let copied;
    await test.step('Open Example Code modal and copy default code', async () => {
      const modal = await openExampleCodeModal(page);
      await copyCodeFromModal(page, modal);
      copied = await readClipboard(page);
    });

    await test.step('Verify copied code is Python default snippet', async () => {
      expect(copied, 'should contain Python client import').toContain('from pystac_client import Client');
      expect(copied, 'should contain unfiltered search call').toContain('results = catalog.search()');
      expect(copied, 'should not contain JavaScript fetch snippet').not.toContain('const searchUrl =');
    });
  });

  test('copies updated language code after switching tab from Python to JavaScript', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    const modal = await openExampleCodeModal(page);

    let pythonCode;
    await test.step('Copy Python code from default tab', async () => {
      await copyCodeFromModal(page, modal);
      pythonCode = await readClipboard(page);
      expect(pythonCode, 'should contain Python client import').toContain('from pystac_client import Client');
    });

    let javascriptCode;
    await test.step('Switch to JavaScript tab and copy code', async () => {
      await modal.getByRole('tab', { name: 'JavaScript' }).click();
      await copyCodeFromModal(page, modal);
      javascriptCode = await readClipboard(page);
    });

    await test.step('Verify copied code was updated to JavaScript snippet', async () => {
      expect(javascriptCode, 'should contain JavaScript search URL').toContain('const searchUrl =');
      expect(javascriptCode, 'should contain JavaScript fetch call').toContain('await fetch(searchUrl');
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
      await expect(page.getByText(/click inside the bounding box to remove it/i)).toBeVisible();
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
    await copyCodeFromModal(page, modal);

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
      expect(copied).toContain('datetime="');
      expect(copied).toContain('2025-01-01');
      expect(copied).toContain('2026-12-31');
    });
    expect(copied, 'should contain max items').toContain('max_items=99');
    expect(copied, 'should contain sort by title').toContain('sortby="properties.title"');
  });

  test('closes modal when close button is clicked', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    const modal = await openExampleCodeModal(page);
    await modal.locator('.modal-footer').getByRole('button', { name: /close/i }).click();
    await expect(modal, 'Example Code Modal should not be visible').not.toBeVisible();
  });
});
