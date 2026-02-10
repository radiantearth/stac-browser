import Utils from '../../utils.js';
import { STACReference } from 'stac-js';
import Auth from '../../auth/index.js';

export default class AuthUtils {

  static resolveAuth(obj) {
    if (obj instanceof STACReference) {
      const refs = obj.getMetadata('auth:refs');
      const schemes = obj.getMetadata('auth:schemes');
      if (Utils.size(refs) > 0 && Utils.size(schemes) > 0) {
        return refs
          .map(ref => schemes[ref])
          .filter(ref => Utils.isObject(ref));
      }
    }
    return [];
  }

  static isSupported(method, config) {
    if (method instanceof Auth) {
      method = method.options;
    }
    switch(method.type) {
      case 'http':
        return (method.scheme === 'basic');
      case 'apiKey':
        return (method.in === 'header' || method.in === 'query');
      case 'openIdConnect':
        return (config.historyMode === 'history');
      default:
        return false;
    }
  }

  static convertLegacyAuthConfig(config) {
    if (!Utils.isObject(config) || config.type === null) {
      return null;
    }
    else if (config.type === 'query' || config.type === 'header') {
      // It is the old format
      return {
        type: 'apiKey',
        in: config.type,
        name: config.key,
        description: config.description,
        formatter: config.formatter
      };
    }
    else {
      // Is the new format from the authentication extension
      return config;
    }
  }

}
