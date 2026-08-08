import CodeGenerator from './CodeGenerator.js';
import template from './templates/go.go?raw';

export default class GoGenerator extends CodeGenerator {
  get language() {
    return 'go';
  }

  get outputFile() {
    return 'search.go';
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
