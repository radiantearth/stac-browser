import LinkActionPlugin from "../LinkActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

export default class NASA_AMMOS_3DTiles extends LinkActionPlugin {

  get show() {
    return this.link.rel === '3d-tiles';
  }

  get uri() {
    let uri = new URI("https://nasa-ammos.github.io/3DTilesRendererJS/example/bundle/index.html");
    uri.hash(this.link.href);
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'NASA-AMMOS 3DTilesRendererJS'});
  }

}