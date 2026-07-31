import axios from 'axios';
import validateSTAC from 'stac-node-validator';
import BaseValidator from 'stac-node-validator/src/baseValidator.js';
import { isObject, URI } from 'stac-js/src/utils.js';

export const SCHEMA_VERSION_REGEXP = /\/(v?\d+\.\d+[^/]+)(\/|$)/;

// Cache the schema requests across validation runs
const schemaRequests = new Map();

async function cachedLoader(uri) {
  let request = schemaRequests.get(uri);
  if (!request) {
    request = axios.get(uri).then(response => response.data);
    // Evict failed requests from the cache so that they can be retried later
    request.catch(() => schemaRequests.delete(uri));
    schemaRequests.set(uri, request);
  }
  return await request;
}

// Reuse a single ajv instance across validation runs so that schemas are compiled only once
class CachingValidator extends BaseValidator {
  createAjv(ajv) {
    if (!this._ajv) {
      this._ajv = ajv;
    }
    return this._ajv;
  }
}

const validationConfig = {
  loader: cachedLoader,
  customValidator: new CachingValidator()
};

/**
 * Validates a STAC entity (plain JSON) against the STAC core and extension schemas.
 *
 * Schemas and compiled validators are cached across calls.
 *
 * @param {Object} data The STAC entity as plain JSON
 * @returns {Promise<Object>} The stac-node-validator report
 */
export async function validateStac(data) {
  return await validateSTAC(data, validationConfig);
}

/**
 * Loads the ajv-i18n localization function for the given UI language.
 *
 * @param {string} locale The UI language
 * @returns {Promise<Function|null>} The localization function for ajv errors
 */
export async function loadValidationLocale(locale) {
  if (!locale) {
    return null;
  }
  const i18nFn = (await import(`./locales/${locale}/validation.js`)).default;
  if (i18nFn instanceof Promise) {
    return (await i18nFn).default;
  }
  return i18nFn;
}

/**
 * Localizes ajv error messages with the given ajv-i18n function.
 *
 * @param {Array.<Object>} errors The ajv errors
 * @param {Function|null} localeFn The ajv-i18n localization function
 * @returns {Array.<Object>} The errors with localized messages
 */
export function localizeErrors(errors, localeFn) {
  if (typeof localeFn !== 'function') {
    return errors;
  }
  // Make a copy of the errors as the ajv-i18n package mutates the error objects
  const localized = errors.map(error => Object.assign({}, error));
  localeFn(localized);
  // ajv-i18n overrides error messages from stac-node-validator that do not originate from ajv.
  // Reset to the original message in those cases.
  return localized.map((error, i) => {
    if (typeof error.keyword === 'undefined') {
      return errors[i];
    }
    return error;
  });
}

/**
 * Creates a human-readable message for an ajv error, including its parameters.
 *
 * @param {Object} error The ajv error
 * @param {Function} t The i18n translate function
 * @param {Function} te The i18n key-exists function
 * @returns {string} The formatted message (without instancePath/schemaPath)
 */
export function formatAjvMessage(error, t, te) {
  let message = error.message;
  if (isObject(error.params) && Object.keys(error.params).length > 0) {
    let params = Object.entries(error.params)
      .map(([key, value]) => {
        let localizedLabel;
        const labelKey = `source.validationParams.${key}`;
        if (te(labelKey)) {
          localizedLabel = t(labelKey);
        }
        else {
          localizedLabel = key.replace(/([^A-Z]+)([A-Z])/g, "$1 $2").toLowerCase();
        }

        return `${localizedLabel}: ${value}`;
      })
      .join(', ');
    message += ` (${params})`;
  }
  return message;
}

/**
 * Creates a human-readable title for a schema URL, e.g. of a STAC extension.
 *
 * @param {string} id The schema URL
 * @returns {string} The title
 */
export function schemaTitle(id) {
  if (id.startsWith('https://stac-extensions.github.io/')) {
    return URI(id)
      .directory()
      .replace(SCHEMA_VERSION_REGEXP, '/')
      .replace(/\//g, ' ')
      .trim();
  }
  return id
    .replace(/^\w+:\/\//, '')
    .replace(/(\.github\.io|raw\.githubusercontent\.com)\/?/, '')
    .replace(/\/json-schema/, '')
    .replace(/\/[^/]+\.json$/, '')
    .replace(SCHEMA_VERSION_REGEXP, '');
}

/**
 * Extracts the version from a schema URL, e.g. of a STAC extension.
 *
 * @param {string} id The schema URL
 * @returns {string|null} The version, if any
 */
export function schemaVersion(id) {
  const v = id.match(SCHEMA_VERSION_REGEXP);
  return v ? v[1] : null;
}
