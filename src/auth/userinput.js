import Auth from "./index";
import i18n from '../i18n';
import Vue from 'vue';

export default class UserInput extends Auth {

  constructor(options, changeListener, description = null) {
    super(options, changeListener);
    this.description = description;
  }

  getType() {
    return 'user';
  }
  getButtonTitle() {
    return i18n.t('authentication.button.title');
  }

  async login(credentials = null) {
    return new Promise(async (resolve, reject) => {
      let component = (await import('../components/auth/UserInput.vue')).default;
      let app = new Vue({
        ...component,
        propsData: {
          description: this.description,
          credentials
        }
      });

      let div = document.createElement('div');
      div.id = "uiAuth";
      let container = document.getElementsByTagName('body')[0];
      container.appendChild(div);
      app.$mount('#uiAuth');

      app.$on('reset', () => {
        container.removeChild(app.$el);
        reject();
      });
      app.$on('submit', token => {
        container.removeChild(app.$el);
        resolve(token);
      });
    });
  }

  async logout(credentials) {
    return await this.login(credentials);
  }

}