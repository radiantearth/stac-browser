import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import CodeGenerator from './CodeGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const template = readFileSync(join(__dirname, 'templates', 'csharp.cs'), 'utf-8');

export default class CSharpGenerator extends CodeGenerator {
  static get label() {
    return 'C#';
  }

  static get language() {
    return 'csharp';
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
