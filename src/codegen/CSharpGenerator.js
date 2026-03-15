import CodeGenerator from './CodeGenerator.js';
import template from './templates/csharp.cs?raw';

export default class CSharpGenerator extends CodeGenerator {
  get language() {
    return 'csharp';
  }

  get outputFile() {
    return 'Program.cs';
  }

  get indent() {
    return 4;
  }

  get template() {
    return template;
  }

  get commentChars() {
    return '///';
  }
}
