// Emit a web component demo host that loads the *built* element bundle, so the
// e2e web-component spec can run against the production build under `vite
// preview` in CI (the dev-server path src/web-component.html is not emitted by a
// normal build). Run after `npm run build && npm run build:web-component`.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('src/web-component.html', 'utf8')
  .replace('./web-component.js', './stac-browser.js');
writeFileSync('dist/web-component.html', html);
