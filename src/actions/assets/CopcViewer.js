import AssetActionPlugin from "../AssetActionPlugin";
import { URI } from 'stac-js/src/utils.js';

export default class CopcViewer extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && (
      this.asset.type === 'application/vnd.laszip+copc'
      ||  URI(this.asset.href).filename() === 'ept.json'
    );
  }

  get uri() {
    let uri = URI("https://viewer.copc.io");
    uri.addQuery('copc', this.component.href);
    return uri;
  }

  get text() {
    return this.i18n.t('actions.openIn', {service: 'copc.io'});
  }

}
