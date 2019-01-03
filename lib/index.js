"use strict";

const path = require("path");
const { Readable } = require("stream");
const url = require("url");

const bs58 = require("bs58");
const fetch = require("node-fetch");
const pQueue = require("p-queue");

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

async function process(url, type = "catalog", ancestors = []) {
  const entity = await (await fetch(url)).json();

  if (type === "collection") {
    ancestors = [];
  }

  const processed = [url, type, ancestors, entity];

  const items = entity.links
    .filter(x => x.rel === "item")
    .map(x => new URL(x.href, url).toString())
    .map(x => [x, "item", [...ancestors, url]]);

  const children = entity.links
    .filter(x => x.rel === "child")
    .map(x => new URL(x.href, url).toString())
    .map(x => [x, "catalog", [...ancestors, url]]);

  const collections = entity.links
    .filter(x => x.rel === "collection")
    .map(x => new URL(x.href, url).toString())
    .map(x => [x, "collection", []]);

  return [processed, [...items, ...children, ...collections]];
}

class Crawler extends Readable {
  constructor(root, { concurrency = 64 } = {}) {
    super({
      objectMode: true
    });

    this.concurrency = concurrency;
    this.seen = new Set();
    this.pending = [];

    this.pending.push([root, "catalog"]);

    this.queue = new pQueue({
      concurrency
    });
  }

  async _read() {
    if (this.pending.length === 0) {
      await this.queue.onIdle();
      this.push(null);
      return;
    }

    const toQueue = Math.min(
      this.pending.length,
      this.concurrency - this.queue.pending
    );

    for (let i = 0; i < toQueue; i++) {
      this.queue.add(this._process.bind(this));
    }
  }

  async _process() {
    if (this.pending.length === 0) {
      return;
    }

    const [url, type, ancestors] = this.pending.shift();
    this.seen.add([url, type, ancestors].join("::"));

    try {
      const [head, rest] = await process(url, type, ancestors);
      this.push(head);

      const tail = rest.filter(x => !this.seen.has(x.join("::")));

      this.pending.push(...tail);
    } catch (err) {
      console.warn("%s:", url, err.stack);
    }
  }
}

function crawl(url) {
  return new Crawler(url);
}

module.exports = {
  crawl,
  makeRelative,
  slugify
};
