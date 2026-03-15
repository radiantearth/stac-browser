import CodeGenerator from './CodeGenerator.js';
import templateGet from './templates/java-get.java?raw';
import templatePost from './templates/java-post.java?raw';

export default class JavaGenerator extends CodeGenerator {
  get language() {
    return 'java';
  }

  get outputFile() {
    return 'StacSearch.java';
  }

  get template() {
    return this.method === 'GET' ? templateGet : templatePost;
  }

  getVariables(filters) {
    return {
      ...super.getVariables(filters),
      FILTERS_STRING: JSON.stringify(super.formatFilters(filters))
    };
  }
}
