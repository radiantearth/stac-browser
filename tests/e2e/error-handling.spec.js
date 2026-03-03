/**
 * Error handling tests.
 *
 * Verifies that STAC Browser shows appropriate error alerts when HTTP requests
 * fail.  Covers 404 (Not Found), 500 (Server Error), and custom STAC API error
 * responses with a description field.
 *
 * Uses the existing `mockStacError` helper — no additional fixtures needed.
 */
import { test, expect } from './fixtures';
import { mockStacError, waitForBrowserReady } from './helpers';

const MISSING_URL = 'https://example.com/does-not-exist';
const MISSING_PATH = '/external/example.com/does-not-exist';

const SERVER_ERROR_URL = 'https://example.com/server-error';
const SERVER_ERROR_PATH = '/external/example.com/server-error';

test.describe('Error handling', () => {

  test('404 response shows "not found" error alert with URL', async ({ page, worker }) => {
    await mockStacError(worker, MISSING_URL, 404, 'Not Found');
    await page.goto(MISSING_PATH);
    await waitForBrowserReady(page);

    // ErrorAlert should be visible (danger variant)
    const alert = page.locator('.alert-danger');
    await expect(alert).toBeVisible();

    // Should mention that the resource does not exist
    await expect(alert).toContainText(/does not exist/i);

    // Should display the request URL
    await expect(alert.locator('.url code')).toContainText(MISSING_URL);
  });

  test('500 response shows server error alert', async ({ page, worker }) => {
    await mockStacError(worker, SERVER_ERROR_URL, 500, 'Internal Server Error');
    await page.goto(SERVER_ERROR_PATH);
    await waitForBrowserReady(page);

    const alert = page.locator('.alert-danger');
    await expect(alert).toBeVisible();

    // Should mention a server issue
    await expect(alert).toContainText(/server/i);
  });

  test('error alert displays the error code', async ({ page, worker }) => {
    await mockStacError(worker, MISSING_URL, 404, 'Not Found');
    await page.goto(MISSING_PATH);
    await waitForBrowserReady(page);

    const alert = page.locator('.alert-danger');
    await expect(alert).toBeVisible();

    // The error code section should show 404
    await expect(alert.locator('.id code')).toContainText('404');
  });

  test('STAC API error description is shown in the alert', async ({ page, worker }) => {
    const customMessage = 'Collection has been permanently removed';
    await mockStacError(worker, MISSING_URL, 410, customMessage);
    await page.goto(MISSING_PATH);
    await waitForBrowserReady(page);

    const alert = page.locator('.alert-danger');
    await expect(alert).toBeVisible();

    // The custom description from the STAC API error response should appear
    await expect(alert.locator('.description')).toContainText(customMessage);
  });
});
