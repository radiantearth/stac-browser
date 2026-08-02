import LinkActionPlugin from "../LinkActionPlugin";
import { URI } from 'stac-js/src/utils.js';
import i18n from "../../i18n";

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
    return i18n.global.t('actions.openIn', {service: 'Protomaps'});
  }

}
