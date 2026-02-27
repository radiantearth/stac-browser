import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import CodeGenerator from './CodeGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const template = readFileSync(join(__dirname, 'templates', 'javascript.mjs'), 'utf-8');

export default class JavaScriptGenerator extends CodeGenerator {
  static get label() {
    return 'JavaScript';
  }

  static get language() {
    return 'javascript';
  }

  generate() {
    return this.renderTemplate(template, {
      SEARCH_URL: this.catalogHref.replace(/\/?$/, '/search'),
      FILTERS_JSON: this.filtersJson(),
    });
  }
}
