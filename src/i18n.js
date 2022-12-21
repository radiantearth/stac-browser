import Vue from 'vue';
import VueI18n from 'vue-i18n';
import CONFIG from './config';

Vue.use(VueI18n);

function loadLocaleMessages () {
  const messages = {};
  const languages = {};
  for(let locale of CONFIG.supportedLocales) {
    languages[locale] = require(`./locales/${locale}/config.json`);
    // ToDo: Load not yet required languages async
    // https://kazupon.github.io/vue-i18n/guide/lazy-loading.html
    messages[locale] = require(`./locales/${locale}/texts.json`);
  }
  for(let locale in messages) {
    messages[locale].languages = languages;
  }
  return messages;
}

const i18n = new VueI18n({
  locale: CONFIG.locale,
  fallbackLocale: CONFIG.fallbackLocale,
  messages: loadLocaleMessages()
});

export default i18n;
