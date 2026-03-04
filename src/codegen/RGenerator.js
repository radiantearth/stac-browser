import CodeGenerator from './CodeGenerator.js';
import template from './templates/template.r?raw';

export default class RGenerator extends CodeGenerator {
  get language() {
    return 'r';
  }

  get outputFile() {
    return 'search.R';
  }

  get template() {
    return template;
  }

  get indent() {
    return 4;
  }

  commaSeparatedStrings(values) {
    return values.map(v => JSON.stringify(v)).join(', ');
  }

  formatFilters(filters) {
    const props = [];

    if (filters.collections && filters.collections.length > 0) {
      const collections = this.commaSeparatedStrings(filters.collections);
      props.push(`collections = c(${collections})`);
    }

    if (filters.ids && filters.ids.length > 0) {
      const ids = this.commaSeparatedStrings(filters.ids);
      props.push(`ids = c(${ids})`);
    }

    if (filters.bbox) {
      props.push(`bbox = c(${filters.bbox.join(', ')})`);
    }

    if (filters.datetime) {
      props.push(`datetime = "${filters.datetime}"`);
    }

    // todo: q is not exposed

    if (filters.limit) {
      props.push(`limit = ${filters.limit}`);
    }

    if (props.length === 0) {
      return '';
    }

    const prefix = ' '.repeat(this.indent);
    return ',\n' + prefix + props.join(',\n' + prefix);
  }
}
