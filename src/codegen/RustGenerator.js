import CodeGenerator from './CodeGenerator.js';
import template from './templates/template.rs?raw';

export default class RustGenerator extends CodeGenerator {
  get language() {
    return 'rust';
  }

  get outputFile() {
    return 'main.rs';
  }

  get template() {
    return template;
  }

  get indent() {
    return 4;
  }

  get installDependencies() {
    return 'cargo add serde_json stac stac-io && cargo add tokio@1 --features full';
  }

  formatFilters(filters) {
    const prefix = ' '.repeat(this.indent);
    return super.formatFilters(filters)
      .split('\n')
      .map((line, i) => i === 0 ? line : prefix + line)
      .join('\n');
  }
}
