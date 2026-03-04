import { size } from 'stac-js/src/utils.js';
import CodeGenerator from './CodeGenerator.js';
import template from './templates/template.py?raw';

export default class PythonGenerator extends CodeGenerator {
  get language() {
    return 'python';
  }

  get outputFile() {
    return 'search.py';
  }

  get template() {
    return template;
  }

  get indent() {
    return 4;
  }

  get installDependencies() {
    return 'pip install pystac-client';
  }

  commaSeparatedStrings(values) {
    return values.map(v => JSON.stringify(v)).join(', ');
  }

  formatFilters(filters) {
    if (size(filters) === 0) {
      return '';
    }
    const args = [];

    if (size(filters.collections) > 0) {
      const collections = this.commaSeparatedStrings(filters.collections);
      args.push(`collections=[${collections}]`);
    }

    if (size(filters.ids) > 0) {
      const ids = this.commaSeparatedStrings(filters.ids);
      args.push(`ids=[${ids}]`);
    }

    if (filters.bbox) {
      args.push(`bbox=[${filters.bbox.join(', ')}]`);
    }

    if (filters.datetime) {
      args.push(`datetime="${filters.datetime}"`);
    }

    if (size(filters.q) > 0) {
      const terms = this.commaSeparatedStrings(filters.q);
      args.push(`q=[${terms}]`);
    }

    if (filters.limit) {
      args.push(`max_items=${filters.limit}`);
    }

    if (filters.sortby) {
      args.push(`sortby="${filters.sortby}"`);
    }
    
    if (size(filters.filters?.filters) > 0) {
      args.push(`filter=${JSON.stringify(filters.filters.filters)}`);
    }

    const prefix = ' '.repeat(this.indent);
    return '\n' + prefix + args.join(',\n' + prefix) + '\n';
  }
}
