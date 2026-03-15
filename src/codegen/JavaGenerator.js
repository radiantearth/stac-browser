import CodeGenerator from './CodeGenerator.js';
import templateItemGet from './templates/java-item-get.java?raw';
import templateItemPost from './templates/java-item-post.java?raw';
import templateCollectionGet from './templates/java-collection-get.java?raw';
import templateCollectionPost from './templates/java-collection-post.java?raw';

export default class JavaGenerator extends CodeGenerator {
  get language() {
    return 'java';
  }

  get outputFile() {
    return 'StacSearch.java';
  }

  get template() {
    if (this.isCollectionSearch) {
      return this.method === 'GET' ? templateCollectionGet : templateCollectionPost;
    }
    return this.method === 'GET' ? templateItemGet : templateItemPost;
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
