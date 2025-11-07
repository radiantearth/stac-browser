import ItemActionPlugin from "../ItemActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

export default class StacMap extends ItemActionPlugin {

  get show() {
    return true;
  }

  get uri() {
    return new URI(`https://developmentseed.org/stac-map/?href=${this.item.getAbsoluteUrl()}`);
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'stac-map'});
  }
}
