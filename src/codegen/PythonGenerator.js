import CodeGenerator from './CodeGenerator.js';

export default class PythonGenerator extends CodeGenerator {
  static get label() {
    return 'Python';
  }

  static get language() {
    return 'python';
  }

  generate() {
    const lines = [
      'from pystac_client import Client',
      '',
      '# Connect to STAC API',
      `catalog = Client.open("${this.catalogHref}")`,
      ''
    ];

    if (this.hasFilters()) {
      lines.push('# Search parameters');
      const args = this.buildSearchArgs();
      lines.push(`results = catalog.search(${args})`);
    }
    else {
      lines.push('# Search all items');
      lines.push('results = catalog.search()');
    }

    lines.push('');
    lines.push('# Iterate over results');
    lines.push('for item in results.items():');
    lines.push('    print(item.id)');

    return lines.join('\n');
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
