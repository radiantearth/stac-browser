import LinkActionPlugin from "../LinkActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

export default class Geofox extends LinkActionPlugin {

  get show() {
    return this.link.rel === '3d-tiles';
  }

  get uri() {
    let uri = new URI("https://viewer.geofox.ai/");
    uri.addQuery('tileset', this.link.href);
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'Geofox.ai'});
  }

}