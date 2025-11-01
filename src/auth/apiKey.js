import Auth from "./index";

export default class ApiKey extends Auth {

  constructor(options, changeListener, router, i18n) {
    super(options, changeListener, router, i18n);
  }

  getButtonTitle() {
    return this.i18n.t('authentication.button.title');
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
