import Vue from 'vue';
import VueI18n from 'vue-i18n';
import CONFIG from './config';
import { default as Fields } from '@radiantearth/stac-fields/I18N';
import Utils from './utils';

Vue.use(VueI18n);

export const API_LANGUAGE_CONFORMANCE = ['https://api.stacspec.org/v1.*/language'];

const LOCALE_CONFIG = {};

function loadLocaleConfig() {
  // Load locale config
  for (let locale of CONFIG.supportedLocales) {
    LOCALE_CONFIG[locale] = require(`./locales/${locale}/config.json`);
  }
  const messages = {};
  // Add language names all other languages
  for (let locale in LOCALE_CONFIG) {
    messages[locale] = {
      languages: LOCALE_CONFIG
    };
  }
  return messages;
}

const i18n = new VueI18n({
  locale: CONFIG.locale,
  fallbackLocale: CONFIG.fallbackLocale,
  messages: loadLocaleConfig(),
  // Todo: Workaround for https://github.com/kazupon/vue-i18n/issues/563
  postTranslation: (value, path) => {
    if (value === "") {
      const parts = path.split('.');
      let message = i18n.messages[CONFIG.fallbackLocale];
      for (const key of parts) {
        if (key in message) {
          message = message[key];
        }
        else {
          return value;
        }
      }
      return message;
    }
    return value;
  }
});
export default i18n;

export function loadDefaultMessages() {
  return Promise.all([
    loadMessages(CONFIG.locale),
    loadMessages(CONFIG.fallbackLocale)
  ]);
}

export async function loadMessages(locale) {
  // Check whether the language has already been loaded
  // Note that a languages key is already present thus check >1 and not >0
  if (Utils.size(i18n.messages[locale]) > 1) {
    return;
  }
  const messages = (await import(`./locales/${locale}/default.js`)).default;
  i18n.mergeLocaleMessage(locale, messages);
}

export async function executeCustomFunctions(locale) {
  const customizeFiles = LOCALE_CONFIG[locale].customize;
  if (Utils.size(LOCALE_CONFIG[locale].customize) === 0) {
    return;
  }
  const p = customizeFiles.map(async (file) => {
    const fn = (await import(`./locales/${locale}/${file}`)).default;
    return await fn(locale);
  });
  return Promise.all(p);
}

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
