import ObjectActionPlugin from "../ObjectActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

export default class StacMap extends ObjectActionPlugin {

  get show() {
    return this.object.isItem();
  }

  get uri() {
    return new URI(`https://developmentseed.org/stac-map/?href=${this.object.getAbsoluteUrl()}`);
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'stac-map'});
  }
}
