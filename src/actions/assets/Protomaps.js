import AssetActionPlugin from "../AssetActionPlugin";
import { URI } from 'stac-js/src/utils.js';

// obj & ply files are usually with mime-type text/plain 
const PROTOMAPS_SUPPORTED_TYPES = [
  'application/vnd.pmtiles',
];

export default class Protomaps extends AssetActionPlugin {

  get show() {
    // Rather check if .pmtiles substring present in this.asset.href or simply this.component.filename.endsWith('pmtiles')
    return this.component.isBrowserProtocol && (
      PROTOMAPS_SUPPORTED_TYPES.includes(this.asset.type)
      ||  URI(this.asset.href).suffix() === 'pmtiles'
    );
  }

  get uri() {
    let uri = URI("https://pmtiles.io/");
    uri.addQuery("url", this.component.href); // returns the URI instance for chaining
    return uri;
  }

  get text() {
    return this.i18n.t('actions.openIn', {service: 'Protomaps'});
  }

}
