import fs from 'fs';
import path from 'path';
import { SEARCHABLE_ITEMS } from "./searchable_items/items";

import { EARTH_SEARCH_ROOT_URL, EARTH_SEARCH_COLLECTIONS_URL, EARTH_SEARCH_API_URL } from "./constants";
import { request } from 'http';

export const catalogHandler = async (route) => {
  const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (request.method() === 'GET') {
      try {
        const url = new URL(request.url());
        const subpath = url.pathname.replace('/api/stac/v1/', '') || 'catalog.json';
        const filePath = path.resolve('./tests/mocks/example_catalog/', subpath);
        
        const fileBuffer = fs.readFileSync(filePath, 'utf-8');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: fileBuffer
        });
      } catch (error) {
        await route.fulfill({ status: 404, body: JSON.stringify({ error: 'Not found' }) });
      }
    }
}

export const searchRootHandler = async (route) => {
  const request = route.request(); 
  if (request.method() === 'GET') {
    try {
      const filePath = path.resolve('./tests/mocks/example_catalog/catalog.json');
      const fileBuffer = fs.readFileSync(filePath, 'utf-8');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: fileBuffer
      });
    } catch (error) {
      await route.fulfill({ status: 404, body: JSON.stringify({ error: 'Not found' }) });
    }
  }
}

export const searchHandler = async (route) => {
  const request = route.request();

  async function search(searchParams) {
    // perform search logic here
    
    // filter by collection
    let items = SEARCHABLE_ITEMS;
    if (searchParams.collections) {
      const collections = searchParams.collections;
      items = items.filter(item => collections.includes(item.collection));
    }

    // filter by bbox
    if (searchParams.bbox) {
      const [west, south, east, north] = searchParams.bbox
      items = items.filter(item => {
        const [itemWest, itemSouth, itemEast, itemNorth] = item.bbox;
        return !(itemEast < west || itemWest > east || itemNorth < south || itemSouth > north);
      });
    }

    // filter by intersects (TODO)

    // filter by datetime
    if (searchParams.datetime) {
      const [start, end] = searchParams.datetime.split('/')//.map(t => Date.parse(t));
      items = items.filter(item => {
        const itemStart = item.properties.datetime;
        return (!start || itemStart >= start) && (!end || itemStart <= end);
      });
    }

    // filter by ids
    if (searchParams.ids) {
      const ids = searchParams.ids;
      items = items.filter(item => ids.includes(item.id));
    }

    // limit results
    // TODO: improve pagination here    
    if (searchParams.limit) {
      const limit = parseInt(searchParams.limit);
      items = items.slice(0, limit);
    }

    return {
      type: "FeatureCollection",
      features: items,
      links: [],
    };
  }

  try {  
    if (request.method() === 'GET') {
      //handle GET requests
      // parse arguments
      url = URL.parse(request.url())
      const searchParams = Object.fromEntries( 
          url.search.slice(1)
            .split('&')
            .map(param => param.split('='))
        )

      // return data
      return await search(searchParams)
    }

    if (request.method() === 'POST') {
      //handle POST requests
      const searchParams = request.postDataJSON();

      // return data
      const result = await search(searchParams)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result)
      }); 
    }

  } catch (error) {
    //TODO: search will need more than just 404
    console.warn(error);
    await route.fulfill({ status: 404, body: JSON.stringify({ error: 'Not found' }) });
  }
}

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
      href: EARTH_SEARCH_ROOT_URL,
    },
    {
      rel: "search",
      type: "application/geo+json",
      href: EARTH_SEARCH_API_URL,
      method: "POST",
    },
    {
      rel: "collections",
      type: "application/json",
      href: EARTH_SEARCH_COLLECTIONS_URL,
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
          href: `${EARTH_SEARCH_COLLECTIONS_URL}/test-collection-1`,
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
          href: `${EARTH_SEARCH_COLLECTIONS_URL}/test-collection-2`,
        },
      ],
    },
  ],
  links: [
    {
      rel: "self",
      type: "application/json",
      href: EARTH_SEARCH_COLLECTIONS_URL,
    },
    {
      rel: "root",
      type: "application/json",
      href: EARTH_SEARCH_ROOT_URL,
    },
  ],
  context: {
    page: 1,
    limit: 2,
    matched: 2,
    returned: 2,
  },
};

export const apiRootHandler = async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
        try {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify(API_ROOT_FIXTURE),
            });
        } catch (error) {
            console.log(error);
            await route.fulfill({ status: 404, body: JSON.stringify({ error: "Not found" }) });
        }
        return;
    }
    await route.continue();
}

export const apiCollectionsHandler = async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
        try {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify(API_COLLECTIONS_FIXTURE),
            });
        } catch (error) {
            console.log(error);
            await route.fulfill({ status: 404, body: JSON.stringify({ error: "Not found" }) });
        }
        return;
    }
    await route.continue();
}