import AssetActionPlugin from "../AssetActionPlugin";
import { geojsonMediaType } from "../../utils";
import URI from 'urijs';
import i18n from "../../i18n";

export default class GeoJsonIo extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && geojsonMediaType == this.asset.type;
  }

  get uri() {
    // Docs: https://github.com/mapbox/geojson.io/blob/main/API.md
    const uri = new URI("https://geojson.io");
    const encoded = encodeURIComponent(this.component.href);
    uri.fragment(`data=data:text/x-url,${encoded}`);
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'geojson.io'});
  }

}
