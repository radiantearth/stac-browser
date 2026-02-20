import { test, expect } from '@playwright/test';
import { CATALOG_PATH } from './helpers';

test.describe('STAC Browser Catalog', () => {
    test('load catalog view', async ({ page }) => {
        await page.goto(CATALOG_PATH + '/catalog.json');

        await expect(page.locator('section.intro')).toBeVisible();

        const collection_path = `${CATALOG_PATH}/collections/collection.json`
        await expect(page.locator(`a.stac-link[href*="${collection_path}"]`)).toBeVisible();
    });

    test('search for collections', async ({ page }) => {
        await page.goto(CATALOG_PATH + '/catalog.json');

        await page.locator('#BootstrapVueNext__ID__v-5-0__input___').fill('Extension Items')
        await expect(page.locator('section.catalogs').locator('div.card-grid')).toHaveCount(1);

        await page.locator('#BootstrapVueNext__ID__v-5-0__input___').fill('Does not exist')
        await expect(await page.locator('div.alert-body').innerText()).toBe('No catalogs match the given search criteria.');
    });
})