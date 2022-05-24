import { BFormInput, BFormSelect } from 'bootstrap-vue';

export default class QueryableInput {
  constructor (queryable) {
    this.queryable = queryable
    this.component = this._getComponentForQueryable()
    this.props = this._getComponentPropsForQueryable()
    this.operator = this.queryable.operatorOptions !== null ? this.queryable.operatorOptions[0] : null
    this.isUsed = false
  }

  setIsUsed (bool) {
    this.isUsed = bool
  }

  setDefaultValue (value) {
    this.props.value = value
  }

  _getComponentPropsForQueryable ()  {
    if (this.queryable.uiType === 'textField') {
      return {
        value: '',
        size: 'sm'
      }
    }
    if (this.queryable.uiType === 'selectField') {
      const value = typeof this.queryable.usableDefinition.enum[0] === 'string' ? this.queryable.usableDefinition.enum[0] : this.queryable.usableDefinition.enum[0].value
      return {
        value,
        options: this.queryable.usableDefinition.enum,
        size: 'sm'
      }
    } else if (this.queryable.uiType === 'numberField') {
      const d = {
        value: 0,
        type: 'number',
        size: 'sm'
      }
      if (this.queryable.usableDefinition.minimum) {
        d.value = this.queryable.usableDefinition.minimum
        d.min = this.queryable.usableDefinition.minimum
      }
      if (this.queryable.usableDefinition.maximum) d.max = this.queryable.usableDefinition.maximum
      return d
    } else if (this.queryable.uiType === 'rangeField') {
      return {
        value: 0,
        type: 'range',
        min: this.queryable.usableDefinition.minimum,
        max: this.queryable.usableDefinition.maximum
      }
    }
  }

  _getComponentForQueryable () {
    if (this.queryable.uiType === 'selectField') return BFormSelect
   return BFormInput
  }

  getAsCql2Json () {
    return {
      op: this.operator,
      args: [{"property": this.queryable.field }, this.props.value ]
    }
  }

  getAsCql2Text () {
    // if (Array.isArray(value) && value.length > 0) {
    //   value = value.join(',');
    // }
    return `${this.queryable.field}${this.operator}${this.props.value}`
  }

}