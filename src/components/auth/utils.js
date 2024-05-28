import Utils from '../../utils.js';
import STAC from '../../models/stac.js';

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
  static isSupported(method) {
    switch(method.type) {
      case 'openIdConnect':
        return true;
      // case 'http':
      //   if (method.schema === 'basic') {
      //     return true;
      //   }
      //   return false;
      case 'apiKey':
        if (method.in === 'header' || method.in === 'query') {
          return true;
        }
        return false;
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
