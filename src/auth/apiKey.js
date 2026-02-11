import Auth from "./index";
import i18n from '../i18n';

export default class ApiKey extends Auth {

  constructor(router, options, changeListener) {
    super(router, options, changeListener);
  }

  getButtonTitle() {
  return i18n.global.t('authentication.button.title');
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
    if (this.router.currentRoute.value.name !== 'logout') {
      this.router.push('/auth/logout');
    }
    return true;
  }

  updateStore(value) {
    return this._updateStore(value);
  }

}
