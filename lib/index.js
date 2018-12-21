"use strict";

const path = require("path");
const url = require("url");

const bs58 = require("bs58");
const fetch = require("node-fetch");

function makeRelative(root, uri) {
  const rootURI = url.parse(root);
  const localURI = url.parse(uri);

  if (rootURI.hostname !== localURI.hostname) {
    return uri;
  }

  return path.relative(path.dirname(rootURI.pathname), localURI.pathname);
}

function slugify(root, uri) {
  return bs58.encode(Buffer.from(makeRelative(root, uri)));
}

async function* crawl(url, type = "catalog", ancestors = [], seen = new Map()) {
  if (seen.has(url)) {
    // we've already crawled this url, but not necessarily with these ancestors
    yield [...seen.get(url), ancestors];
    return;
  }

  const entity = await (await fetch(url)).json();

  seen.set(url, [type, url, entity]);

  yield [...seen.get(url), ancestors];

  const children = entity.links
    .filter(x => x.rel === "child")
    .map(x => new URL(x.href, url).toString());

  const items = entity.links
    .filter(x => x.rel === "item")
    .map(x => new URL(x.href, url).toString());

  const collections = entity.links
    .filter(x => x.rel === "collection")
    .map(x => new URL(x.href, url).toString());

  for (const itemUrl of items) {
    if (seen.has(itemUrl)) {
      // we've already crawled this item, but not necessarily with these ancestors
      yield [...seen.get(itemUrl), ancestors.concat(url)];
    } else {
      const item = await (await fetch(itemUrl)).json();

      seen.set(itemUrl, ["item", itemUrl, item]);

      yield [...seen.get(itemUrl), ancestors.concat(url)];
    }
  }

  for (const collectionUrl of collections) {
    yield* crawl(collectionUrl, "collection", [], seen);
  }

  for (const childUrl of children) {
    yield* crawl(childUrl, "catalog", ancestors.concat(url), seen);
  }
}

module.exports = {
  crawl,
  makeRelative,
  slugify
};
