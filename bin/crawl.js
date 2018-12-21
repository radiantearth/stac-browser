#!/usr/bin/env node
"use strict";

const commandLineArgs = require("command-line-args");

const { crawl } = require("../lib/");

const options = commandLineArgs([
  { name: "verbose", alias: "v", type: Boolean },
  { name: "help", alias: "h", type: Boolean },
  { name: "root", type: String, defaultOption: true }
]);

if (options.help || options.root == null) {
  console.warn("Usage: crawl [-v] [-h] <root catalog URL>");
  process.exit(1);
}

async function main() {
  // eslint-disable-next-line no-unused-vars
  for await (const [type, url, entity, ancestors] of crawl(options.root)) {
    console.log(type, url);
  }
}

main()
  .then(process.exit)
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
