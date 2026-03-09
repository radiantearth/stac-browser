import CodeGenerator from './CodeGenerator.js';
import templateItemGet from './templates/template.rs?raw';
import templateItemPostCql from './templates/template.rust-item-post-cql.rs?raw';
import templateQuery from './templates/template.rust-query.rs?raw';
import templatePostCql from './templates/template.rust-post-cql.rs?raw';

export default class RustGenerator extends CodeGenerator {
  get language() {
    return 'rust';
  }

  get outputFile() {
    return 'main.rs';
  }

  get template() {
    if (this.isCollectionSearch) {
      return this.method === 'GET' ? templateQuery : templatePostCql;
    }
    return this.method === 'GET' ? templateItemGet : templateItemPostCql;
  }

  get indent() {
    return 4;
  }

  get installDependencies() {
    return 'cargo add serde_json stac stac-io reqwest && cargo add tokio@1 --features full';
  }

  formatFilters(filters) {
    const prefix = ' '.repeat(this.indent);
    return super.formatFilters(filters)
      .split('\n')
      .map((line, i) => i === 0 ? line : prefix + line)
      .join('\n');
  }

}
