#!/usr/bin/env node

/**
 * Generates runnable code snippets from each CodeGenerator.
 * Output files are written to tests/integration/generated/
 * and intended to be executed inside Docker containers against
 * a real STAC API
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { generateCode } from '../../src/codegen/index.js';
import PythonGenerator from '../../src/codegen/PythonGenerator.js';
import JavaScriptGenerator from '../../src/codegen/JavaScriptGenerator.js';
import RGenerator from '../../src/codegen/RGenerator.js';
import CSharpGenerator from '../../src/codegen/CSharpGenerator.js';
import JavaGenerator from '../../src/codegen/JavaGenerator.js';
import RustGenerator from '../../src/codegen/RustGenerator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'generated');
mkdirSync(outDir, { recursive: true });

const CATALOG_URL = 'https://planetarycomputer.microsoft.com/api/stac/v1';

const FILTERS = {
  collections: ['sentinel-2-l2a'],
  bbox: [-122.5, 37.5, -122.0, 38.0],
  limit: 5,
};

// ── Python
const pythonCode = generateCode(PythonGenerator, CATALOG_URL, FILTERS);
writeFileSync(join(outDir, 'search.py'), pythonCode + '\n');
console.log('✓ generated Python');

// ── JavaScript (top-level await requires .mjs)
const jsCode = generateCode(JavaScriptGenerator, CATALOG_URL, FILTERS);
writeFileSync(join(outDir, 'search.mjs'), jsCode + '\n');
console.log('✓ generated JavaScript');

// ── R
const rCode = generateCode(RGenerator, CATALOG_URL, FILTERS);
writeFileSync(join(outDir, 'search.R'), rCode + '\n');
console.log('✓ generated R');

// ── C#
const csharpCode = generateCode(CSharpGenerator, CATALOG_URL, FILTERS);
writeFileSync(join(outDir, 'Program.cs'), csharpCode + '\n');
console.log('✓ generated C#');

// ── Java
const javaCode = generateCode(JavaGenerator, CATALOG_URL, FILTERS);
writeFileSync(join(outDir, 'StacSearch.java'), javaCode + '\n');
console.log('✓ generated Java');

// ── Rust
const rustCode = generateCode(RustGenerator, CATALOG_URL, FILTERS);
writeFileSync(join(outDir, 'main.rs'), rustCode + '\n');
console.log('✓ generated Rust');

console.log(`\nAll snippets written to ${outDir}`);
