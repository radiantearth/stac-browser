import ActionPlugin from './ActionPlugin';

export default class LinkActionPlugin extends ActionPlugin {

  constructor(link, component, id) {
    super(id, component);
    this.link = link;
  }

  get btnOptions() {
    let obj = super.btnOptions;
    obj.rel = this.link.rel;
    return obj;
  }

}