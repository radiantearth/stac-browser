import { test, expect } from '@playwright/test';
import { HOME_PATH, CATALOG_PATH } from './helpers';

test.describe('STAC Browser Catalog', () => {
    test('load catalog view', async ({ page }) => {
        await page.goto(CATALOG_PATH);

        await expect(page.locator('section.intro')).toBeVisible();

        const item_path = `${CATALOG_PATH}/collections/COPERNICUS_30`
        await expect(page.locator(`a.stac-link[href*="${item_path}"]`)).toBeVisible();
    });
});