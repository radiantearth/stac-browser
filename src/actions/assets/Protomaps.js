import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

// obj & ply files are usually with mime-type text/plain 
const PROTOMAPS_SUPPORTED_TYPES = [
  'application/vnd.pmtiles',
];

export default class Protomaps extends AssetActionPlugin {

  get show() {
    // Rather check if .pmtiles substring present in this.asset.href or simply this.component.filename.endsWith('pmtiles')
    return this.component.isBrowserProtocol && (
      PROTOMAPS_SUPPORTED_TYPES.includes(this.asset.type)
      ||  URI(this.asset.href).suffix() == 'pmtiles'
    );
  }

  get uri() {
    let uri = new URI("https://pmtiles.io/");
    uri.addQuery("url", this.component.href); // returns the URI instance for chaining
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'Protomaps'});
  }

}