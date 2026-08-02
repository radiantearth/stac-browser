/**
 * Custom Node.js module loader hooks for running code-generator scripts
 * outside of Vite.
 *
 * Handles two Vite-specific features that plain Node cannot resolve:
 *   1. `?raw` import suffix  → reads the file as a UTF-8 string export
 *   2. `i18n.js` import      → stubbed out (not needed for generation)
 *
 * Usage:  node --import ./node-loader-register.js ./generate-snippets.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve as pathResolve } from 'path';

/**
 * Resolve hook – intercept specifiers before Node tries to find them.
 */
export function resolve(specifier, context, nextResolve) {
  // Stub out the i18n module (it pulls in Vue + Vite-only config)
  if (specifier.endsWith('/i18n.js') || specifier === '../i18n.js') {
    return {
      shortCircuit: true,
      url: 'node:data:text/javascript,' + encodeURIComponent(
        'export default { global: { t: (key) => key } };'
      ),
    };
  }

  // Handle Vite ?raw imports – resolve manually since Node won't resolve .py/.rs/etc.
  if (specifier.endsWith('?raw')) {
    const clean = specifier.slice(0, -4);
    // Resolve the path relative to the importing module
    const parentPath = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : process.cwd();
    const absolutePath = pathResolve(parentPath, clean);
    const fileUrl = pathToFileURL(absolutePath).href;
    return {
      shortCircuit: true,
      url: fileUrl + '?raw',
    };
  }

  return nextResolve(specifier, context);
}

/**
 * Load hook – for ?raw URLs, return the file contents as a default string export.
 */
export function load(url, context, nextLoad) {
  if (url.endsWith('?raw')) {
    const realUrl = url.slice(0, -4);
    const filePath = fileURLToPath(realUrl);
    const source = readFileSync(filePath, 'utf-8');
    return {
      shortCircuit: true,
      format: 'module',
      source: `export default ${JSON.stringify(source)};`,
    };
  }

  // Handle `node:data:` URLs we created for the i18n stub
  if (url.startsWith('node:data:text/javascript,')) {
    const source = decodeURIComponent(url.slice('node:data:text/javascript,'.length));
    return {
      shortCircuit: true,
      format: 'module',
      source,
    };
  }

  return nextLoad(url, context);
}
