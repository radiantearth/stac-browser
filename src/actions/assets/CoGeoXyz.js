import AssetActionPlugin from "../AssetActionPlugin";
import { cogMediaTypes } from "../../utils";
import URI from 'urijs';
import i18n from "../../i18n";

export default class CoGeoXyz extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && cogMediaTypes.includes(this.asset.type);
  }

  get uri() {
    let uri = new URI("https://cogeo.xyz");
    uri.addQuery('url', this.component.href);
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'cogeo.xyz'});
  }

}