import StacActionPlugin from "../StacActionPlugin";
import { URI } from 'stac-js/src/utils.js';
import i18n from "../../i18n";

export default class StacMap extends StacActionPlugin {

  get show() {
    return this.object.isItem;
  }

  get uri() {
    return URI('https://developmentseed.org/stac-map/').addQuery('href', this.object.getAbsoluteUrl());
  }

  get text() {
    return i18n.global.t('actions.openIn', {service: 'stac-map'});
  }

}
