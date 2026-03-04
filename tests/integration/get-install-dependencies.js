#!/usr/bin/env node

import generators from '../../codeGenerators.config.js';
import { Link } from 'stac-js';

const language = process.argv[2];

if (!language) {
  console.error('Usage: node tests/integration/get-install-dependencies.js <language>');
  process.exit(1);
}

const CATALOG_URL = 'https://planetarycomputer.microsoft.com/api/stac/v1';
const SEARCH_LINK = new Link({
  href: `${CATALOG_URL}/search`,
  rel: 'search',
  method: 'POST',
  type: 'application/geo+json'
});

const Generator = generators.find(g => new g(CATALOG_URL, SEARCH_LINK).language === language);
if (!Generator) {
  console.error(`Unknown language: ${language}`);
  process.exit(1);
}

const generator = new Generator(CATALOG_URL, SEARCH_LINK);
process.stdout.write(generator.installDependencies || '');
