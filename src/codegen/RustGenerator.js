import CodeGenerator from './CodeGenerator.js';
import nativeTemplate from './templates/rust.rs?raw';
import httpTemplate from './templates/rust-http.rs?raw';

export default class RustGenerator extends CodeGenerator {
  get language() {
    return 'rust';
  }

  get outputFile() {
    return 'main.rs';
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
    return 'cargo add serde_json stac stac-io reqwest && cargo add tokio@1 --features full';
  }

  get commentChars() {
    return '///';
  }

  getVariables(filters, cqlSerialized) {
    // For the native stac-rs path, provide only the search params it understands
    const searchParams = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'filters' || key === 'filter' || key === 'filter-lang') {
        continue;
      }
      if (value === null || value === undefined) {
        continue;
      }
      searchParams[key] = value;
    }
    return {
      ...super.getVariables(filters, cqlSerialized),
      SEARCH_PARAMS: this.formatJson(searchParams),
    };
  }

  formatJson(obj) {
    const prefix = ' '.repeat(this.indent);
    return JSON.stringify(obj, null, this.indent)
      .split('\n')
      .map((line, i) => i === 0 ? line : prefix + line)
      .join('\n');
  }

  formatFilters(filters) {
    return this.formatJson(this.getCleanFilters(filters));
  }

}
