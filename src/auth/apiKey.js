import Auth from "./index";
import i18n from '../i18n';

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
    return this._updateStore(value);
  }

}
