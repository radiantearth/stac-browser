import ActionPlugin from './ActionPlugin';

export default class ObjectActionPlugin extends ActionPlugin {

  constructor(object, component, id) {
    super(id, component);
    this.object = object;
  }
}
