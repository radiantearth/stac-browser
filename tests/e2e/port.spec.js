import { test, expect } from '@playwright/test';

// Test with the ACTUAL URL from the issue
test('Reproduce issue #857 - navigate to actual atlas.stacindex.org:3000', async ({ page }) => {
  const allRequests = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('atlas.stacindex.org') || url.includes('stacindex')) {
      allRequests.push({ url, method: request.method() });
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('atlas.stacindex.org') || url.includes('stacindex')) {
      console.log('FAILED request:', url, request.failure()?.errorText);
    }
  });

  // Navigate to the URL from the issue
  await page.goto('/#/external/atlas.stacindex.org:3000/');
  
  // Wait for requests to complete
  await page.waitForTimeout(10000);

  console.log('=== All requests to stacindex ===');
  for (const req of allRequests) {
    const hasPort = req.url.includes(':3000');
    console.log(`  ${hasPort ? 'OK' : 'BUG'}: ${req.method} ${req.url}`);
  }

  // Check: are there any requests without port that should have it?
  const requestsToStacindex = allRequests.filter(r => r.url.includes('atlas.stacindex.org'));
  const requestsWithoutPort = requestsToStacindex.filter(r => !r.url.includes(':3000'));
  
  console.log('\nTotal atlas.stacindex.org requests:', requestsToStacindex.length);
  console.log('Requests without port:', requestsWithoutPort.length);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/issue-857.png' });
  console.log('Final URL:', page.url());
  
  if (requestsToStacindex.length > 0) {
    expect(requestsWithoutPort, 'All atlas.stacindex.org requests should include :3000').toHaveLength(0);
  }
});
