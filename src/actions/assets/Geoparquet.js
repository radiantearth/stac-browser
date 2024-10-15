import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

const GEOPARQUET_SUPPORTED_TYPES = [
  'application/vnd.apache.parquet',
  'application/x-parquet' 
];

export default class Geoparquet extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && GEOPARQUET_SUPPORTED_TYPES.includes(this.asset.type);
  }

  get uri() {
    let uri = new URI("https://geoparquet.info");
    uri.addQuery('url', this.component.href);
    return uri;
  }


  get text() {
    return i18n.t('actions.openIn', {service: 'Geoparquet.info'});
  }

}