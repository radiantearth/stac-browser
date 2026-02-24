import CodeGenerator from './CodeGenerator.js';

export default class RGenerator extends CodeGenerator {
  static get label() {
    return 'R';
  }

  static get language() {
    return 'r';
  }

  generate() {
    const lines = [
      'library(rstac)',
      '',
      '# Connect to STAC API',
      `stac_obj <- stac("${this.catalogHref}")`,
      ''
    ];

    lines.push('# Build and execute search');
    lines.push('items <- stac_obj |>');
    lines.push('  stac_search(');

    const args = [];

    if (this.filters.collections && this.filters.collections.length > 0) {
      const collections = this.filters.collections.map(c => `"${c}"`).join(', ');
      args.push(`    collections = c(${collections})`);
    }

    if (this.filters.ids && this.filters.ids.length > 0) {
      const ids = this.filters.ids.map(id => `"${id}"`).join(', ');
      args.push(`    ids = c(${ids})`);
    }

    if (this.filters.bbox) {
      args.push(`    bbox = c(${this.filters.bbox.join(', ')})`);
    }

    if (this.filters.datetime) {
      args.push(`    datetime = "${this.filters.datetime}"`);
    }

    if (this.filters.limit) {
      args.push(`    limit = ${this.filters.limit}`);
    }

    if (args.length > 0) {
      lines.push(args.join(',\n'));
    }

    lines.push('  ) |>');
    lines.push('  get_request()');
    lines.push('');
    lines.push('# View results');
    lines.push('items');

    return lines.join('\n');
  }
}
