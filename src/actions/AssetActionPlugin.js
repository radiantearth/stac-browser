import ActionPlugin from './ActionPlugin';

export default class AssetActionPlugin extends ActionPlugin {

  constructor(asset, component, id) {
    super(id, component);
    this.asset = asset;
  }

}
