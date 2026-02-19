import { test, expect } from '@playwright/test';
import { HOME_PATH, CDSE_PATH } from './helpers';

test.describe('STAC Browser Catalog', () => {
    test('load catalog view', async ({ page }) => {
        await page.goto(CDSE_PATH);

        await expect(page.locator('section.metadata')).toBeVisible();

        const item_path = `${CDSE_PATH}/collections/COPERNICUS_30`
        await expect(page.locator(`a.stac-link[href*="${item_path}"]`)).toBeVisible();
    });
});