import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import CodeGenerator from './CodeGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const template = readFileSync(join(__dirname, 'templates', 'python.py'), 'utf-8');

export default class PythonGenerator extends CodeGenerator {
  static get label() {
    return 'Python';
  }

  static get language() {
    return 'python';
  }

  generate() {
    return this.renderTemplate(template, {
      CATALOG_URL: this.catalogHref,
      SEARCH_ARGS: this.hasFilters() ? this.buildSearchArgs() : '',
    });
  }

  buildSearchArgs() {
    const args = [];

    if (this.filters.collections && this.filters.collections.length > 0) {
      const collections = this.filters.collections.map(c => `"${c}"`).join(', ');
      args.push(`collections=[${collections}]`);
    }

    if (this.filters.ids && this.filters.ids.length > 0) {
      const ids = this.filters.ids.map(id => `"${id}"`).join(', ');
      args.push(`ids=[${ids}]`);
    }

    if (this.filters.bbox) {
      args.push(`bbox=[${this.filters.bbox.join(', ')}]`);
    }

    if (this.filters.datetime) {
      args.push(`datetime="${this.filters.datetime}"`);
    }

    if (this.filters.q && this.filters.q.length > 0) {
      const terms = this.filters.q.map(t => `"${t}"`).join(', ');
      args.push(`q=[${terms}]`);
    }

    if (this.filters.limit) {
      args.push(`max_items=${this.filters.limit}`);
    }

    if (this.filters.sortby) {
      args.push(`sortby="${this.filters.sortby}"`);
    }

    if (this.filters.filter) {
      args.push(`filter=${JSON.stringify(this.filters.filter)}`);
    }

    return '\n    ' + args.join(',\n    ') + '\n';
  }
}
