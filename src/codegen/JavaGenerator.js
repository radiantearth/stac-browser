import CodeGenerator from './CodeGenerator.js';
import template from './templates/java.java?raw';

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

  get indent() {
    return 4;
  }

  get installDependencies() {
    // todo: curl works on Unix but not Windows, so we may want to provide an alternative command for Windows users in the future
    return 'curl -sLO https://repo1.maven.org/maven2/com/google/code/gson/gson/2.13.2/gson-2.13.2.jar # Linux/MacOS only';
  }

  get commentChars() {
    return '///';
  }

}
