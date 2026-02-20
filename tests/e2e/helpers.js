import { expect } from "@playwright/test";

export const HOME_PATH = "/";
export const SEARCH_PATH = "/search/external/earth-search.aws.test.com/v1?.language=en";

const SEARCH_API_URL = "https://earth-search.aws.test.com/v1/search";

const API_ROOT_URL = "https://earth-search.aws.test.com/v1";
const API_COLLECTIONS_URL = "https://earth-search.aws.test.com/v1/collections";

// todo: Move STAC documents to separate files
const API_ROOT_FIXTURE = {
  stac_version: "1.0.0",
  id: "test-api",
  title: "Test API",
  description: "Test API root",
  conformsTo: [
    "https://api.stacspec.org/v1.0.0/item-search",
    "https://api.stacspec.org/v1.0.0/item-search#sort",
    "https://api.stacspec.org/v1.0.0/collection-search",
  ],
  links: [
    {
      rel: "self",
      type: "application/json",
      href: API_ROOT_URL,
    },
    {
      rel: "search",
      type: "application/geo+json",
      href: SEARCH_API_URL,
      method: "POST",
    },
    {
      rel: "collections",
      type: "application/json",
      href: API_COLLECTIONS_URL,
    },
  ],
};

const API_COLLECTIONS_FIXTURE = {
  collections: [
    {
      type: "Collection",
      id: "test-collection-1",
      title: "Test Collection 1",
      description: "Test collection 1",
      stac_version: "1.0.0",
      extent: {
        spatial: { bbox: [[-180, -90, 180, 90]] },
        temporal: { interval: [["2020-01-01T00:00:00Z", null]] },
      },
      links: [
        {
          rel: "self",
          type: "application/json",
          href: `${API_COLLECTIONS_URL}/test-collection-1`,
        },
      ],
    },
    {
      type: "Collection",
      id: "test-collection-2",
      title: "Test Collection 2",
      description: "Test collection 2",
      stac_version: "1.0.0",
      extent: {
        spatial: { bbox: [[-10, -10, 10, 10]] },
        temporal: { interval: [["2021-01-01T00:00:00Z", null]] },
      },
      links: [
        {
          rel: "self",
          type: "application/json",
          href: `${API_COLLECTIONS_URL}/test-collection-2`,
        },
      ],
    },
  ],
  links: [
    {
      rel: "self",
      type: "application/json",
      href: API_COLLECTIONS_URL,
    },
    {
      rel: "root",
      type: "application/json",
      href: API_ROOT_URL,
    },
  ],
  context: {
    page: 1,
    limit: 2,
    matched: 2,
    returned: 2,
  },
};

export const mockApiRootAndCollections = async (page) => {
  await page.route(API_ROOT_URL, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(API_ROOT_FIXTURE),
      });
      return;
    }
    await route.continue();
  });

  await page.route(API_COLLECTIONS_URL, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(API_COLLECTIONS_FIXTURE),
      });
      return;
    }
    await route.continue();
  });
};

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
        await page.unroute(SEARCH_API_URL, handler);
        return;
      }
      await route.continue();
    };
  });

  await page.route(SEARCH_API_URL, handler);
  return requestPromise;
};
