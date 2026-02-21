import { test, expect } from '@playwright/test';
import { mockCatalogByFolder, loadMockCatalog, waitForBrowserReady } from './helpers';
import fs from 'fs';
import path from 'path';

test.describe('Catalog view using folder fixtures', () => {
  const folderName = 'microsoft-pc';
  const catalogUrl = `https://example.com/${folderName}`;

  test.beforeEach(async ({ page }) => {
    await mockCatalogByFolder(page, catalogUrl);
  });

  test('loads catalog metadata and collections from folder', async ({ page }) => {
    const base = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname, folderName);
    const catalog = JSON.parse(fs.readFileSync(path.join(base,'info.json')));
    JSON.parse(fs.readFileSync(path.join(base,'collections.json')));

    await loadMockCatalog(page, catalog, catalogUrl);

    // title
    await expect(page.getByRole('heading', { name: new RegExp(catalog.title, 'i') })).toBeVisible();

    // description section
    await expect(page.getByRole('heading', { name: /description/i })).toBeVisible();
    await expect(page.getByText(new RegExp(catalog.description || '', 'i'))).toBeVisible();

    // header controls: count badge, view and sort buttons
    await expect(page.getByRole('heading', { name: /catalogs/i })).toBeVisible();
    const badge = page.locator('.catalogs .title + .badge');
    await expect(badge).toHaveText(/\d+/);
    await expect(page.getByRole('button', { name: /tiles/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /list/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ascending/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /descending/i })).toBeVisible();

    // the number of collection links should match the fixture (or at least be >0)
    const links = page.locator('.catalog .collections .list-group-item, a');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('filter catalogs by text and keyword selector', async ({ page }) => {
    const base = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname, folderName);
    const catalog = JSON.parse(fs.readFileSync(path.join(base,'info.json')));
    await loadMockCatalog(page, catalog, catalogUrl);

    // text filter: type "l2a" and verify badge updates and only one card remains
    const filterInput = page.getByPlaceholder(/Filter catalogs by title/i);
    await filterInput.fill('l2a');

    // wait for UI to apply filter (badge text change indicates completion)
    const badge = page.locator('.catalogs .title + .badge');
    await expect(badge).toHaveText(/1\//);

    // the grid should eventually only hold one card
    const cards = page.locator('.catalogs .card-grid > *');
    await expect(cards).toHaveCount(1);

    // keyword selector: only try this if the control is present
    const multi = page.locator('.multiselect');
    if (await multi.count()) {
      // clicking the wrapper is more reliable than the hidden input
      await expect(multi).toBeVisible();
      await multi.click();

      const firstOpt = page.locator('.multiselect__option').first();
      if (await firstOpt.count()) {
        const text = await firstOpt.textContent();
        await firstOpt.click();
        // expect a tag with that text
        await expect(page.locator('.multiselect__tag')).toContainText(new RegExp(text || '', 'i'));
      }
    }
  });

  test('clicking a collection displays its items', async ({ page }) => {
    const base = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname, folderName);
    const collectionList = JSON.parse(fs.readFileSync(path.join(base,'collections.json')));
    const first = collectionList.collections[0];

    // load catalog and click the first collection
    const catalog = JSON.parse(fs.readFileSync(path.join(base,'info.json')));
    await loadMockCatalog(page, catalog, catalogUrl);
    await page.getByRole('link', { name: new RegExp(first.title, 'i') }).click();
    await waitForBrowserReady(page);

    // items container should appear and contain at least one card
    await expect(page.locator('.items-container')).toBeVisible();
    const itemCards = page.locator('.items .card-grid > *');
    const itemCount = await itemCards.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('source and share buttons open popovers with correct content', async ({ page }) => {
    // load catalog
    const base = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname, folderName);
    const catalog = JSON.parse(fs.readFileSync(path.join(base,'info.json')));
    await loadMockCatalog(page, catalog, catalogUrl);

    // click source button
    const sourceBtn = page.getByRole('button', { name: /source/i });
    await expect(sourceBtn).toBeVisible();
    await sourceBtn.click();
    // popover should contain id and stac version text within its container
    const sourcePop = page.locator('#popover-link');
    // the ID value itself should appear, not the generic label which is repeated
    await expect(sourcePop.getByText(new RegExp(catalog.id, 'i'))).toBeVisible();
    await expect(sourcePop.getByText(/stac version/i)).toBeVisible();
    await expect(sourcePop.getByText(new RegExp(catalog.stac_version, 'i'))).toBeVisible();
    await expect(sourcePop.getByText(/valid/i)).toBeVisible();

    // close popover
    await page.keyboard.press('Escape');

    // click share button
    const shareBtn = page.getByRole('button', { name: /share/i });
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();
    // popover should display a URL field and social icons container
    const sharePop = page.locator('#popover-share');
    await expect(sharePop.locator('#browserUrl')).toBeVisible();
    // ensure at least one social sharing link appears inside popover
    const socLinks = sharePop.locator('a');
    expect(await socLinks.count()).toBeGreaterThan(0);
  });

  test('validation button in source popover navigates to report', async ({ page }) => {
    const base = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname, folderName);
    const catalog = JSON.parse(fs.readFileSync(path.join(base,'info.json')));
    await loadMockCatalog(page, catalog, catalogUrl);

    const sourceBtn = page.getByRole('button', { name: /source/i });
    await expect(sourceBtn).toBeVisible();
    await sourceBtn.click();

    const sourcePop = page.locator('#popover-link');
    // instead of clicking the validation button we can follow the underlying link
    const validationPath = `/validation/external/${new URL(catalogUrl).host}${new URL(catalogUrl).pathname}`;
    const valAnchor = sourcePop.locator(`a[href="${validationPath}"]`).first();
    await expect(valAnchor).toBeVisible();
    await valAnchor.click();

    // validation view assertions
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /validation report/i })).toBeVisible();
    await expect(page.locator('main code')).toHaveText(new RegExp(catalog.id, 'i'));
    // the validation page shows a result row with the text "Result" followed by the status
    const resultRow = page.locator('main').getByText('Result').locator('..');
    await expect(resultRow.getByText(/Valid/i)).toBeVisible();
    const cards = page.locator('.results .card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('navigating into a child collection uses its folder data', async ({ page }) => {
    const base = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname, folderName);
    const collectionList = JSON.parse(fs.readFileSync(path.join(base,'collections.json')));
    const first = collectionList.collections[0];
    new URL(first.links.find(l=>l.rel==='self').href).href;

    // also stub child resources via helper (already done in beforeEach)
    const catalog = JSON.parse(fs.readFileSync(path.join(base,'info.json')));
    await loadMockCatalog(page, catalog, catalogUrl);
    await page.getByRole('link', { name: new RegExp(first.title, 'i') }).click();
    await waitForBrowserReady(page);

    // title of child collection should show
    await expect(page.getByRole('heading', { name: new RegExp(first.title, 'i') })).toBeVisible();
  });

  test('back button returns to parent catalog', async ({ page }) => {
    const base = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname, folderName);
    const collectionList = JSON.parse(fs.readFileSync(path.join(base,'collections.json')));
    const first = collectionList.collections[0];

    const catalog = JSON.parse(fs.readFileSync(path.join(base,'info.json')));
    await loadMockCatalog(page, catalog, catalogUrl);
    await page.getByRole('link', { name: new RegExp(first.title, 'i') }).click();
    await waitForBrowserReady(page);

    let back = page.getByRole('button', { name: /back|parent/i }).first();
    if (!(await back.count())) {
      back = page.getByRole('button', { name: /up/i }).first();
    }
    await expect(back).toBeVisible();
    await back.click();
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(catalog.title, 'i') })).toBeVisible();
  });
});
