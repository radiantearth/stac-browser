import { test, expect } from '@playwright/test';
import { HOME_PATH } from './helpers';

test.describe('STAC Browser Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto(HOME_PATH);
    
    // Check if the page title is visible
    await expect(page.locator('header [role="banner"]')).toBeVisible();
    
    // Verify the page loads without errors
    await expect(page).toHaveTitle(/STAC Browser/);
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
    
    // Count the number of language options (should be 11)
    const languageOptions = dropdownMenu.locator('.dropdown-item');
    await expect(languageOptions).toHaveCount(11);
    
    // Verify English is visible in the list
    const englishOption = dropdownMenu.getByText(/english/i);
    await expect(englishOption).toBeVisible();
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

  test('should navigate to catalog when valid URL is loaded', async ({ page }) => {
    await page.goto(HOME_PATH);
    
    const input = page.getByRole('textbox', { name: /please specify a stac catalog or api/i });
    const loadButton = page.getByRole('button', { name: /^load$/i });
    
    // Type the Planetary Computer STAC API URL
    await input.fill('https://planetarycomputer.microsoft.com/api/stac/v1/');
    
    // Click the Load button
    await loadButton.click();
    
    // Wait for navigation and verify the catalog title appears as h1 heading
    const catalogTitle = page.getByRole('heading', { name: /microsoft planetary computer stac api/i });
    await expect(catalogTitle).toBeVisible({ timeout: 10000 });
    
    // Verify the page title changed
    await expect(page).toHaveTitle(/microsoft planetary computer stac api/i);
  });
});
