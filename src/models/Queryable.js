import URI from 'urijs';
import _get from 'lodash.get'

export default class Queryable {
  constructor (id, json) {
    this.id = id
    this._rawJson = json
    this.usableDefinition = null
  }

  get field () {
    return this.id
  }

  get _hasDetails () {
    if ('type' in this._rawJson) return true
    if ('$ref' in this._rawJson) return false
    return true
  }

  get uiType () {
    if (this.usableDefinition === null) return null
    if (this.usableDefinition.enum) return 'selectField'
    if (this.usableDefinition.type === 'string') return 'textField'
    if (this.usableDefinition.type === 'number' || this.usableDefinition.type === 'integer') {
      // if ('minimum' in this.usableDefinition && 'maximum' in this.usableDefinition) return 'rangeField'
      return 'numberField'
    }
    return null
  }

  get operatorOptions () {
    if (this.uiType === null) return null
    if (this.uiType === 'selectField') {
      return ["=", "<>"]
    }
    if (this.uiType === 'textField') {
      return ["=", "<>", 'LIKE']
    }
    if (this.uiType === 'rangeField') {
      return ['>', ">=", "<", "<="]

    }
    if (this.uiType === 'numberField') {
      return ['>', ">=", "<", "<="]
    }
    return null
  }

  async init () {
    if (!this._hasDetails) {
      this.usableDefinition = await this.getDefinitionFromReference()
    } else {
      this.usableDefinition = this._rawJson
    }
  }

  async getDefinitionFromReference () {
    const response = await fetch(this._rawJson.$ref)
    if (!response.ok) return
    const data = await response.json()
    
    const uri = new URI(this._rawJson.$ref)
    const hash = uri.hash()
    const hashComponents = hash.replace('#/', '').split('/').join('.')
    return Object.assign(this._rawJson, _get(data, hashComponents))
  }

  getAsCql2Json (operator, value) {
    return {
      "op": operator,
      "args": [ { "property": this.id }, value ]
    }
  }

  getAsCql2Text (operator, value) {
    // if (Array.isArray(value) && value.length > 0) {
    //   value = value.join(',');
    // }
    return `${this.id}${operator}${value}`
  }
}