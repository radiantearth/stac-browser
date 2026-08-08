import CodeGenerator from './CodeGenerator.js';
import template from './templates/curl.sh?raw';

export default class CurlGenerator extends CodeGenerator {
  get language() {
    return 'curl';
  }

  get highlightLanguage() {
    return 'bash';
  }

  get outputFile() {
    return 'search.sh';
  }

  get template() {
    return template;
  }

  get indent() {
    return 2;
  }

}
