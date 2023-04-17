import Auth from "./index";
import i18n from '../i18n';

export default class UserInput extends Auth {

  constructor(options, changeListener) {
    super(options, changeListener);
  }

  getType() {
    return 'user';
  }

  getComponent() {
    return () => import('../components/auth/UserInput.vue');
  }

  getButtonTitle() {
    return i18n.t('authentication.button.title');
  }

  async login() {
    return true;
  }

  async loginCallback() {
    return;
  }

  async logout() {
    return true;
  }

}