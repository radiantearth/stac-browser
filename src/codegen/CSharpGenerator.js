import CodeGenerator from './CodeGenerator.js';
import templateItemGet from './templates/csharp-item-get.cs?raw';
import templateItemPost from './templates/csharp-item-post.cs?raw';
import templateCollectionGet from './templates/csharp-collection-get.cs?raw';
import templateCollectionPost from './templates/csharp-collection-post.cs?raw';

export default class CSharpGenerator extends CodeGenerator {
  get language() {
    return 'csharp';
  }

  get outputFile() {
    return 'Program.cs';
  }

  get indent() {
    return 4;
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
      QUERY_STRING: this.toQueryParams(filters)
    };
  }
}
