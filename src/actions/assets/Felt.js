import { geojsonMediaType, geotiffMediaTypes } from "../../utils";
import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';

// For more options see https://feltmaps.notion.site/Upload-Anything-b26d739e80184127872faa923b55d232
const FELT_SUPPORTED_TYPES = geotiffMediaTypes.concat([
  geojsonMediaType,
  'application/vnd.google-earth.kml+xml',
  'application/vnd.google-earth.kmz',
]);

export default class Felt extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && FELT_SUPPORTED_TYPES.includes(this.asset.type);
  }

  get uri() {
    // Docs: https://feltmaps.notion.site/Open-in-Felt-Button-22765a3427ff45e0a70218dca3f8acc0
    let uri = new URI("https://felt.com/map/new");
    uri.addQuery('layer_urls[]', this.component.href);
    // once we migrate to stac-js:
    // todo: add title from STAC entity
    // todo: add lat/lon from item/collection: lat=57.14926&lon=-2.09348
    return uri;
  }

  get text() {
    return this.i18n.t('actions.openIn', {service: 'Felt'});
  }

}
