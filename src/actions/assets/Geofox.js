import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

// See mime types discussion for 3d-tiles here and there
// https://github.com/opengeospatial/ogcapi-3d-geovolumes/issues/13
const OGC3DTILES_SUPPORTED_TYPES = [
  // 'application/json',
  'application/3dtiles+json',
];

export default class Geofox extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && OGC3DTILES_SUPPORTED_TYPES.includes(this.asset.type);
  }

  get uri() {
    let uri = new URI("https://viewer.geofox.ai/");
    uri.addQuery('tileset', this.component.href);
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'Geofox.ai'});
  }

}