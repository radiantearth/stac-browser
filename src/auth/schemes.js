import { isObject, size } from 'stac-js/src/utils.js';
import { STACReference } from 'stac-js';

// The scheme id that the legacy (single scheme object) authConfig is registered under.
export const LEGACY_SCHEME_ID = 'default';

// Fields that identify an authentication scheme. Two definitions with the same
// identity fields are considered to be the same scheme (e.g. for detecting
// whether a catalog re-defines a scheme differently).
const IDENTITY_FIELDS = ['type', 'scheme', 'in', 'name', 'openIdConnectUrl'];

/**
 * Checks whether the given value is a single Authentication Scheme Object.
 *
 * Used to distinguish the legacy authConfig (one scheme object, always has a
 * `type`) from the map form (scheme id => scheme object).
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isSchemeObject(value) {
  return isObject(value) && typeof value.type === 'string';
}

/**
 * Normalizes the authConfig option into a map of scheme id => scheme object.
 *
 * Supports both the legacy form (a single scheme object, registered under the
 * id `default` and flagged as default) and the map form aligned with the
 * STAC Authentication extension's `auth:schemes`.
 * Ensures that at most one scheme carries the `default: true` flag.
 *
 * @param {Object|null} authConfig
 * @returns {Object.<string, Object>}
 */
export function normalizeAuthConfig(authConfig) {
  if (!isObject(authConfig)) {
    return {};
  }
  const schemes = {};
  if (isSchemeObject(authConfig)) {
    schemes[LEGACY_SCHEME_ID] = Object.assign({}, authConfig, { default: true });
  }
  else {
    for (const [id, scheme] of Object.entries(authConfig)) {
      if (isObject(scheme)) {
        schemes[id] = Object.assign({}, scheme);
      }
    }
  }
  let defaultId = null;
  for (const id in schemes) {
    if (schemes[id].default) {
      if (defaultId) {
        console.warn(`authConfig: Multiple schemes are flagged as default, using '${defaultId}' and ignoring the flag on '${id}'.`);
        delete schemes[id].default;
      }
      else {
        defaultId = id;
      }
    }
  }
  return schemes;
}

/**
 * Returns the id of the scheme flagged as default, or null.
 *
 * @param {Object.<string, Object>} schemes - normalized authConfig
 * @returns {string|null}
 */
export function getDefaultId(schemes) {
  for (const id in schemes) {
    if (schemes[id].default) {
      return id;
    }
  }
  return null;
}

/**
 * Merges a scheme announced by a STAC document (via `auth:schemes`) with the
 * scheme configured in authConfig under the same id.
 *
 * The config wins over the announced fields so that deployers can complete or
 * override incomplete schemes (e.g. provide a client id for OpenID Connect).
 * The `default` flag is only honored from the config, never from remote data.
 *
 * @param {Object|null} catalogScheme - scheme from the STAC document
 * @param {Object|null} configScheme - scheme from authConfig
 * @returns {Object|null}
 */
function deepMerge(base, override) {
  const merged = Object.assign({}, base);
  for (const key in override) {
    const value = override[key];
    if (isObject(value) && isObject(merged[key])) {
      merged[key] = deepMerge(merged[key], value);
    }
    else {
      merged[key] = value;
    }
  }
  return merged;
}

export function mergeScheme(catalogScheme, configScheme) {
  if (!isObject(catalogScheme)) {
    return isObject(configScheme) ? configScheme : null;
  }
  catalogScheme = Object.assign({}, catalogScheme);
  delete catalogScheme.default;
  if (!isObject(configScheme)) {
    return catalogScheme;
  }
  return deepMerge(catalogScheme, configScheme);
}

/**
 * A canonical string of the fields that identify a scheme.
 *
 * Used to detect whether a scheme definition has changed (same id, different
 * content), in which case existing credentials must be discarded.
 *
 * @param {Object} scheme
 * @returns {string}
 */
export function schemeKey(scheme) {
  const identity = {};
  if (isObject(scheme)) {
    for (const field of IDENTITY_FIELDS) {
      if (typeof scheme[field] !== 'undefined') {
        identity[field] = scheme[field];
      }
    }
  }
  return JSON.stringify(identity);
}

/**
 * Checks whether STAC Browser supports the given authentication scheme.
 *
 * @param {Object} scheme - scheme object (or an object with an `options` property holding it)
 * @param {Object} config - the (root) state or config with a `historyMode` property
 * @returns {boolean}
 */
export function isSupported(scheme, config) {
  if (isObject(scheme) && isObject(scheme.options)) {
    scheme = scheme.options; // Auth (method) instance
  }
  if (!isObject(scheme)) {
    return false;
  }
  switch(scheme.type) {
    case 'http':
      return (scheme.scheme === 'basic');
    case 'apiKey':
      return ['header', 'query', 'cookie'].includes(scheme.in);
    case 'openIdConnect':
      return (config.historyMode === 'history');
    default:
      return false;
  }
}

/**
 * Resolves the `auth:refs` of a STAC link or asset against the `auth:schemes`
 * defined in the corresponding STAC document.
 *
 * @param {STACReference} obj - a stac-js Link or Asset
 * @returns {Array.<{id: string, scheme: Object}>} the referenced schemes, in the order of the refs
 */
export function resolveRefs(obj) {
  if (obj instanceof STACReference) {
    const refs = obj.getMetadata('auth:refs');
    const schemes = obj.getMetadata('auth:schemes');
    if (size(refs) > 0 && size(schemes) > 0) {
      return refs
        .filter(id => isObject(schemes[id]))
        .map(id => ({ id, scheme: schemes[id] }));
    }
  }
  return [];
}
