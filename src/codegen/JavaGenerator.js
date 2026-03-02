import CodeGenerator from './CodeGenerator.js';
import template from './templates/java.template.js';

export default class JavaGenerator extends CodeGenerator {
  static get label() {
    return 'Java';
  }

  static get language() {
    return 'java';
  }

  static get outputFile() {
    return 'StacSearch.java';
  }

  generate() {
    return this.renderTemplate(template, {
      SEARCH_URL: this.catalogHref.replace(/\/?$/, '/search'),
      BODY_STRING: this.buildBodyString(),
    });
  }

  buildBodyString() {
    if (!this.hasFilters()) {
      return '"{}"';
    }
    const jsonStr = JSON.stringify(this.filters).replace(/"/g, '\\"');
    return `"${jsonStr}"`;
  }
}
