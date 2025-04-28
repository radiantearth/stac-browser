import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

export default class CopcViewer extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && (
      this.asset.type === 'application/vnd.laszip+copc'
      ||  URI(this.asset.href).filename() == 'ept.json'
    );
  }

  get uri() {
    let uri = new URI("https://viewer.copc.io");
    uri.addQuery('copc', this.component.href);
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'copc.io'});
  }

}