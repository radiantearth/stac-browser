import Vue from 'vue';
import VueI18n from 'vue-i18n';
import CONFIG from './config';
import { default as Fields } from '@radiantearth/stac-fields/I18N';
import Utils from './utils';

Vue.use(VueI18n);

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

const i18n = new VueI18n({
  locale: CONFIG.locale,
  fallbackLocale: CONFIG.fallbackLocale,
  messages: loadLocaleConfig(),
  // Suppress fallback warnings - these are expected when translations are incomplete
  silentFallbackWarn: true,
  // We do not expose/import the phrases from the fields.json in the 'en' locale
  // because it's a 1:1 mapping, i.e. key == value, and we want to save some
  // initial loading time. We prepend a 'fields.' prefix though, so we need to
  // remove the prefix here from the key.
  missing: (locale, key) => {
    if (key.startsWith('fields.') && locale.startsWith('en')) {
      return key.slice(7);
    }
    return key;
  },
  // This is handling cases where there are missing empty phrases coming in from
  // CrowdIn. It should be captured by our CI Action that removes empty phrases
  // from the JSON, but in case this gets forgotten, we have this fallback to avoid
  // showing empty texts in the UI.
  // See https://github.com/kazupon/vue-i18n/issues/563 for details.
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
