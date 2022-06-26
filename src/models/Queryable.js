import URI from 'urijs';
import Utils from '../utils';

export default class Queryable {
  constructor (id, json) {
    this.id = id;
    this._rawJson = json;
    this.usableDefinition = null;
  }

  get field () {
    return this.id;
  }

  get _hasDetails () {
    if ('type' in this._rawJson) {
      return true;
    }
    else if ('$ref' in this._rawJson) {
      return false;
    }
    return true;
  }

  get uiType () {
    if (this.usableDefinition === null) {
      return null;
    }
    else if (this.usableDefinition.enum) {
      return 'selectField';
    }
    else if (this.usableDefinition.type === 'string') {
      return 'textField';
    }
    else if (this.usableDefinition.type === 'number' || this.usableDefinition.type === 'integer') {
      // if ('minimum' in this.usableDefinition && 'maximum' in this.usableDefinition) return 'rangeField'
      return 'numberField';
    }
    return null;
  }

  get operatorOptions () {
    switch(this.uiType) {
      case 'selectField':
        return ["=", "<>"];
      case 'textField':
        return ["=", "<>", 'LIKE'];
      case 'rangeField':
      case 'numberField':
        return ['>', ">=", "<", "<="];
      default:
        return null;
    }
  }

  async init () {
    if (!this._hasDetails) {
      this.usableDefinition = await this.getDefinitionFromReference();
    }
    else {
      this.usableDefinition = this._rawJson;
    }
  }

  async getDefinitionFromReference () {
    const response = await fetch(this._rawJson.$ref);
    if (!response.ok) return this._rawJson;
    const data = await response.json();
    
    const uri = new URI(this._rawJson.$ref);
    const hash = uri.hash();
    const hashComponents = hash.replace('#/', '').split('/');
    const obj = Utils.getValueFromObjectUsingPath(data, hashComponents);
    if (obj) {
      return Object.assign(this._rawJson, obj);
    }
    return this._rawJson;
  }
}