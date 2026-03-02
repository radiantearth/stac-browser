import CodeGenerator from './CodeGenerator.js';
import template from './templates/csharp.template.js';

export default class CSharpGenerator extends CodeGenerator {
  static get label() {
    return 'C#';
  }

  static get language() {
    return 'csharp';
  }

  static get outputFile() {
    return 'Program.cs';
  }

  generate() {
    return this.renderTemplate(template, {
      SEARCH_URL: this.catalogHref.replace(/\/?$/, '/search'),
      FILTERS_JSON_INDENTED: this.buildIndentedJson(),
    });
  }

  buildIndentedJson() {
    return JSON.stringify(this.filters, null, 4)
      .split('\n')
      .map(line => `    ${line}`)
      .join('\n');
  }
}
