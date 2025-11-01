import LinkActionPlugin from "../LinkActionPlugin";
import URI from 'urijs';

export default class Protomaps extends LinkActionPlugin {

  get show() {
    return this.link.rel === 'pmtiles'; 
    // could also check if this.link.type === "application/vnd.pmtiles" 
  }

  get uri() {
    let uri = new URI("https://pmtiles.io/");
    uri.addQuery("url", this.link.href); 
    return uri;
  }

  get text() {
    return this.i18n.t('actions.openIn', {service: 'Protomaps'});
  }

}
