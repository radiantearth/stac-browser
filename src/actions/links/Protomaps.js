import LinkActionPlugin from "../LinkActionPlugin";
import { URI } from 'stac-js/src/utils.js';

export default class Protomaps extends LinkActionPlugin {

  get show() {
    return this.link.rel === 'pmtiles'; 
    // could also check if this.link.type === "application/vnd.pmtiles" 
  }

  get uri() {
    let uri = URI("https://pmtiles.io/");
    uri.addQuery("url", this.link.href); 
    return uri;
  }

  get text() {
    return this.i18n.t('actions.openIn', {service: 'Protomaps'});
  }

}
