import CodeGenerator from './CodeGenerator.js';
import nativeTemplate from './templates/r.r?raw';
import httpTemplate from './templates/r-http.r?raw';

export default class RGenerator extends CodeGenerator {
  get language() {
    return 'r';
  }

  get outputFile() {
    return 'search.R';
  }

  get template() {
    return nativeTemplate;
  }

  getTemplate(filters, cqlSerialized) {
    if (this.isCollectionSearch || cqlSerialized) {
      return httpTemplate;
    }
    return nativeTemplate;
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

  formatRstacArgs(filters) {
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

    if (filters.limit) {
      props.push(`limit = ${filters.limit}`);
    }

    if (props.length === 0) {
      return '';
    }

    const prefix = ' '.repeat(this.indent);
    return ',\n' + prefix + props.join(',\n' + prefix);
  }

  getVariables(filters, cqlSerialized) {
    const bodyObj = this.getCleanFilters(filters);
    if (cqlSerialized) {
      Object.assign(bodyObj, cqlSerialized);
    }
    return {
      ...super.getVariables(filters, cqlSerialized),
      FILTERS_OBJECT: this.formatJsonBody(bodyObj),
      FILTER_ARGS: this.formatRstacArgs(filters),
      EXT_FILTER: this.formatExtFilter(cqlSerialized),
      REQUEST_FUNCTION: this.method === 'GET' ? 'get_request' : 'post_request'
    };
  }

  formatJsonBody(filters) {
    const serialized = JSON.stringify(filters)
      .replaceAll('\\', '\\\\')
      .replaceAll('"', '\\"');
    return `jsonlite::fromJSON("${serialized}", simplifyVector = FALSE)`;
  }

  formatExtFilter(cqlSerialized) {
    if (!cqlSerialized?.filter) {
      return '';
    }

    let expr;
    if (cqlSerialized['filter-lang'] === 'cql2-json') {
      const serialized = JSON.stringify(cqlSerialized.filter)
        .replaceAll('\\', '\\\\')
        .replaceAll('"', '\\"');
      expr = `jsonlite::fromJSON("${serialized}", simplifyVector = FALSE)`;
    }
    else {
      expr = JSON.stringify(cqlSerialized.filter);
    }

    const lang = cqlSerialized['filter-lang'] ? `, lang = "${cqlSerialized['filter-lang']}"` : '';
    return `query <- ext_filter(query, expr = ${expr}${lang})`;
  }
}
