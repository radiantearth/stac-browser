import ActionPlugin from './ActionPlugin';

export default class ItemActionPlugin extends ActionPlugin {

  constructor(item, component, id) {
    super(id, component);
    this.item = item;
  }
}
