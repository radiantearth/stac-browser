import CodeGenerator from './CodeGenerator.js';
import templateItemGet from './templates/rust-item-get.rs?raw';
import templateItemPost from './templates/rust-item-post.rs?raw';
import templateCollectionGet from './templates/rust-collection-get.rs?raw';
import templateCollectionPost from './templates/rust-collection-post.rs?raw';

export default class RustGenerator extends CodeGenerator {
  get language() {
    return 'rust';
  }

  get outputFile() {
    return 'main.rs';
  }

  get template() {
    if (this.isCollectionSearch) {
      return this.method === 'GET' ? templateCollectionGet : templateCollectionPost;
    }
    return this.method === 'GET' ? templateItemGet : templateItemPost;
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
