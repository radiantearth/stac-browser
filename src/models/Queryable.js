import URI from 'urijs';
import Utils from '../utils';

export default class Queryable {
  constructor(id, json) {
    this.id = id;
    this._rawJson = json;
    this._referenceJson = null;
  }

  get field() {
    return this.id;
  }

  get _hasDetails() {
    if ('type' in this._rawJson) {
      return true;
    }
    else if ('$ref' in this._rawJson) {
      return false;
    }
    return true;
  }

  get titleOrId() {
    if ('title' in this.usableDefinition) {
      return this.usableDefinition.title;
    }
    return this.id;
  }

  get _requiresReferenceJson() {
    if ('type' in this._rawJson) {
      return false;
    }
    else if ('$ref' in this._rawJson) {
      return true;
    }
    return false;
  }

  get usableDefinition() {
      if (!this._requiresReferenceJson || this._referenceJson === null) {
        return this._rawJson;
      }
      return this._referenceJson;
  }

  get inputType() {
      return this.usableDefinition.type;
  }

  setDefinitionFromReference(referenceUrl, json) {
      const uri = new URI(referenceUrl);
      const hash = uri.hash();
      const hashComponents = hash.replace('#/', '').split('/');
      const obj = Utils.getValueFromObjectUsingPath(json, hashComponents);
      if (obj !== null) {
        this._referenceJson = obj;
      }
  }

}