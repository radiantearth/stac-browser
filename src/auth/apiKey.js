import Auth from "./index";

export default class ApiKey extends Auth {

  constructor(router, i18n, options, changeListener) {
    super(router, i18n, options, changeListener);
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
    if (this.router.currentRoute.value.name !== 'logout') {
      this.router.push('/auth/logout');
    }
    return true;
  }

  updateStore(value) {
    return this._updateStore(value);
  }

}
