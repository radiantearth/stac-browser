import CodeGenerator from './CodeGenerator.js';
import templateGet from './templates/javascript-get.js?raw';
import templatePost from './templates/javascript-post.js?raw';

export default class JavaScriptGenerator extends CodeGenerator {
  get language() {
    return 'javascript';
  }

  get outputFile() {
    return 'search.mjs';
  }

  get template() {
    return this.method === 'GET' ? templateGet : templatePost;
  }

  get indent() {
    return 2;
  }

}
