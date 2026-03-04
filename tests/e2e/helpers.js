import { expect, test as testBase } from "@playwright/test";
import { defineNetworkFixture } from '@msw/playwright';
import { 
  apiRootHandler, 
  catalogHandler, 
  searchHandler, 
  searchRootHandler,
  apiCollectionsHandler 
} from "../mocks/handlers";

import { SEARCH_API_URL, EARTH_SEARCH_ROOT_URL, EARTH_SEARCH_API_URL, EARTH_SEARCH_COLLECTIONS_URL } from "../mocks/constants";


// this is where MWS is integrated into playwright.
// if more granular changes are needed, a similar extension could be applied
// on the given test.spec.js
export const test = testBase.extend({
  // Initial list of the network handlers.
  handlers: [[], { option: true }],

  // A fixture you use to control the network in your tests.
  network: [
    async ({ context, handlers }, use) => {
      const network = defineNetworkFixture({
        context,
        handlers,
      })

      // Intercept mock-catalog.api
      await context.route('https://mock-catalog.api/api/stac/v1/**', catalogHandler);

      // Intercept EARTH_SEARCH_ROOT_URL
      await context.route(EARTH_SEARCH_ROOT_URL, apiRootHandler);
      await context.route(EARTH_SEARCH_COLLECTIONS_URL, apiCollectionsHandler);

      // Intercept search API
      await context.route(`${SEARCH_API_URL}/search`, searchHandler);
      await context.route(SEARCH_API_URL, searchRootHandler);

      await network.enable()
      await use(network)
      await network.disable()
    },
    { auto: true },
  ],

  // Create an auto-running fixture that intercepts network requests behind the scenes
})

// todo: Move STAC documents to separate files


export const waitForMapReady = async (page) => {
  const mapViewport = page.locator(".map .ol-viewport");
  await expect(mapViewport).toBeVisible();

  const mapCanvas = page.locator(".map .ol-viewport canvas.ol-layer");
  await expect(mapCanvas).toBeVisible();

  return mapViewport;
};

export const waitForBboxInputsPopulated = async (page) => {
  const westLonInput = page.getByLabel(/west longitude/i);
  const southLatInput = page.getByLabel(/south latitude/i);
  const eastLonInput = page.getByLabel(/east longitude/i);
  const northLatInput = page.getByLabel(/north latitude/i);

  await expect(westLonInput).not.toHaveValue("");
  await expect(southLatInput).not.toHaveValue("");
  await expect(eastLonInput).not.toHaveValue("");
  await expect(northLatInput).not.toHaveValue("");

  return { westLonInput, southLatInput, eastLonInput, northLatInput };
};

export const waitForSearchPost = async (page, responseBody = null) => {
  let handler;
  const requestPromise = new Promise((resolve) => {
    handler = async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        resolve({
          request,
          body: request.postDataJSON(),
        });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            responseBody || {
              type: "FeatureCollection",
              features: [],
              links: [],
            },
          ),
        });
        await page.unroute(EARTH_SEARCH_API_URL, handler);
        return;
      }
      await route.continue();
    };
  });

  await page.route(EARTH_SEARCH_API_URL, handler);
  return requestPromise;
};
