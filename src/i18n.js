import { createI18n } from 'vue-i18n';
import { default as Fields } from '@radiantearth/stac-fields/I18N';
import Utils from './utils';

export default async function getI18n(config) {
  // Load the basic config for all supported locales
  const localeConfigs = {};
  for (let locale of config.supportedLocales) {
    // todo: does this work? see console warnings
    localeConfigs[locale] = await import(`./locales/${locale}/config.json`);
  }
  const messages = {};
  // Add language names for all other languages
  for (let locale in localeConfigs) {
    messages[locale] = {
      languages: localeConfigs
    };
  }

  const i18n = createI18n({
    legacy: true,
    globalInjection: true,
    locale: config.locale,
    fallbackLocale: config.fallbackLocale,
    messages,
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
        // Access messages in a mode-agnostic way
        let message = i18n.global.getLocaleMessage(config.fallbackLocale);
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

  await Promise.all([
    loadMessages(i18n.global, config.locale),
    loadMessages(i18n.global, config.fallbackLocale)
  ]);

  return i18n;
}

export async function loadMessages(i18n, locale) {
  // Check whether the language has already been loaded
  // Note that a languages key is already present thus check >1 and not >0
  if (Utils.size(i18n.getLocaleMessage(locale)) > 1) {
    return;
  }
  const messages = (await import(`./locales/${locale}/default.js`)).default;
  i18n.mergeLocaleMessage(locale, messages);
}

export async function executeCustomFunctions(i18n, locale) {
  const customizeFiles = i18n.messages[locale].languages[locale].customize;
  // todo: check that this works
  if (Utils.size(customizeFiles) === 0) {
    return;
  }
  const p = customizeFiles.map(async (file) => {
    const fn = (await import(`./locales/${locale}/${file}.js`)).default;
    return await fn(locale);
  });
  return Promise.all(p);
}

export function translateFields(i18n, value, vars = null) {
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
  // todo: move this function to stac-js
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
