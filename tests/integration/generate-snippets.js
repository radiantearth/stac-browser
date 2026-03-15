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

const DEFAULT_CATALOG_URL = 'https://earth-search.aws.element84.com/v1';
const DEFAULT_SEARCH_METHOD = 'POST';

const scenario = process.argv[2] || 'default';

const SCENARIOS = {
  default: {
    catalogUrl: DEFAULT_CATALOG_URL,
    searchMethod: DEFAULT_SEARCH_METHOD,
    filters: {
      collections: ['sentinel-2-l2a'],
      bbox: [-122.5, 37.5, -122.0, 38.0],
      limit: 5,
    }
  },
  'cql-json': {
    catalogUrl: DEFAULT_CATALOG_URL,
    searchMethod: DEFAULT_SEARCH_METHOD,
    filters: {
      collections: ['sentinel-2-l2a'],
      'filter-lang': 'cql2-json',
      filter: {
        op: 'lte',
        args: [
          { property: 'eo:cloud_cover' },
          10
        ]
      },
      limit: 5,
    }
  },
  'cql-text': {
    catalogUrl: 'https://earth-search.aws.element84.com/v1',
    searchMethod: DEFAULT_SEARCH_METHOD,
    filters: {
      collections: ['sentinel-2-l2a'],
      'filter-lang': 'cql2-text',
      filter: 'eo:cloud_cover <= 10',
      limit: 5,
    }
  }
};

if (!SCENARIOS[scenario]) {
  console.error(`Unknown scenario: ${scenario}`);
  process.exit(1);
}

const SCENARIO = SCENARIOS[scenario];
const CATALOG_URL = SCENARIO.catalogUrl;
const SEARCH_METHOD = SCENARIO.searchMethod;
const FILTERS = SCENARIO.filters;

const SEARCH_LINK = new Link({
  href: `${CATALOG_URL}/search`,
  rel: 'search',
  method: SEARCH_METHOD,
  type: 'application/geo+json'
});

for (const g of generators) {
  const generator = new g(CATALOG_URL, SEARCH_LINK);
  const code = generator.generate(FILTERS);
  writeFileSync(join(outDir, generator.outputFile), code + '\n');
  console.log(`✓ generated ${generator.outputFile} (${generator.language})`);
}

console.log(`\nScenario: ${scenario}`);
console.log(`All snippets written to ${outDir}`);
