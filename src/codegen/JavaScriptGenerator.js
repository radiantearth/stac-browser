import CodeGenerator from './CodeGenerator.js';
import templateItemGet from './templates/javascript-item-get.js?raw';
import templateItemPost from './templates/javascript-item-post.js?raw';
import templateCollectionGet from './templates/javascript-collection-get.js?raw';
import templateCollectionPost from './templates/javascript-collection-post.js?raw';

export default class JavaScriptGenerator extends CodeGenerator {
  get language() {
    return 'javascript';
  }

  get outputFile() {
    return 'search.mjs';
  }

  get template() {
    if (this.isCollectionSearch) {
      return this.method === 'GET' ? templateCollectionGet : templateCollectionPost;
    }
    return this.method === 'GET' ? templateItemGet : templateItemPost;
  }

  get indent() {
    return 2;
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
