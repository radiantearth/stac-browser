import { test, expect } from '@playwright/test';
import {
  SEARCH_PATH,
  mockApiRootAndCollections,
  waitForMapReady,
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

  await westLonInput.fill(values.westLon);
  await southLatInput.fill(values.southLat);
  await eastLonInput.fill(values.eastLon);
  await northLatInput.fill(values.northLat);
};

test.describe('STAC Browser Search page', () => {
  test('Should load the Search page successfully', async ({ page }) => {
    await mockApiRootAndCollections(page);
    // Navigate to the search page
    await page.goto(SEARCH_PATH);
    
    // Verify the page loads without errors
    await expect(page.getByRole('heading', { name: 'Search' }), 'search heading should be visible').toBeVisible();
  });

  test('Search with default selection should have empty POST body', async ({ page }) => {
    await mockApiRootAndCollections(page);
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

  test('Search with temporal extent selection should have valid POST body', async ({ page }) => {
    await mockApiRootAndCollections(page);
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

  test('Search with spatial extent via map click should have valid POST body', async ({ page }) => {
    await mockApiRootAndCollections(page);
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

  test('Search with spatial extent selection via manual input should have valid POST body', async ({ page }) => {
    await mockApiRootAndCollections(page);
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

  test('Manual spatial extent shows incomplete error', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    await test.step('Enter 3 of 4 bounding box values', async () => {
      await enableSpatialExtentInputs(page);

      await fillBboxInputs(page, {
        westLon: '-116.1',
        southLat: '44.3',
        eastLon: '-104',
        northLat: ''
      });
    })

    await test.step('Verify error message appears with correct text', async () => {
      await page.getByLabel(/north latitude/i).blur();
      
      await expect(page.getByText(/Please fill in all coordinates/i)).toBeVisible();
    });
  });

  test('Manual spatial extent shows invalid latitude error', async ({ page }) => {
    await mockApiRootAndCollections(page);
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

  test('Manual spatial extent shows latitude order error', async ({ page }) => {
    await mockApiRootAndCollections(page);
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

  test('Manual spatial extent shows longitude order error for same hemisphere', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    await test.step('Test west longitude > east longitude error', async () => {
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

  test('Manual spatial extent allows antimeridian crossing', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    await test.step('Allow west longitude > east longitude when crossing', async () => {
      await enableSpatialExtentInputs(page);

      await fillBboxInputs(page, {
        westLon: '170',
        southLat: '-10',
        eastLon: '-170',
        northLat: '10'
      });

      await page.getByLabel(/north latitude/i).blur();

      await expect(page.getByText(/West Longitude must be less than East Longitude/i)).toBeHidden();
    });
  });


  test('Search with Collection ID should have valid POST body', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(SEARCH_PATH);

    await test.step('Enter a collection ID', async () => {
      const collectionSelect = page.locator('.filter-collection .multiselect');
      await collectionSelect.click();

      const collectionInput = collectionSelect.locator('input.multiselect__input');
      await collectionInput.fill('test-collection-1');
      await collectionInput.press('Enter');
    });

    await test.step('Submit search and verify POST body contains collection ID', async () => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      const requestPromise = waitForSearchPost(page);
      await submitButton.click();

      const { body } = await requestPromise;
      expect(body.collections).toContain('test-collection-1');
    });
  });

  test('search with Item ID should have valid POST body', async ({ page }) => {
    await mockApiRootAndCollections(page);
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

  test('search with Sort should have valid POST body', async ({ page }) => {
    await mockApiRootAndCollections(page);
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

  test('search with item limit should have valid POST body', async ({ page }) => {
    await mockApiRootAndCollections(page);
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
});
