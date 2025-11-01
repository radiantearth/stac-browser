import Auth from "./index";
import Utils from "../utils";

export default class BasicAuth extends Auth {

  constructor(options, changeListener, router, i18n) {
    super(options, changeListener, router, i18n);
  }

  getComponent() {
    return 'Basic';
  }

  getComponentProps() {
    return {
      description: this.options.description
    };
  }

  getButtonTitle() {
    return this.i18n.t('authentication.button.title');
  }

  async logout(/*credentials*/) {
    if (this.router.currentRoute.name !== 'logout') {
      this.router.push('/auth/logout');
    }
    return true;
  }

  updateStore(value) {
    if (typeof value === 'string' && value.length >= 3) {
      value = `Basic ${btoa(value)}`;
    }
    if (!Utils.hasText(value)) {
      value = undefined;
    }
    return {
      header: { key: 'Authorization', value }
    };
  }

}
