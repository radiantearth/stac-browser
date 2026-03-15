import CodeGenerator from './CodeGenerator.js';
import templateItem from './templates/rust-item-post.rs?raw';
import templateGet from './templates/rust-get.rs?raw';
import templatePost from './templates/rust-post.rs?raw';

export default class RustGenerator extends CodeGenerator {
  get language() {
    return 'rust';
  }

  get outputFile() {
    return 'main.rs';
  }

  get template() {
    if (!this.isCollectionSearch) {
      return templateItem;
    }
    return this.method === 'GET' ? templateGet : templatePost;
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
