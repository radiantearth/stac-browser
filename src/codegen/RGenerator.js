import CodeGenerator from './CodeGenerator.js';
import template from './templates/r.template.js';

export default class RGenerator extends CodeGenerator {
  static get label() {
    return 'R';
  }

  static get language() {
    return 'r';
  }

  static get outputFile() {
    return 'search.R';
  }

  generate() {
    return this.renderTemplate(template, {
      CATALOG_URL: this.catalogHref,
      SEARCH_ARGS: this.buildSearchArgs(),
    });
  }

  buildSearchArgs() {
    const props = [];

    if (this.filters.collections && this.filters.collections.length > 0) {
      const collections = this.filters.collections.map(c => `"${c}"`).join(', ');
      props.push(`collections = c(${collections})`);
    }

    if (this.filters.ids && this.filters.ids.length > 0) {
      const ids = this.filters.ids.map(id => `"${id}"`).join(', ');
      props.push(`ids = c(${ids})`);
    }

    if (this.filters.bbox) {
      props.push(`bbox = c(${this.filters.bbox.join(', ')})`);
    }

    if (this.filters.datetime) {
      props.push(`datetime = "${this.filters.datetime}"`);
    }

    if (this.filters.limit) {
      props.push(`limit = ${this.filters.limit}`);
    }

    if (props.length === 0) {
      return '';
    }
    return ',\n  ' + props.join(',\n  ');
  }
}
