import { isObject, size } from 'stac-js/src/utils.js';
import Auth from '../../auth/index.js';

export default class AuthUtils {

  static resolveAuth(obj) {
    if (obj?.isReference()) {
      const refs = obj.getMetadata('auth:refs');
      const schemes = obj.getMetadata('auth:schemes');
      if (size(refs) > 0 && size(schemes) > 0) {
        return refs
          .map(ref => schemes[ref])
          .filter(ref => isObject(ref));
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

}
