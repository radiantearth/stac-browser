import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';

// See mime types discussion for 3d-tiles here and there
// https://github.com/opengeospatial/ogcapi-3d-geovolumes/issues/13
const OGC3DTILES_SUPPORTED_TYPES = [
  // 'application/json',
  'application/3dtiles+json',
];

export default class NASA_AMMOS_3DTiles extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && OGC3DTILES_SUPPORTED_TYPES.includes(this.asset.type);
  }

  get uri() {
    let uri = new URI("https://nasa-ammos.github.io/3DTilesRendererJS/example/bundle/index.html");
    uri.hash(this.link.href);
    return uri;
  }

  get text() {
    return this.i18n.t('actions.openIn', {service: 'NASA-AMMOS 3DTilesRendererJS'});
  }

}
