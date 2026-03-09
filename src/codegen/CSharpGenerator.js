import CodeGenerator from './CodeGenerator.js';
import templateItemGet from './templates/template.cs?raw';
import templateItemPostCql from './templates/template.csharp-item-post-cql.cs?raw';
import templateQuery from './templates/template.csharp-query.cs?raw';
import templatePostCql from './templates/template.csharp-post-cql.cs?raw';

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
      QUERY_STRING: this.toQueryParams(filters)
    };
  }
}
