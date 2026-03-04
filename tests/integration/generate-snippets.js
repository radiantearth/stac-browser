#!/usr/bin/env node

/**
 * Generates runnable code snippets from each CodeGenerator.
 * Output files are written to tests/integration/generated/
 * and intended to be executed inside Docker containers against
 * a real STAC API.
 *
 * This script discovers generators via codeGenerators.config.js
 * in the project root — no changes needed here when a language
 * is added or removed.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import generators from '../../codeGenerators.config.js';
import { Link } from 'stac-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'generated');
mkdirSync(outDir, { recursive: true });

const CATALOG_URL = 'https://planetarycomputer.microsoft.com/api/stac/v1';
const SEARCH_LINK = new Link({
  href: `${CATALOG_URL}/search`,
  rel: 'search',
  method: 'POST',
  type: 'application/geo+json'
});


const FILTERS = {
  collections: ['sentinel-2-l2a'],
  bbox: [-122.5, 37.5, -122.0, 38.0],
  limit: 5,
};

for (const g of generators) {
  const generator = new g(CATALOG_URL, SEARCH_LINK);
  const code = generator.generate(FILTERS);
  writeFileSync(join(outDir, generator.outputFile), code + '\n');
  console.log(`✓ generated ${generator.label}`);
}

console.log(`\nAll snippets written to ${outDir}`);
