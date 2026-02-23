import { URI } from 'stac-js/src/utils.js';
import i18n from "../i18n";
import BIconBoxArrowUpRight from '~icons/bi/box-arrow-up-right';

export default class ActionPlugin {

  constructor(id, component) {
    this.id = id;
    this.component = component;
  }

  get btnOptions() {
    let href;
    if (this.uri instanceof URI) {
      href = this.uri.toString();
    }
    else if (typeof this.uri === 'string') {
      href = this.uri;
    }
    if (href) {
      return {
        href,
        target: '_blank'
      };
    }
    return {};
  }

  get onClick() {
    return () => {};
  }

  get uri() {
    return null;
  }

  get show() {
    return false;
  }

  get icon() {
    return BIconBoxArrowUpRight;
  }

  get text() {
  return i18n.global.t('open');
  }

}
