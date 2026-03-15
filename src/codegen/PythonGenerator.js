import CodeGenerator from './CodeGenerator.js';
import template from './templates/python.py?raw';

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

  formatFilters(filters) {
    return this.getFiltersAsJson(filters);
  }

  getVariables(filters) {
    return {
      ...super.getVariables(filters),
      SEARCH_FUNCTION: this.isCollectionSearch ? 'collection_search' : 'search',
      SEARCH_ARGS: this.formatPystacSearchArgs(filters)
    };
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

  formatPystacSearchArgs(filters) {
    const args = [];

    if (!this.isCollectionSearch) {
      const collections = this.scopedCollections(filters);
      if (collections.length > 0) {
        const collectionsValue = this.commaSeparatedStrings(collections);
        args.push(`collections=[${collectionsValue}]`);
      }

      if (Array.isArray(filters.ids) && filters.ids.length > 0) {
        const ids = this.commaSeparatedStrings(filters.ids);
        args.push(`ids=[${ids}]`);
      }
    }

    if (Array.isArray(filters.bbox) && filters.bbox.length > 0) {
      args.push(`bbox=[${filters.bbox.join(', ')}]`);
    }

    if (filters.datetime) {
      args.push(`datetime=${JSON.stringify(filters.datetime)}`);
    }

    if (Array.isArray(filters.q) && filters.q.length > 0) {
      const terms = this.commaSeparatedStrings(filters.q);
      args.push(`q=[${terms}]`);
    }

    if (typeof filters.limit === 'number') {
      args.push(`max_items=${filters.limit}`);
    }

    if (filters.sortby) {
      args.push(`sortby=${JSON.stringify(filters.sortby)}`);
    }

    if (typeof filters.filter !== 'undefined') {
      args.push(`filter=${JSON.stringify(filters.filter)}`);
    }

    if (filters['filter-lang']) {
      args.push(`filter_lang=${JSON.stringify(filters['filter-lang'])}`);
    }

    if (this.method !== 'POST') {
      args.push(`method=${JSON.stringify(this.method)}`);
    }

    return args.join(', ');
  }

}
