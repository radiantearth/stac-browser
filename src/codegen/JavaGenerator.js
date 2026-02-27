import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import CodeGenerator from './CodeGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const template = readFileSync(join(__dirname, 'templates', 'java.java'), 'utf-8');

export default class JavaGenerator extends CodeGenerator {
  static get label() {
    return 'Java';
  }

  static get language() {
    return 'java';
  }

  generate() {
    return this.renderTemplate(template, {
      SEARCH_URL: this.catalogHref.replace(/\/?$/, '/search'),
      BODY_STRING: this.buildBodyString(),
    });
  }

  buildBodyString() {
    if (!this.hasFilters()) {
      return '"{}"';
    }
    const jsonStr = JSON.stringify(this.filters).replace(/"/g, '\\"');
    return `"${jsonStr}"`;
  }
}
