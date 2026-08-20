import StacActionPlugin from "../StacActionPlugin";
import { URI } from 'stac-js/src/utils.js';
import BIconMap from '~icons/bi/map';

export default class StacMap extends StacActionPlugin {

  get show() {
    return this.object.isItem;
  }

  get uri() {
    return URI('https://developmentseed.org/stac-map/').addQuery('href', this.object.getAbsoluteUrl());
  }

  get icon() {
    return BIconMap;
  }

  get text() {
    return this.i18n.t('actions.openIn', {service: 'stac-map'});
  }
}
