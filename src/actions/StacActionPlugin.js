import ActionPlugin from './ActionPlugin';

export default class StacActionPlugin extends ActionPlugin {

  constructor(object, component, id) {
    super(id, component);
    this.object = object;
  }
}
