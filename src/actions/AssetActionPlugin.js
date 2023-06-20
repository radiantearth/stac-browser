import ActionPlugin from './ActionPlugin';

export default class AssetActionPlugin extends ActionPlugin {

  constructor(asset, component, id) {
    super(id);
    this.asset = asset;
    this.component = component;
  }

}
