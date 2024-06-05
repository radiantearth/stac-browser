import Auth from "./index";
import i18n from '../i18n';
import Utils from "../utils";

export default class BasicAuth extends Auth {

  constructor(options, changeListener, router) {
    super(options, changeListener, router);
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
    return i18n.t('authentication.button.title');
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
