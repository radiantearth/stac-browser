import { createI18n } from 'vue-i18n';
import CONFIG from './config';
import { default as Fields } from '@radiantearth/stac-fields/I18N';
import Utils from './utils';

export const API_LANGUAGE_CONFORMANCE = ['https://api.stacspec.org/v1.*/language'];
export const STAC_LANGUAGE_EXT = 'https://stac-extensions.github.io/language/v1.*/schema.json';

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

const i18n = createI18n({
  legacy: true,
  globalInjection: true,
  locale: CONFIG.locale,
  fallbackLocale: CONFIG.fallbackLocale,
  messages: loadLocaleConfig(),
  // Workaround for https://github.com/kazupon/vue-i18n/issues/563
  postTranslation: (value, path) => {
    if (value === "") {
      const parts = path.split('.');
      // Access messages in a mode-agnostic way
      let message = i18n.global.getLocaleMessage(CONFIG.fallbackLocale);
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
  if (Utils.size(i18n.global.getLocaleMessage(locale)) > 1) {
    return;
  }
  const messages = (await import(`./locales/${locale}/default.js`)).default;
  i18n.global.mergeLocaleMessage(locale, messages);
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
  if (i18n.global.te(key)) {
    return i18n.global.t(key, null, vars);
  }
  return Fields.format(value, vars);
}

/**
 * Get the languages available for the given STAC entity.
 * 
 * @param {STAC} data The STAC entity.
 * @returns {Array.<object>} An array of language objects, each with a `code` property.
 */
export function getDataLanguages(data) {
    let dataLanguages = [];
    if (data) {
      const languages = data.getMetadata('languages');
      // Ensure the other languages are always an array
      if (Array.isArray(languages) && languages.length > 0) {
        dataLanguages = languages.slice();
      }
      // Add the current language of the data to the list of languages
      // No need to check the language as checks will be done in the filter below
      dataLanguages.unshift(data.getMetadata('language'));
    }
    // Filter out invalid languages
    return dataLanguages.filter(lang => Utils.isObject(lang) && typeof lang.code === 'string');
}
