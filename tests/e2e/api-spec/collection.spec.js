/**
* Collection metadata & assets tests.
*
* Verifies rendering a STAC collection: metadata fields, spatial extent map,
* item listing, and detail controls.
*/
import { test, expect } from '../fixtures.js';
import { waitForBrowserReady } from '../helpers.js';
import API from '../../fixtures/instances/api.js';

test.describe('Static Collection Metadata', () => {
  let api;
  let collection;
  const title = "Example EO Collection";
  const description = "An example STAC Collection with EO extension.";
  
  test.beforeEach(async () => {
    api = API.minimalApi();
    collection = api.addCollection('collection')
      .setMetadata({ title, description });
    api.addManyItems(collection, 3);
  });
  
  
  test('should load and display collection metadata', async ({ page, worker }) => {
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await page.getByRole('link', { name: new RegExp(title, 'i') }).click();
    await waitForBrowserReady(page);
    
    // Collection metadata should be displayed
    await expect(page.getByRole('heading', { name: new RegExp(title, 'i') })).toBeVisible();
    await expect(page.getByText(new RegExp(description, 'i'))).toBeVisible();
    
    // Keywords from the collection should be visible
    for (const kw of collection.getMetadata().keywords) {
      const badge = page.locator('.keywords .keyword', { hasText: new RegExp(kw, 'i') });
      await expect(badge.first()).toBeVisible();
    }
    
    // License should be visible
    await expect(page.getByRole('link', { name: new RegExp(collection.getMetadata().license, 'i') })).toBeVisible();
    
    // Temporal extent should be visible with start date (in span tag, not item datetime tags)
    const start = collection.getMetadata().extent.temporal.interval[0][0].split('T')[0];
    await expect(page.locator('span', { hasText: new RegExp(start) }).first()).toBeVisible();  
    
    // map/thumbnail tabs
    await expect(page.locator('.maps-preview')).toBeVisible();
    const thumbTab = page.getByRole('tab', { name: /thumbnails/i });
    await thumbTab.click();
    await expect(page.getByRole('tabpanel', { name: /thumbnails/i })).toBeVisible();
    const mapTab = page.getByRole('tab', { name: /map/i });
    await mapTab.click();
    const zoomIn = page.locator('.maps-preview button', { hasText: '+' }).first();
    const zoomOut = page.locator('.maps-preview button').filter({ hasText: /[-\u2013\u2212]/ }).first();
    const fullscreen = page.locator('.maps-preview button', { hasText: /\u26F6|fullscreen/i }).first();
    await expect(zoomIn).toBeEnabled();
    await expect(zoomOut).toHaveCount(1);
    await expect(fullscreen).toBeEnabled();
    
    // metadata, assets, providers sections should render
    await expect(page.locator('section.metadata.mb-4').first()).toBeVisible();
    await expect(page.locator('.providers')).toBeVisible();
    await expect(page.locator('.assets').first()).toBeVisible();
    
    // items from "item" links should be visible
    const itemLinks = page.getByRole('link', { name: /example-item-/i });
    await expect(itemLinks.first()).toBeVisible();
  });
  
  test('items navigation from collection to item view', async ({ page, worker }) => {
    await api.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    // click the first item link to navigate to item view
    const itemLink = page.getByRole('link', { name: /example-item-0/i }).first();
    await expect(itemLink).toBeVisible();
    await itemLink.click();
    await waitForBrowserReady(page);
    
    // item heading should show the item id
    await expect(page.getByRole('heading', { name: /example-item-0/i })).toBeVisible();
  });
});


test.describe('STAC Collection item search', () => {
  let api;
  let COLLECTION_PATH;
  let collection;
  
  test.beforeEach(async () => {
    api = API.minimalApi(
      {url: "https://stac.example/api/"},
      {
        defaultLimit: 5,
        prevLinkEnabled: true,
        firstLinkEnabled: true,
        lastLinkEnabled: true
      });
    collection = api.addCollection('collection1')
      .setMetadata({ title: 'Test Collection' });
    api.addManyItems(collection, 10);
    api.addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension();
      
    COLLECTION_PATH = collection.getBrowserPath();
  });
    
  test('Collection view should show item search options', async ({ page, worker }) => {
    await api.createServer(worker);
    await page.goto(COLLECTION_PATH);
    await expect(page.getByRole('heading', { name: collection.getMetadata().title })).toBeVisible();
      
    // show filter button should be visible and open the search form
    const showFilterButton = page.getByRole('button', { name: /show filters/i });
    await expect(showFilterButton).toBeVisible();
    await showFilterButton.click();
      
    await expect(await page.getByLabel(/items per page/i)).toBeVisible();
    await expect(await page.getByLabel(/spatial extent/i)).toBeVisible();
    await expect(await page.getByPlaceholder(/select date range/i)).toBeVisible();
  });
    
  test('changing limit should result in the according number of items rendered', async ({ page, worker }) => {
    await api.createServer(worker);
    await page.goto(COLLECTION_PATH);
      
    // open filters and set limit to 5
    const showFilterButton = page.getByRole('button', { name: /show filters/i });
    await showFilterButton.click();
    const limitInput = page.getByLabel(/items per page/i);
    await limitInput.fill('5');
      
    // submit search and verify 5 items are rendered
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();
    const itemCards = page.locator('.item-card');
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
  });
    
  test('item search can be paginated with Next and Previous buttons', async ({ page, worker }) => {
    await api.createServer(worker);
    await page.goto(COLLECTION_PATH);
      
    // open filters and submit search with default limit of 5
    const showFilterButton = page.getByRole('button', { name: /show filters/i });
    await showFilterButton.click();
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();
      
    const itemCards = page.locator('.item-card');
    const nextButton = page.getByRole('button', { name: /next/i }).first();
    const prevButton = page.getByRole('button', { name: /previous/i }).first();
      
    // verify first page shows 5 items, Next enabled, Previous disabled
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(nextButton).toBeEnabled();
    await expect(prevButton).toBeDisabled();
      
    // click Next and verify second page shows 5 items, Next disabled, Previous enabled
    await nextButton.click();
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(nextButton).toBeDisabled();
    await expect(prevButton).toBeEnabled();
      
    // click Previous and verify first page is shown again with 5 items, Next enabled, Previous disabled
    await prevButton.click();
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(nextButton).toBeEnabled();
    await expect(prevButton).toBeDisabled(); 
  });
    
  test('item search can be paginated with First and Last buttons', async ({ page, worker }) => {
    await api.createServer(worker);
    await page.goto(COLLECTION_PATH);
      
    // open filters and submit search with default limit of 5
    const showFilterButton = page.getByRole('button', { name: /show filters/i });
    await showFilterButton.click();
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();
      
    const itemCards = page.locator('.item-card');
    const firstButton = page.getByRole('button', { name: /first/i }).first();
    const lastButton = page.getByRole('button', { name: /last/i }).first();
    const nextButton = page.getByRole('button', { name: /next/i }).first();
    const prevButton = page.getByRole('button', { name: /previous/i }).first();
      
    // verify first page shows 5 items, First disabled, Last enabled
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(firstButton).toBeDisabled();
    await expect(lastButton).toBeEnabled();
      
    // click Last to jump to the last page and verify it shows 5 items, Next disabled, First enabled
    await lastButton.click();
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(nextButton).toBeDisabled();
    await expect(firstButton).toBeEnabled();
      
    // click First to jump back to the first page and verify it shows 5 items, Previous disabled, First disabled
    await firstButton.click();
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(prevButton).toBeDisabled();
  });
});
  