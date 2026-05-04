import AssetActionPlugin from "../AssetActionPlugin";
import { URI } from 'stac-js/src/utils.js';
import i18n from "../../i18n";

const mediaType = [
  'application/vnd.apache.parquet', // Official
  'application/x-parquet' // Unofficial
];

export default class GeoParquetInfo extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && mediaType.includes(this.asset.type);
  }

  get uri() {
    const uri = URI("https://geoparquet.info");
    uri.query({url: this.component.href});
    return uri;
  }

  get text() {
    return i18n.global.t('actions.openIn', { service: 'geoparquet.info' });
  }

}
