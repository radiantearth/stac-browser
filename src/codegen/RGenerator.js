import CodeGenerator from './CodeGenerator.js';
import templateItem from './templates/r-item.r?raw';
import templateGet from './templates/r-get.r?raw';
import templatePost from './templates/r-post.r?raw';

export default class RGenerator extends CodeGenerator {
  get language() {
    return 'r';
  }

  get outputFile() {
    return 'search.R';
  }

  get template() {
    if (!this.isCollectionSearch && !this.isCqlJsonFilter) {
      return templateItem;
    }
    return this.method === 'GET' ? templateGet : templatePost;
  }
  get isCqlJsonFilter() {
    return this.cleanedFilters?.['filter-lang'] === 'cql2-json';
  }


  get indent() {
    return 4;
  }

  get installDependencies() {
    return "Rscript -e \"install.packages('rstac')\"";
  }

  commaSeparatedStrings(values) {
    return values.map(v => JSON.stringify(v)).join(', ');
  }

  scopedCollections(filters) {
    if (Array.isArray(filters.collections) && filters.collections.length > 0) {
      return filters.collections;
    }
    try {
      const pathname = new URL(this.searchUrl).pathname;
      const match = pathname.match(/\/collections\/([^/]+)\/items\/?$/);
      if (match) {
        return [decodeURIComponent(match[1])];
      }
    }
    catch {
      // ignore malformed URLs
    }
    return [];
  }

  formatFilters(filters) {
    const props = [];

    const collections = this.scopedCollections(filters);
    if (collections.length > 0) {
      const collectionsValue = this.commaSeparatedStrings(collections);
      props.push(`collections = c(${collectionsValue})`);
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

    if (filters.Subject) {
      props.push(`Subject = ${JSON.stringify(filters.Subject)}`);
    }

    if (filters.subject) {
      props.push(`subject = ${JSON.stringify(filters.subject)}`);
    }

    if (props.length === 0) {
      return '';
    }

    const prefix = ' '.repeat(this.indent);
    return ',\n' + prefix + props.join(',\n' + prefix);
  }

  getVariables(filters) {
    return {
      ...super.getVariables(filters),
      FILTERS_OBJECT: this.formatJsonBody(filters),
      FILTER_ARGS: this.formatFilters(filters),
      EXT_FILTER: this.formatExtFilter(filters),
      REQUEST_FUNCTION: this.method === 'GET' ? 'get_request' : 'post_request'
    };
  }

  formatJsonBody(filters) {
    const serialized = JSON.stringify(filters)
      .replaceAll('\\', '\\\\')
      .replaceAll('"', '\\"');
    return `jsonlite::fromJSON("${serialized}", simplifyVector = FALSE)`;
  }

  formatExtFilter(filters) {
    if (typeof filters.filter === 'undefined') {
      return '';
    }

    let expr;
    if (filters['filter-lang'] === 'cql2-json') {
      const serialized = JSON.stringify(filters.filter)
        .replaceAll('\\', '\\\\')
        .replaceAll('"', '\\"');
      expr = `jsonlite::fromJSON("${serialized}", simplifyVector = FALSE)`;
    }
    else {
      expr = JSON.stringify(filters.filter);
    }

    const lang = filters['filter-lang'] ? `, lang = "${filters['filter-lang']}"` : '';
    return `query <- ext_filter(query, expr = ${expr}${lang})`;
  }
}
