import Utils from '../../utils.js';
import STAC from '../../models/stac.js';
import Auth from '../../auth/index.js';

export default class AuthUtils {

  static resolveAuth(obj, context) {
    if (context instanceof STAC && Utils.size(obj['auth:refs']) > 0) {
      const scheme = context.getMetadata('auth:schemes');
      if (Utils.size(scheme) > 0) {
        return obj['auth:refs']
          .map(ref => scheme[ref])
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
        return (method.schema === 'basic');
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
