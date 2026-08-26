/**
* Homepage / catalog index tests.
*
* Verifies the STAC Browser landing page: catalog list rendering, search input,
* navigation to a catalog, and STAC Index entry clicks.
*
* Fixtures: tests/fixtures/catalogs.json (synthetic STAC Index entries)
*/
import { test, expect } from './fixtures.js';
import { configureBrowser, HOME_PATH, mockStacResource } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';
import fs from 'fs';
const catalogs = JSON.parse(fs.readFileSync(
  new URL('../fixtures/templates/catalogs.json', import.meta.url), 'utf-8'
));
import CONFIG from '../../config.js';

test.describe('STAC Browser Data Source Selection', () => {
  // ensure every test uses the mocked STAC Index response
  test.beforeEach(async ({ worker }) => {
    await mockStacResource(worker, 'https://stacindex.org/api/catalogs', catalogs);
  });
  test('should load the data source selection successfully', async ({ page }) => {
    // Navigate to the data source selection (STAC Index already mocked in beforeEach)
    await page.goto(HOME_PATH);
    
    // Check if the page title is visible
    await expect(page.locator('header [role="banner"]')).toBeVisible();

    // Verify the page loads without errors
    await expect(page).toHaveTitle(/STAC Browser/);
    
    // confirm that the STAC index container is present and contains at least one entry
    await page.waitForSelector('.stac-index');
    const indexButtons = page.locator('.stac-index button');
    const count = await indexButtons.count();
    expect(count).toBeGreaterThan(10);
    
    // each entry should have a title and mention either API or Catalog
    await Promise.all(Array.from({ length: count }, (_, i) => {
      const btn = indexButtons.nth(i);
      return Promise.all([
        expect(btn.locator('strong')).toHaveCount(1),
        // the button text should include 'API' or 'Catalog' indicating badge
        expect(btn).toContainText(/API|Catalog/i)
      ]);
    }));
  });
  
  test('should render language dropdown with flag icon and correct defaults', async ({ page }) => {
    await page.goto(HOME_PATH);
    
    // Find the language dropdown button - it should have "Language: English" text
    const languageButton = page.getByRole('button', { name: /language.*english/i });
    
    // Check if the language button is visible
    await expect(languageButton).toBeVisible();
    
    // Verify button text contains "Language: English"
    await expect(languageButton).toContainText(/language:\s*english/i);
    
    // Click to open the dropdown
    await languageButton.click();
    
    // Wait for dropdown menu to appear
    const dropdownMenu = page.locator('.dropdown-menu');
    await expect(dropdownMenu).toBeVisible();
    
    // Count the number of language options (should be as defined in the config)
    const languageOptions = dropdownMenu.locator('.dropdown-item');
    await expect(languageOptions).toHaveCount(CONFIG.supportedLocales.length);
    
    // Verify English is visible in the list
    const englishOption = dropdownMenu.getByText(/english/i);
    await expect(englishOption).toBeVisible();
  });

  test('Arabic switches the complete interface to RTL and keeps technical input LTR', async ({ page }) => {
    await page.goto(`${HOME_PATH}?.language=ar`);

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#stac-browser')).toHaveCSS('direction', 'rtl');
    await expect(page.getByRole('button', { name: 'تحميل', exact: true })).toBeVisible();

    // URLs remain unambiguous even while the surrounding form follows Arabic direction.
    const urlInput = page.getByRole('textbox', { name: /كتالوج STAC أو API/i });
    await expect(urlInput).toHaveAttribute('dir', 'ltr');
    await expect(urlInput).toHaveCSS('direction', 'ltr');

    // The leading navigation group moves to the right and the user controls to the left.
    const navigation = await page.locator('header .site .navigation').boundingBox();
    const userControls = await page.locator('header .site .user').boundingBox();
    expect(navigation.x).toBeGreaterThan(userControls.x);

    // Direction must be reversible when users switch back to an LTR language.
    await page.getByRole('button', { name: /اللغة: العربية/ }).click();
    await page.locator('.dropdown-menu:visible').getByText(/^English$/).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('a preselected UI language follows the matching catalog alternate', async ({ page, worker }) => {
    const englishUrl = 'https://stac.example/language/catalog.json';
    const arabicUrl = 'https://stac.example/language/ar/catalog.json';
    const languageExtension = 'https://stac-extensions.github.io/language/v1.0.0/schema.json';

    const englishCatalog = new StaticCatalog({ url: englishUrl }).setMetadata({
      title: 'English Catalog',
      language: { code: 'en', name: 'English' },
      languages: [{ code: 'ar', name: 'العربية', alternate: 'Arabic', dir: 'rtl' }],
    });
    englishCatalog.root
      .addExtensions([languageExtension])
      .addLink({ rel: 'alternate', href: arabicUrl, type: 'application/json', hreflang: 'ar' });
    const englishChild = englishCatalog.addCatalog({
      url: 'https://stac.example/language/child.json',
    }).setMetadata({
      title: 'English Child',
      language: { code: 'en', name: 'English' },
      languages: [{ code: 'ar', name: 'العربية', alternate: 'Arabic', dir: 'rtl' }],
    });

    const arabicCatalog = new StaticCatalog({ url: arabicUrl }).setMetadata({
      title: 'كتالوج عربي',
      description: 'كتالوج تجريبي باللغة العربية.',
      language: { code: 'ar', name: 'العربية', dir: 'rtl' },
      languages: [{ code: 'en', name: 'English' }],
    });
    arabicCatalog.root
      .addExtensions([languageExtension])
      .addLink({ rel: 'alternate', href: englishUrl, type: 'application/json', hreflang: 'en' });
    const arabicChild = arabicCatalog.addCatalog({
      url: 'https://stac.example/language/ar/child.json',
    }).setMetadata({
      title: 'عنصر عربي',
      language: { code: 'ar', name: 'العربية', dir: 'rtl' },
      languages: [{ code: 'en', name: 'English' }],
    });
    englishChild
      .addExtensions([languageExtension])
      .addLink({ rel: 'alternate', href: arabicChild.getAbsoluteUrl(), type: 'application/json', hreflang: 'ar' });
    arabicChild
      .addExtensions([languageExtension])
      .addLink({ rel: 'alternate', href: englishChild.getAbsoluteUrl(), type: 'application/json', hreflang: 'en' });

    await englishCatalog.createServer(worker, { reset: false });
    await arabicCatalog.createServer(worker, { reset: false });

    await page.goto(`${HOME_PATH}?.language=ar`);
    await page.getByRole('textbox', { name: /كتالوج STAC أو API/i }).fill(englishUrl);
    await page.getByRole('button', { name: 'تحميل', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'كتالوج عربي' })).toBeVisible();
    await expect(page.locator('header [role="banner"]')).toHaveText('كتالوج عربي');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.getByRole('button', { name: /اللغة: العربية/ }).click();
    await page.locator('.dropdown-menu:visible').getByText(/^English$/).click();
    await expect(page.getByRole('heading', { name: 'English Catalog' })).toBeVisible();
    await expect(page.locator('header [role="banner"]')).toHaveText('English Catalog');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await page.getByRole('button', { name: /Language: English/ }).click();
    await page.locator('.dropdown-menu:visible').getByText(/^العربية$/).click();
    await expect(page.getByRole('heading', { name: 'كتالوج عربي' })).toBeVisible();
    await expect(page.locator('header [role="banner"]')).toHaveText('كتالوج عربي');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // The localized root context must also follow switches made on child pages.
    await page.goto(`${arabicChild.getBrowserPath()}?.language=ar`);
    await expect(page.getByRole('heading', { name: 'عنصر عربي' })).toBeVisible();
    await expect(page.locator('header [role="banner"]')).toHaveText('كتالوج عربي');

    await page.getByRole('button', { name: /اللغة: العربية/ }).click();
    await page.locator('.dropdown-menu:visible').getByText(/^English$/).click();
    await expect(page.getByRole('heading', { name: 'English Child' })).toBeVisible();
    await expect(page.locator('header [role="banner"]')).toHaveText('English Catalog');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('a configured catalog keeps stable paths while switching localized roots', async ({ page, worker }) => {
    const englishUrl = 'https://stac.example/configured/catalog.json';
    const arabicUrl = 'https://stac.example/configured/ar/catalog.json';
    const englishChildUrl = 'https://stac.example/configured/children/child.json';
    const arabicChildUrl = 'https://stac.example/configured/ar/localized/arabic-child.json';
    const languageExtension = 'https://stac-extensions.github.io/language/v1.0.0/schema.json';

    await configureBrowser(page, {
      catalogUrl: englishUrl,
      detectLocaleFromBrowser: false,
      storeLocale: false,
      locale: 'en',
      fallbackLocale: 'en',
      supportedLocales: ['ar', 'en'],
    });

    const englishCatalog = new StaticCatalog({ url: englishUrl }).setMetadata({
      title: 'Configured English Catalog',
      language: { code: 'en', name: 'English' },
      languages: [{ code: 'ar', name: 'العربية', alternate: 'Arabic', dir: 'rtl' }],
    });
    englishCatalog.root
      .addExtensions([languageExtension])
      .addLink({ rel: 'alternate', href: arabicUrl, type: 'application/json', hreflang: 'ar' });
    const englishChild = englishCatalog.addCatalog({ url: englishChildUrl }).setMetadata({
      title: 'Configured English Child',
      language: { code: 'en', name: 'English' },
      languages: [{ code: 'ar', name: 'العربية', alternate: 'Arabic', dir: 'rtl' }],
    });

    const arabicCatalog = new StaticCatalog({ url: arabicUrl }).setMetadata({
      title: 'كتالوج عربي مضبوط',
      language: { code: 'ar', name: 'العربية', dir: 'rtl' },
      languages: [{ code: 'en', name: 'English' }],
    });
    arabicCatalog.root
      .addExtensions([languageExtension])
      .addLink({ rel: 'alternate', href: englishUrl, type: 'application/json', hreflang: 'en' });
    const arabicChild = arabicCatalog.addCatalog({ url: arabicChildUrl }).setMetadata({
      title: 'عنصر عربي مضبوط',
      language: { code: 'ar', name: 'العربية', dir: 'rtl' },
      languages: [{ code: 'en', name: 'English' }],
    });
    englishChild
      .addExtensions([languageExtension])
      .addLink({ rel: 'alternate', href: arabicChildUrl, type: 'application/json', hreflang: 'ar' });
    arabicChild
      .addExtensions([languageExtension])
      .addLink({ rel: 'alternate', href: englishChildUrl, type: 'application/json', hreflang: 'en' });

    await englishCatalog.createServer(worker, { reset: false });
    await arabicCatalog.createServer(worker, { reset: false });

    await page.goto(`${HOME_PATH}?.language=ar`);
    await expect(page.getByRole('heading', { name: 'كتالوج عربي مضبوط' })).toBeVisible();
    await expect(page.locator('header [role="banner"]')).toHaveText('كتالوج عربي مضبوط');
    await expect(page).toHaveURL(/\/ar\/catalog\.json\?\.language=ar$/);

    await page.goto('/children/child.json?.language=en');
    await expect(page.getByRole('heading', { name: 'Configured English Child' })).toBeVisible();
    await page.getByRole('button', { name: /Language: English/ }).click();
    await page.locator('.dropdown-menu:visible').getByText(/^العربية$/).click();
    await expect(page.getByRole('heading', { name: 'عنصر عربي مضبوط' })).toBeVisible();
    await expect(page.locator('header [role="banner"]')).toHaveText('كتالوج عربي مضبوط');
    await expect(page).toHaveURL(/\/ar\/localized\/arabic-child\.json\?\.language=ar$/);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'عنصر عربي مضبوط' })).toBeVisible();
    await expect(page.locator('header [role="banner"]')).toHaveText('كتالوج عربي مضبوط');
  });

  test('should render catalog URL input with proper elements', async ({ page }) => {
    await page.goto(HOME_PATH);
    
    // Check if the label/heading is visible
    const label = page.getByText(/please specify a stac catalog or api/i);
    await expect(label).toBeVisible();
    
    // Find the input textbox
    const input = page.getByRole('textbox', { name: /please specify a stac catalog or api/i });
    await expect(input).toBeVisible();
    
    // Verify the placeholder
    await expect(input).toHaveAttribute('placeholder', /https:/);
    
    // Check if Load button is visible and clickable
    const loadButton = page.getByRole('button', { name: /^load$/i });
    await expect(loadButton).toBeVisible();
    await expect(loadButton).toBeEnabled();
  });
  
  test('should allow typing in the catalog URL input', async ({ page }) => {
    await page.goto(HOME_PATH);
    
    const input = page.getByRole('textbox', { name: /please specify a stac catalog or api/i });
    
    // Type a valid STAC API URL
    await input.fill('https://planetarycomputer.microsoft.com/api/stac/v1/');
    
    // Verify the value was entered
    await expect(input).toHaveValue('https://planetarycomputer.microsoft.com/api/stac/v1/');
  });
  
  test('should show error message while typing invalid URL', async ({ page }) => {
    await page.goto(HOME_PATH);
    
    const input = page.getByRole('textbox', { name: /please specify a stac catalog or api/i });
    
    // Type an invalid URL
    await input.fill('not-a-valid-url');
    
    // Error should appear immediately without clicking Load
    const errorMessage = page.getByText(/the url is invalid/i);
    await expect(errorMessage).toBeVisible();
  });
  
  test('should navigate to catalog when valid URL is loaded', async ({ page, worker }) => {
    const catalogUrl = 'https://planetarycomputer.microsoft.com/api/stac/v1/';
    const mockCatalog = (new StaticCatalog({ url: catalogUrl }))
      .setMetadata({
        title: 'Microsoft Planetary Computer STAC API',
        description: 'Mock catalog for testing navigation.',
      });
    
    await mockCatalog.createServer(worker, { reset: false });
    
    await page.goto(HOME_PATH);
    
    const input = page.getByRole('textbox', { name: /please specify a stac catalog or api/i });
    const loadButton = page.getByRole('button', { name: /^load$/i });
    
    await input.fill(catalogUrl);
    await loadButton.click();
    
    // Wait for navigation and verify the catalog title appears as h1 heading
    const catalogTitle = page.getByRole('heading', { name: /microsoft planetary computer stac api/i });
    await expect(catalogTitle).toBeVisible();
    
    // Verify the page title changed
    await expect(page).toHaveTitle(/microsoft planetary computer stac api/i);
  });
  
  test('clicking a STAC index entry populates url and navigates', async ({ page, worker }) => {
    const expectedTitle = 'Example Catalog';
    const expectedUrl = 'https://stac.example/stac/catalog.json';
    const mockCatalog = new StaticCatalog({ url: expectedUrl })
      .setMetadata({
        title: expectedTitle,
        description: 'Mock catalog for the first STAC index entry.',
      });
    
    await mockCatalog.createServer(worker, { reset: false });
    
    await page.goto(HOME_PATH);
    const indexButtons = page.locator('.stac-index button');
    await expect(indexButtons).toHaveCount(catalogs.length);
    
    // Click the first entry in the STAC index
    await indexButtons.first().click();
    
    // Wait for navigation and verify the catalog title appears as h1 heading
    const catalogTitle = page.getByRole('heading', { name: new RegExp(expectedTitle, 'i') });
    await expect(catalogTitle).toBeVisible();
    
    // Verify the page title changed
    await expect(page).toHaveTitle(new RegExp(expectedTitle, 'i'));
  });
  
  test('language switch persists across navigation', async ({ page }) => {
    await page.goto(HOME_PATH);
    const languageButton = page.getByRole('button', { name: /language/i });
    await languageButton.click();
    const spanish = page.getByText(/español/i);
    await spanish.click();
    // verify label changed (load button text in Spanish via translation key)
    await expect(page.getByRole('button', { name: /cargar|cargar/i })).toBeVisible();
    // navigate away and back
    await page.goto(HOME_PATH);
    await expect(page.getByRole('button', { name: /cargar|cargar/i })).toBeVisible();
  });
});
