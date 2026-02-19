import { test, expect } from '@playwright/test';
import { CATALOG_PATH } from './helpers';

test.describe('STAC Browser Catalog', () => {
    test('load catalog view', async ({ page }) => {
        await page.goto(CATALOG_PATH);

        await expect(page.locator('section.intro')).toBeVisible();

        const collection_path = `${CATALOG_PATH}/collection-only/collection.json`
        await expect(page.locator(`a.stac-link[href*="${collection_path}"]`)).toBeVisible();
    });
});