import CodeGenerator from './CodeGenerator.js';
import template from './templates/javascript.js?raw';

export default class JavaScriptGenerator extends CodeGenerator {
  get language() {
    return 'javascript';
  }

  get outputFile() {
    return 'search.mjs';
  }

  get template() {
    return template;
  }

  get indent() {
    return 2;
  }

  get commentChars() {
    return '///';
  }

}
