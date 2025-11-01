import URI from 'urijs';
import BIconBoxArrowUpRight from '~icons/bi/box-arrow-up-right';

export default class ActionPlugin {

  constructor(id, component) {
    this.id = id;
    this.component = component;
    this.i18n = component.$i18n;
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
    return this.i18n.t('open');
  }

}
