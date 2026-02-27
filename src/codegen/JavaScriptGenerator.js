import CodeGenerator from './CodeGenerator.js';
import template from './templates/javascript.template.js';

export default class JavaScriptGenerator extends CodeGenerator {
  static get label() {
    return 'JavaScript';
  }

  static get language() {
    return 'javascript';
  }

  generate() {
    return this.renderTemplate(template, {
      SEARCH_URL: this.catalogHref.replace(/\/?$/, '/search'),
      FILTERS_JSON: this.filtersJson(),
    });
  }
}
