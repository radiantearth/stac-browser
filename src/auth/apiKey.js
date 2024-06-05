import Auth from "./index";
import i18n from '../i18n';
import Utils from "../utils";

export default class ApiKey extends Auth {

  constructor(options, changeListener, router) {
    super(options, changeListener, router);
  }

  getButtonTitle() {
    return i18n.t('authentication.button.title');
  }

  getComponent() {
    return 'ApiKey';
  }

  getComponentProps() {
    return {
      description: this.options.description
    };
  }

  async logout(/*credentials*/) {
    if (this.router.currentRoute.name !== 'logout') {
      this.router.push('/auth/logout');
    }
    return true;
  }

  updateStore(value) {
    if (value) {
      if (this.options.formatter === 'Bearer') {
        value = `Bearer ${value}`;
      }
      else if (typeof this.options.formatter === 'function') {
        value = this.options.formatter(value);
      }
    }
    if (!Utils.hasText(value)) {
      value = undefined;
    }

    // Set query or request parameters
    let key = this.options.name;
    if (this.options.in === 'query') {
      return {
        query: { type: 'private', key, value }
      };
    }
    else if (this.options.in === 'header') {
      return {
        header: { key, value }
      };
    }
  }

}
