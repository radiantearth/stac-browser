import Vue from 'vue';
import VueI18n from 'vue-i18n';
import CONFIG from './config';
import {default as Fields} from '@radiantearth/stac-fields/I18N';

Vue.use(VueI18n);

function loadLocaleMessages () {
  const messages = {};
  const languages = {};
  for(let locale of CONFIG.supportedLocales) {
    languages[locale] = require(`./locales/${locale}/config.json`);
    if (CONFIG.locale == locale || CONFIG.fallbackLocale == locale) {
      messages[locale] = require(`./locales/${locale}/texts.json`);
      messages[locale]['custom'] = require(`./locales/${locale}/custom.json`);
      if (locale !== "en") {
        messages[locale]['fields'] = require(`./locales/${locale}/fields.json`);
      }
    }
    else {
      messages[locale] = {};
    }
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

export function translateFields(value, vars = null) {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }
  let key = `fields.${value}`;
  if (i18n.te(key)) {
    return i18n.t(key, null, vars);
  }
  return Fields.format(value, vars);
}