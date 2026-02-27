import CodeGenerator from './CodeGenerator.js';
import template from './templates/rust.template.js';

export default class RustGenerator extends CodeGenerator {
  static get label() {
    return 'Rust';
  }

  static get language() {
    return 'rust';
  }

  generate() {
    return this.renderTemplate(template, {
      SEARCH_URL: this.catalogHref.replace(/\/?$/, '/search'),
      FILTERS_JSON: this.buildRustJson(),
    });
  }

  buildRustJson() {
    if (!this.hasFilters()) {
      return '{}';
    }
    return JSON.stringify(this.filters, null, 4)
      .split('\n')
      .map((line, i) => i === 0 ? line : `    ${line}`)
      .join('\n');
  }
}
