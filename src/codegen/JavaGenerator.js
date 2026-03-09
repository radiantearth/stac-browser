import CodeGenerator from './CodeGenerator.js';
import templateItemGet from './templates/template.java?raw';
import templateItemPostCql from './templates/template.java-item-post-cql.java?raw';
import templateQuery from './templates/template.java-query.java?raw';
import templatePostCql from './templates/template.java-post-cql.java?raw';

export default class JavaGenerator extends CodeGenerator {
  get language() {
    return 'java';
  }

  get outputFile() {
    return 'StacSearch.java';
  }

  get template() {
    if (this.isCollectionSearch) {
      return this.method === 'GET' ? templateQuery : templatePostCql;
    }
    return this.method === 'GET' ? templateItemGet : templateItemPostCql;
  }

  get installDependencies() {
    return null;
  }

  toQueryParams(filters) {
    const params = [];
    for (const [key, rawValue] of Object.entries(filters)) {
      let value = rawValue;
      if (Array.isArray(value)) {
        value = value.join(',');
      }
      else if (value && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
    return params.join('&');
  }

  getVariables(filters) {
    return {
      ...super.getVariables(filters),
      QUERY_STRING: this.toQueryParams(filters),
      FILTERS_STRING: JSON.stringify(super.formatFilters(filters))
    };
  }
}
