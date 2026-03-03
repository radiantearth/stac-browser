import { expect } from '@playwright/test';
import { HOME_PATH, test } from './helpers';

test.describe('STAC Example Catalog', () => {
    test.use({ serviceWorkers: 'block' });
    test('should open catalog', async ({ network, page }) => {
        await page.goto(HOME_PATH + "external/mock-catalog.api/api/stac/v1/catalog.json");

        await page.waitForRequest(req => req.url().includes('collection-with-extension.json'))

        // Wait for navigation and verify the catalog title appears as h1 heading
        const catalogTitle = page.getByRole('heading', { name: /example catalog/i });
        await expect(catalogTitle).toBeVisible({ timeout: 10000 });
        
        // Verify the page title changed
        await expect(page).toHaveTitle(/example catalog/i);
    });

    test('should navigate to collection when catalog is loaded', async ({ page }) => {
        await page.goto(HOME_PATH + "external/mock-catalog.api/api/stac/v1/");

        const collectionLink = page.locator('.stac-link:has(> span:has-text("Collection Demonstrating STAC Extensions"))')

        // Wait for navigation and verify the catalog title appears as h1 heading
        const catalogTitle = page.getByRole('heading', { name: /example catalog/i });
        await expect(catalogTitle).toBeVisible({ timeout: 10000 });

        // Click the Load button
        await collectionLink.click();

        // Wait for navigation and verify the catalog title appears as h1 heading
        const collectionTitle = page.getByRole('heading', { name: /Collection of Extension Items/i });
        await expect(collectionTitle).toBeVisible({ timeout: 10000 });

        // Verify the page title changed
        await expect(page).toHaveTitle(/Collection of Extension Items/i);
    });
});