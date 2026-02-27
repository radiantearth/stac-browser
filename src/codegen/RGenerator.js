import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import CodeGenerator from './CodeGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const template = readFileSync(join(__dirname, 'templates', 'r.R'), 'utf-8');

export default class RGenerator extends CodeGenerator {
  static get label() {
    return 'R';
  }

  static get language() {
    return 'r';
  }

  generate() {
    return this.renderTemplate(template, {
      SEARCH_URL: this.catalogHref.replace(/\/?$/, '/search'),
      BODY_PROPS: this.buildBodyProps(),
    });
  }

  buildBodyProps() {
    const props = [];

    if (this.filters.collections && this.filters.collections.length > 0) {
      const collections = this.filters.collections.map(c => `"${c}"`).join(', ');
      props.push(`  collections = I(c(${collections}))`);
    }

    if (this.filters.ids && this.filters.ids.length > 0) {
      const ids = this.filters.ids.map(id => `"${id}"`).join(', ');
      props.push(`  ids = I(c(${ids}))`);
    }

    if (this.filters.bbox) {
      props.push(`  bbox = c(${this.filters.bbox.join(', ')})`);
    }

    if (this.filters.datetime) {
      props.push(`  datetime = "${this.filters.datetime}"`);
    }

    if (this.filters.limit) {
      props.push(`  limit = ${this.filters.limit}`);
    }

    if (props.length === 0) {
      return '';
    }
    return '\n' + props.join(',\n') + '\n';
  }
}
