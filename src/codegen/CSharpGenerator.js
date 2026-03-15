import CodeGenerator from './CodeGenerator.js';
import templateGet from './templates/csharp-get.cs?raw';
import templatePost from './templates/csharp-post.cs?raw';

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
    return this.method === 'GET' ? templateGet : templatePost;
  }
}
