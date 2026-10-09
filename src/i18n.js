import { createI18n } from 'vue-i18n';
import { default as Fields } from '@radiantearth/stac-fields/I18N';
import { isObject, size } from 'stac-js/src/utils.js';
import { getBest } from 'stac-js/src/locales';

// Cache for the static locale configs, shared across instances
const LOCALE_CONFIG = {};

async function loadLocaleConfig(config) {
  // Load locale config
  const missing = config.supportedLocales.filter(locale => !LOCALE_CONFIG[locale]);
  const loaded = await Promise.all(missing.map(async (locale) => [locale, await import(`./locales/${locale}/config.json`)]));
  for (const [locale, localeConfig] of loaded) {
    LOCALE_CONFIG[locale] = localeConfig;
  }
  const messages = {};
  // Add language names for all other languages
  for (let locale of config.supportedLocales) {
    messages[locale] = {
      languages: LOCALE_CONFIG
    };
  }
  return messages;
}

export async function loadMessages(i18n, locale) {
  // Check whether the language has already been loaded
  // Note that a languages key is already present thus check >1 and not >0
  if (size(i18n.getLocaleMessage(locale)) > 1) {
    return;
  }
  const messages = (await import(`./locales/${locale}/default.js`)).default;
  i18n.mergeLocaleMessage(locale, messages);
}

export default async function getI18n(config) {
  const messages = await loadLocaleConfig(config);

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

async function executeCustomFunctions(locale) {
  const customizeFiles = LOCALE_CONFIG[locale].customize;
  if (size(customizeFiles) === 0) {
    return;
  }
  const p = customizeFiles.map(async (file) => {
    const fn = (await import(`./locales/${locale}/${file}.js`)).default;
    return await fn(locale);
  });
  return await Promise.all(p);
}

export function translateFields(i18n, value, vars = null) {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }
  let key = `fields.${value}`;
  if (i18n.te(key)) {
    // Pass interpolation values (e.g. {0}) as the second argument. Passing them
    // as the third argument makes vue-i18n treat them as options and drops the
    // placeholders, resulting in incomplete texts (see #954).
    return vars ? i18n.t(key, vars) : i18n.t(key);
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
  return dataLanguages.filter(lang => isObject(lang) && typeof lang.code === 'string');
}

export function detectDataLanguage(data, locale, fallback) {
  // Locale for data
  const dataLanguages = getDataLanguages(data);
  const dataLanguageCodes = dataLanguages.map(l => l.code);
  const dataLanguageFallback = dataLanguages.length > 0 ? dataLanguages[0].code : fallback;
  return getBest(dataLanguageCodes, locale, dataLanguageFallback);
}

// Initializes and updates any external dependencies that also need to be localized, e.g. stac-fields.
export async function updateExternals(i18n, uiLanguage, fallbackLocale) {
  // Update stac-fields
  Fields.setLocales([uiLanguage, fallbackLocale]);
  Fields.setTranslator((value, vars) => translateFields(i18n, value, vars));

  // Execute other custom functions required to localize
  await executeCustomFunctions(uiLanguage);
}
