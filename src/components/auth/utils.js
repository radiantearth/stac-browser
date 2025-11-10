import Utils from '../../utils.js';
import { STAC } from 'stac-js';
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
