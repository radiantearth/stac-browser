/**
 * Catalog browsing & navigation tests.
 *
 * Verifies loading a static STAC catalog, rendering metadata and child
 * collections, navigating into collections/items, source view, and validation.
 *
 * Fixtures: tests/fixtures/catalogs/test-catalog/
 */
import { test, expect } from './fixtures';
import { mockCatalogByFolder, loadMockCatalog, mockStacResource, loadFixture, waitForBrowserReady } from './helpers';

test.describe('Catalog view using folder fixtures', () => {
  const folderName = 'test-catalog';
  const catalogUrl = `https://example.com/${folderName}`;

  const catalog = loadFixture(folderName, 'catalog.json');
  const collection = loadFixture(folderName, 'eo-collection', 'collection.json');

  test.beforeEach(async ({ worker }) => {
    await mockCatalogByFolder(worker, folderName, catalogUrl);
  });

  test('loads catalog metadata and collections from folder', async ({ page, worker }) => {
    await loadMockCatalog(page, worker, catalog, catalogUrl);

    // title
    await expect(page.getByRole('heading', { name: new RegExp(catalog.title, 'i') })).toBeVisible();

    // description section
    await expect(page.getByRole('heading', { name: /description/i })).toBeVisible();
    await expect(page.getByText(new RegExp(catalog.description.slice(0, 40), 'i'))).toBeVisible();

    // header controls: count badge, view and sort buttons
    await expect(page.getByRole('heading', { name: /catalogs/i })).toBeVisible();
    const badge = page.locator('.catalogs .title + .badge');
    await expect(badge).toHaveText(/\d+/);
    await expect(page.getByRole('button', { name: /tiles/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /list/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ascending/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /descending/i })).toBeVisible();

    // at least one child link should be visible
    await expect(page.getByRole('link', { name: new RegExp(collection.title, 'i') })).toBeVisible();
  });

  test('filter catalogs by text and keyword selector', async ({ page, worker }) => {
    await loadMockCatalog(page, worker, catalog, catalogUrl);

    // text filter: type "l2a" — only "Earth Observation L2A" matches
    const filterInput = page.getByPlaceholder(/Filter catalogs by title/i);
    await filterInput.fill('l2a');

    // wait for UI to apply filter (badge text change indicates completion)
    const badge = page.locator('.catalogs .title + .badge');
    await expect(badge).toHaveText(/1\//);

    // the grid should only hold one card
    const cards = page.locator('.catalogs .card-grid > *');
    await expect(cards).toHaveCount(1);

    // clear filter for keyword test
    await filterInput.clear();
    await expect(badge).toHaveText(/3/);

    // keyword selector: collections have keywords so the control must be present
    const multi = page.locator('.multiselect');
    await expect(multi).toBeVisible();
    await multi.click();

    const firstOpt = page.locator('.multiselect__option').first();
    await expect(firstOpt).toBeVisible();
    const text = await firstOpt.textContent();
    await firstOpt.click();
    // expect a tag with that text
    await expect(page.locator('.multiselect__tag')).toContainText(new RegExp(text || '', 'i'));
  });

  test('clicking a collection displays its items', async ({ page, worker }) => {
    await loadMockCatalog(page, worker, catalog, catalogUrl);
    await page.getByRole('link', { name: new RegExp(collection.title, 'i') }).click();
    await waitForBrowserReady(page);

    // the collection title should be visible
    await expect(page.getByRole('heading', { name: new RegExp(collection.title, 'i') })).toBeVisible();

    // items from "item" links should be listed
    const itemLinks = page.getByRole('link', { name: /item-2025-/i });
    await expect(itemLinks.first()).toBeVisible();
    expect(await itemLinks.count()).toBeGreaterThan(0);
  });

  test('source and share buttons open popovers with correct content', async ({ page, worker }) => {
    await loadMockCatalog(page, worker, catalog, catalogUrl);

    // click source button
    const sourceBtn = page.getByRole('button', { name: /source/i });
    await expect(sourceBtn).toBeVisible();
    await sourceBtn.click();
    // popover should contain id and stac version
    const sourcePop = page.locator('#popover-link');
    await expect(sourcePop.getByText(new RegExp(catalog.id, 'i'))).toBeVisible();
    await expect(sourcePop.getByText(/stac version/i)).toBeVisible();
    await expect(sourcePop.getByText(new RegExp(catalog.stac_version, 'i'))).toBeVisible();
    await expect(sourcePop.getByText('Valid', { exact: true })).toBeVisible();

    // close popover
    await page.keyboard.press('Escape');

    // click share button
    const shareBtn = page.getByRole('button', { name: /share/i });
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();
    const sharePop = page.locator('#popover-share');
    await expect(sharePop.locator('#browserUrl')).toBeVisible();
    const socLinks = sharePop.locator('a');
    expect(await socLinks.count()).toBeGreaterThan(0);
  });

  test('validation button in source popover navigates to report', async ({ page, worker }) => {
    await loadMockCatalog(page, worker, catalog, catalogUrl);

    const sourceBtn = page.getByRole('button', { name: /source/i });
    await expect(sourceBtn).toBeVisible();
    await sourceBtn.click();

    const sourcePop = page.locator('#popover-link');
    const validationPath = `/validation/external/${new URL(catalogUrl).host}${new URL(catalogUrl).pathname}`;
    const valAnchor = sourcePop.locator(`a[href="${validationPath}"]`).first();
    await expect(valAnchor).toBeVisible();
    await valAnchor.click();

    // validation view assertions
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /validation report/i })).toBeVisible();
    await expect(page.locator('main code')).toHaveText(new RegExp(catalog.id, 'i'));
    const resultRow = page.locator('main').getByText('Result').locator('..');
    await expect(resultRow.getByText(/Valid/i)).toBeVisible();
    const cards = page.locator('.results .card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('validation report shows errors for invalid STAC entity', async ({ page, worker }) => {
    const invalidCollection = loadFixture(folderName, 'invalid-collection', 'collection.json');
    const invalidUrl = `${catalogUrl}/invalid-collection`;

    // Load the invalid collection directly
    await mockStacResource(worker, invalidUrl, invalidCollection);
    await page.goto(`/external/${new URL(invalidUrl).host}${new URL(invalidUrl).pathname}`);
    await waitForBrowserReady(page);

    // Open source popover – validation button should be red with "no" text
    const sourceBtn = page.getByRole('button', { name: /source/i });
    await expect(sourceBtn).toBeVisible();
    await sourceBtn.click();

    const sourcePop = page.locator('#popover-link');
    // The "Valid" row label is always present; the Validation component button shows "no" for invalid
    const validationBtn = sourcePop.locator('.stac-valid .btn-danger');
    await expect(validationBtn).toBeVisible();
    await expect(validationBtn).toContainText('no');

    // Click the validation button to navigate to the report
    await validationBtn.click();

    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /validation report/i })).toBeVisible();

    // Result row should show Invalid
    const resultRow = page.locator('main').getByText('Result').locator('..');
    await expect(resultRow.getByText(/Invalid/i)).toBeVisible();

    // At least one card should have a danger (error) list item
    const errorItems = page.locator('.results .list-group-item-danger');
    const errorCount = await errorItems.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('navigating into a child collection uses its folder data', async ({ page, worker }) => {
    await loadMockCatalog(page, worker, catalog, catalogUrl);
    await page.getByRole('link', { name: new RegExp(collection.title, 'i') }).click();
    await waitForBrowserReady(page);

    // title of child collection should show
    await expect(page.getByRole('heading', { name: new RegExp(collection.title, 'i') })).toBeVisible();
  });

  test('back button returns to parent catalog', async ({ page, worker }) => {
    await loadMockCatalog(page, worker, catalog, catalogUrl);
    await page.getByRole('link', { name: new RegExp(collection.title, 'i') }).click();
    await waitForBrowserReady(page);

    // The "Up" button navigates to the parent catalog
    const back = page.getByRole('button', { name: /up/i }).first();
    await expect(back).toBeVisible();
    await back.click();
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(catalog.title, 'i') })).toBeVisible();
  });
});
