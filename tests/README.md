# Testing

This directory contains end-to-end tests for STAC Browser using Playwright.

## Running Tests

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run e2e tests only
npm run test:e2e

# Run e2e tests in UI mode (interactive)
npm run test:e2e:ui

# Run UI tests in headed mode (see browser)
npm run test:e2e:headed

# Debug UI tests
npm run test:e2e:debug

# View UI test report
npm run test:e2e:report
```

## Writing Tests

Tests are located in the `tests/e2e` directory and follow the naming convention `*.spec.js`.

Example test structure:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Add test assertions
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
