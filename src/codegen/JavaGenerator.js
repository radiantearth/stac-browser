import CodeGenerator from './CodeGenerator.js';
import template from './templates/template.java?raw';

export default class JavaGenerator extends CodeGenerator {
  get language() {
    return 'java';
  }

  get outputFile() {
    return 'StacSearch.java';
  }

  get template() {
    return template;
  }

  formatFilters(filters) {
    // Run JSON stringify twice to escape the string for embedding in Java code
    return JSON.stringify(super.formatFilters(filters));
  }
}
