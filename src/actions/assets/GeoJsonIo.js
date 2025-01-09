import AssetActionPlugin from "../AssetActionPlugin";
import { geojsonMediaType } from "../../utils";
import URI from 'urijs';
import i18n from "../../i18n";

export default class GeoJsonIo extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && geojsonMediaType == this.asset.type;
  }

  get uri() {
    // Docs: https://github.com/Cenergy/geojson.io/blob/main/API.md
    let uri = new URI("https://geojson.io");
    uri.addQuery('data', `text/x-url,${this.component.href}`);
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'geojson.io'});
  }

}