import CodeGenerator from './CodeGenerator.js';
import templateItemGet from './templates/template.js?raw';
import templateItemPostCql from './templates/template.javascript-item-post-cql.js?raw';
import templateQuery from './templates/template.javascript-query.js?raw';
import templatePostCql from './templates/template.javascript-post-cql.js?raw';

export default class JavaScriptGenerator extends CodeGenerator {
  get language() {
    return 'javascript';
  }

  get outputFile() {
    return 'search.mjs';
  }

  get template() {
    if (this.isCollectionSearch) {
      return this.method === 'GET' ? templateQuery : templatePostCql;
    }
    return this.method === 'GET' ? templateItemGet : templateItemPostCql;
  }

  get indent() {
    return 2;
  }

  get installDependencies() {
    return null;
  }

  formatFilters(filters) {
    if (this.method !== 'GET') {
      return super.formatFilters(filters);
    }

    const query = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'bbox' && Array.isArray(value)) {
        query[key] = value.join(',');
      }
      else if (['collections', 'ids', 'q'].includes(key) && Array.isArray(value)) {
        query[key] = value.join(',');
      }
      else {
        query[key] = value;
      }
    }
    return this.getFiltersAsJson(query);
  }

}
