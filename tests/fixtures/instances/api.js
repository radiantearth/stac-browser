import Instance from './instance.js';

export default class API extends Instance {
  constructor(options) {
    super(options);
    this.root = this.addCatalog({template: 'api-root'});
  }

  static minimalApi() {
    return (new API())
      .addOpenApi();
  }

  static defaultApi() {
    return API.minimalApi()
      .addCollectionExtension()
      .addItemsExtension()
      .addSearchExtension();
  }

  static fullApi() {
    return API.defaultApi()
      .addCollectionSearchExtension();
  }
  
  addOpenApi({
    excludeServiceDesc = false
  }) {

    return this;
  }

  addCollectionExtension({

  }) {

    return this;
  }

  addItemsExtension({

  }) {

    return this;
  }

  addSearchExtension({

  }) {

    return this;
  }

  addCollectionSearchExtension({

  }) {

    return this;
  }

  createServer() {

  }
}
