/**
 * STAC API search page tests.
 *
 * Verifies the global item search: filter inputs (datetime, bbox, collection ID,
 * item ID, sort, limit), bbox validation, result rendering, empty-result state,
 * and form reset.
 *
 * Fixtures: tests/fixtures/api/ (root.json, collections.json, search-empty.json,
 *           search-results.json)
 */
import { test, expect } from './fixtures';
import {
  SEARCH_PATH,
  mockApiRootAndCollections,
  mockApiRootAndSearch,
  waitForMapReady,
  waitForPageReady,
  waitForBboxInputsPopulated,
  waitForSearchPost
} from './helpers';

const enableSpatialExtentInputs = async (page) => {
  const enableSpatialCheckbox = page.getByRole('checkbox', { name: /filter by spatial extent/i });
  await enableSpatialCheckbox.check();
  const southLatInput = page.getByLabel(/south latitude/i);
  await expect(southLatInput).toBeVisible();
  return southLatInput;
};

const fillBboxInputs = async (page, values) => {
  const westLonInput = page.getByLabel(/west longitude/i);
  const southLatInput = page.getByLabel(/south latitude/i);
  const eastLonInput = page.getByLabel(/east longitude/i);
  const northLatInput = page.getByLabel(/north latitude/i);

  if (values.westLon != null) {await westLonInput.fill(values.westLon);}
  if (values.southLat != null) {await southLatInput.fill(values.southLat);}
  if (values.eastLon != null) {await eastLonInput.fill(values.eastLon);}
  if (values.northLat != null) {await northLatInput.fill(values.northLat);}
};

test.describe('STAC Browser Search page', () => {
  test('Should load the Search page successfully', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    // Navigate to the search page
    await page.goto(SEARCH_PATH);
    
    // Verify the page loads without errors
    await expect(page.getByRole('heading', { name: 'Search' }), 'search heading should be visible').toBeVisible();
  });

  test('Search with default selection should have empty POST body', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);
    
    const requestPromise = waitForSearchPost(page);

    await test.step('Submit search with default selection', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });

      // Submit search with default selection
      await submitButton.click();
    })

    await test.step('Verify POST body is empty', async () => {
      const { body } = await requestPromise;
      expect(body).toEqual({});
    });

  });

  test('Search with temporal extent selection should have valid POST body', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Enter a temporal extent', async () => {
      const temporalInput = page.getByPlaceholder(/select date range/i);

      await temporalInput.click();
      await temporalInput.fill('2025-01-01 - 2026-12-31');
      

    })

    await test.step('Submit search and verify POST body contains correct datetime', async () => {
      const requestPromise = waitForSearchPost(page);
      const submitButton = page.getByRole('button', { name: /submit/i });
      await submitButton.click();

      const { body } = await requestPromise;
      expect(body.datetime).toContain('2025-01-01');
      expect(body.datetime).toContain('2026-12-31');
    });
  });

  test('Search with spatial extent via map click should have valid POST body', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Enable spatial extent selection and click on map to create bounding box', async () => {
      const enableSpatialCheckbox = page.getByRole('checkbox', { name: /filter by spatial extent/i });
      await enableSpatialCheckbox.check();

      const mapViewport = await waitForMapReady(page);
      
      // Click on the map to create a bounding box
      await mapViewport.click({ position: { x: 300, y: 200 } });

      await waitForBboxInputsPopulated(page);
    });

    await test.step('Submit search and verify POST body contains a bbox', async () => {
    const submitButton = page.getByRole('button', { name: /submit/i });
    const requestPromise = waitForSearchPost(page);

    await submitButton.click();

    const { body } = await requestPromise;
    expect(body.bbox).toHaveLength(4);
    expect(body.bbox[0]).toBeLessThan(body.bbox[2]);
    expect(body.bbox[1]).toBeLessThan(body.bbox[3]);
    });
  });

  test('Search with spatial extent selection via manual input should have valid POST body', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Enable spatial extent selection and fill in bounding box values', async () => {
      const enableSpatialCheckbox = page.getByRole('checkbox', { name: /filter by spatial extent/i });

      await enableSpatialCheckbox.check();

      // Wait for network to be idle to ensure UI is ready
      await page.waitForLoadState('networkidle');
      
      // Fill in bounding box values
      await page.getByLabel(/west longitude/i).fill( '-116.1' );
      await page.getByLabel(/south latitude/i).fill( '44.3' );
      await page.getByLabel(/east longitude/i).fill( '-104' );
      await page.getByLabel(/north latitude/i).fill( '49' );
      await page.getByLabel(/north latitude/i).blur();
    });

    await test.step('Submit search and verify POST body contains correct bbox', async () => { 
      const submitButton = page.getByRole('button', { name: /submit/i });
      
      const requestPromise = waitForSearchPost(page);

      await submitButton.click();

      const { body } = await requestPromise;
      
      // use toBeCloseTo for floating point comparisons
      expect(body.bbox[0]).toBeCloseTo(-116.1, 2);
      expect(body.bbox[1]).toBeCloseTo(44.3, 2);
      expect(body.bbox[2]).toBeCloseTo(-104, 2);
      expect(body.bbox[3]).toBeCloseTo(49, 2);
    });
  });

  test('Manual spatial extent shows incomplete error', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Enter 3 of 4 bounding box values', async () => {
      await enableSpatialExtentInputs(page);
      // Fill page with values
      await fillBboxInputs(page, {
        westLon: '-116.1',
        southLat: '44.3',
        eastLon: '-104',
        northLat: '60.0'
      });
      // Remove a value
      await fillBboxInputs(page, {
        southLat: ''
      });
    })

    await test.step('Verify error message appears with correct text', async () => {
      await page.getByLabel(/south latitude/i).blur();
      
      await expect(page.getByText(/Coordinate is missing/i)).toBeVisible();
    });
  });

  test('Manual spatial extent shows invalid latitude error', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await enableSpatialExtentInputs(page);

    await fillBboxInputs(page, {
      westLon: '-116.1',
      southLat: '-100',
      eastLon: '-104',
      northLat: '49'
    });

    await page.getByLabel(/north latitude/i).blur();

    await expect(page.getByText(/Latitude must be between -90 and 90/i)).toBeVisible();
  });

  test('Manual spatial extent shows latitude order error', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Test south latitude > north latitude error', async () => {
      await enableSpatialExtentInputs(page);
      
      await fillBboxInputs(page, {
        westLon: '-116.1',
        southLat: '49',
        eastLon: '-104',
        northLat: '44.3'
      });

      await page.getByLabel(/north latitude/i).blur();
      
      await expect(page.getByText(/South Latitude must be less than North Latitude/i)).toBeVisible();
    });
  });

  test('Manual spatial extent shows longitude order error when west is east of east', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Test west longitude > east longitude error (both negative)', async () => {
      await enableSpatialExtentInputs(page);

      await fillBboxInputs(page, {
        westLon: '-80',
        southLat: '10',
        eastLon: '-120',
        northLat: '20'
      });

      await page.getByLabel(/north latitude/i).blur();

      await expect(page.getByText(/West Longitude must be less than East Longitude/i)).toBeVisible();
    });
  });

  test('Manual spatial extent allows antimeridian crossing (positive west, negative east)', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Allow west > east when crossing antimeridian', async () => {
      await enableSpatialExtentInputs(page);

      await fillBboxInputs(page, {
        westLon: '170',
        southLat: '-10',
        eastLon: '-170',
        northLat: '10'
      });

      await page.getByLabel(/north latitude/i).blur();

      await expect(page.getByText(/West Longitude must be less than East Longitude/i)).toHaveCount(0);
    });
  });


  test('Search with Collection ID should have valid POST body', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Select a collection from the dropdown', async () => {
      const collectionSelect = page.locator('.filter-collection .multiselect');
      await collectionSelect.click();

      // Wait for collection options to be loaded from the /collections endpoint
      const option = collectionSelect.locator('.multiselect__option', { hasText: 'Test Collection 1' });
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();
    });

    await test.step('Submit search and verify POST body contains collection ID', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      const requestPromise = waitForSearchPost(page);
      await submitButton.click();

      const { body } = await requestPromise;
      expect(body.collections).toContain('test-collection-1');
    });
  });

  test('search with Item ID should have valid POST body', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);
    
    await test.step('Enter an item ID', async () => {
      const itemIdsGroup = page.locator('.filter-item-id');
      const multiselect = itemIdsGroup.locator('.multiselect');

      // Click the visible tags/placeholder area to activate
      await multiselect.locator('.multiselect__tags').click();

      const idInput = multiselect.locator('input.multiselect__input');
      await expect(idInput).toBeVisible();

      await idInput.fill('test123');
      await idInput.press('Enter');
    });

    await test.step('Submit search and verify POST body contains item ID', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      const requestPromise = waitForSearchPost(page);
      await submitButton.click();

      const { body } = await requestPromise;
      expect(body.ids).toContain('test123');
    });
  });

  test('search with Sort should have valid POST body', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Select to sort by title field', async () => {
      const sortSelect = page.locator('.sort .multiselect');
      await sortSelect.locator('.multiselect__select').click();

      const sortInput = sortSelect.locator('input.multiselect__input');
      await sortInput.fill('title');
      await sortInput.press('Enter');
    });

    await test.step('Submit search and verify POST body contains sortby field', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      const requestPromise = waitForSearchPost(page);
      await submitButton.click();

      const { body } = await requestPromise;
      expect(body.sortby).toHaveLength(1);
      expect(body.sortby[0].field).toBe('properties.title');
      expect(body.sortby[0].direction).toBe('asc');
    });
  });

  test('search with item limit should have valid POST body', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Set limit of 99 items per', async () => {
      const limitInput = page.getByLabel(/items per page/i);
      await limitInput.fill('99');
    });

    await test.step('Submit search and verify POST body contains limit', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      const requestPromise = waitForSearchPost(page);
      await submitButton.click();

      const { body } = await requestPromise;
      expect(body.limit).toBe(99);
    });
  });

  test('search results render item cards with correct titles', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker, { searchFixture: 'search-results.json' });
    await page.goto(SEARCH_PATH);

    await test.step('Submit search and wait for results', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      await submitButton.click();

      // Wait for item cards to appear
      await expect(page.locator('.item-card')).toHaveCount(3, { timeout: 10000 });
    });

    await test.step('Verify each result item title is displayed', async () => {
      await expect(page.locator('.item-card').nth(0).locator('.stac-link .title')).toHaveText('Result Item Alpha');
      await expect(page.locator('.item-card').nth(1).locator('.stac-link .title')).toHaveText('Result Item Beta');
      await expect(page.locator('.item-card').nth(2).locator('.stac-link .title')).toHaveText('Result Item Gamma');
    });
  });

  test('search results show "no items found" when response is empty', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker, { searchFixture: 'search-empty.json' });
    await page.goto(SEARCH_PATH);

    await test.step('Submit search with default filters', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      await submitButton.click();
    });

    await test.step('Verify "no items found" message appears', async () => {
      await expect(page.getByText(/no items found for the given filters/i)).toBeVisible({ timeout: 10000 });
    });

    await test.step('Verify no item cards are rendered', async () => {
      await expect(page.locator('.item-card')).toHaveCount(0);
    });
  });

  test('search results display matched item count', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker, { searchFixture: 'search-results.json' });
    await page.goto(SEARCH_PATH);

    await test.step('Submit search and wait for results', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      await submitButton.click();

      await expect(page.locator('.item-card')).toHaveCount(3, { timeout: 10000 });
    });

    await test.step('Verify items count badge is displayed', async () => {
      // The Items section shows a count badge next to the heading
      const itemsHeading = page.locator('.items header');
      await expect(itemsHeading.locator('.badge')).toContainText('3');
    });
  });

  test('Reset button clears all filters and re-submits with empty body', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Fill in filters before resetting', async () => {
      // Set a limit so the body is non-empty
      const limitInput = page.getByLabel(/items per page/i);
      await limitInput.fill('5');

      // Submit to confirm the filters are applied
      const requestPromise = waitForSearchPost(page);
      await page.getByRole('button', { name: /submit/i }).click();
      const { body } = await requestPromise;
      expect(body.limit).toBe(5);
    });

    await test.step('Click Reset then re-submit and verify empty body', async () => {
      await page.getByRole('button', { name: /reset/i }).click();

      const requestPromise = waitForSearchPost(page);
      await page.getByRole('button', { name: /submit/i }).click();
      const { body } = await requestPromise;
      expect(body).toEqual({});
    });
  });

  test('search with item limit should return pages with limited number of items', async ({ page, worker }) => {
    await mockApiRootAndSearch(worker);
    await page.goto(SEARCH_PATH);

    await test.step('Set limit of 3 items per', async () => {
      const limitInput = page.getByLabel(/items per page/i);
      await limitInput.fill('3');
    });

    await test.step('Submit search and verify the returned list is limited to 3 items', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      await submitButton.click();

      await waitForMapReady(page);

      const resultList = await page.locator('.card-grid').locator('a.stac-link').count();
      expect(resultList).toBe(3);
    });

    await test.step('Next-buttons should navigate to the next page', async () => {
      const nextButton = page.getByRole('button').filter({ hasText: 'Next'}).first();
      //get hrefs of existing items on page 1
      const itemLinks = page.locator('.card-grid').locator('a.stac-link');
      const firstPageHrefs = await itemLinks.evaluateAll(links => links.map(link => link.getAttribute('href')));
      
      await nextButton.click();

      await waitForPageReady(page);

      //get hrefs of items on page 2
      const secondPageHrefs = await itemLinks.evaluateAll(links => links.map(link => link.getAttribute('href')));

      //expect the hrefs on page 2 to be different than page 1
      expect(secondPageHrefs).toHaveLength(3);
      expect(secondPageHrefs[0]).not.toBe(firstPageHrefs[0]);
      expect(secondPageHrefs[1]).not.toBe(firstPageHrefs[1]);
      expect(secondPageHrefs[2]).not.toBe(firstPageHrefs[2]);
    });
  });

  test('search with optional links should show the according buttons', async ({ page, worker }) => {
    await mockApiRootAndSearch(worker, {limit:10, page:1, prev: true, first: true, last:true});
    await page.goto(SEARCH_PATH);

    const limitInput = page.getByLabel(/items per page/i);
    await limitInput.fill('3');
    
    await test.step('Submit search and verify last button', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      await submitButton.click();

      await waitForPageReady(page);

      const lastButton = await page.getByRole('button').filter({ hasText: 'Last'}).first();
      
      expect(await lastButton.count()).toBe(1);
    });

    await test.step('Go to last and check previous, first', async () => {
      const lastButton = await page.getByRole('button').filter({ hasText: 'Last'}).first();
      await lastButton.click();
      await waitForPageReady(page);

      const prevButton = await page.getByRole('button').filter({ hasText: 'Previous'}).first();
      const firstButton = await page.getByRole('button').filter({ hasText: 'First'}).first();

      expect(await prevButton.isDisabled()).toBeFalsy();
      expect(await firstButton.isDisabled()).toBeFalsy();
    });
  });
});
