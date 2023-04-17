import Auth from "./index";
import i18n from '../i18n';
import Vue from 'vue';

export default class UserInput extends Auth {

  constructor(options, changeListener) {
    super(options, changeListener);
  }

  getType() {
    return 'user';
  }
  getButtonTitle() {
    return i18n.t('authentication.button.title');
  }

  login() {
    return new Promise(async (resolve, reject) => {
      let component = (await import('../components/auth/UserInput.vue')).default;
      console.log(component);

      var app = new Vue(component);

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

  async logout() {
    return await this.login();
  }

}