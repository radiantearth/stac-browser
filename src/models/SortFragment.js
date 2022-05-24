import Queryable from "./Queryable"
import QueryableInput from "./QueryableInput"

export default class SortFragment {
  constructor () {
    this.queryable = null
    this.direction = ''
    this.field = ''
  }

  async init () {
    const q = new Queryable('sortby', {
      type: 'string',
      enum: [
        { value: '', text: 'Default' },
        { value: 'properties.datetime', text: 'Date and Time' },
        { value: 'id', text: 'ID' },
        { value: 'properties.title', text: 'Title' }
      ]
    })
    await q.init()
    const qui = new QueryableInput(q)
    this.queryable = qui
    if (q.id === 'limit') qui.setDefaultValue(12)
  }

  get _directionAsSymbol () {
    // if (this.direction === 'asc') return '+'
    // if (this.direction === 'desc') return '-'
    return this.direction
  }

  getAsCql2Json () {
    if (this.queryable.props.value === '' && this._directionAsSymbol === '') return 
    return {
      sortby: [
        {
          "field": this.queryable.props.value,
          "direction": this._directionAsSymbol
        }
      ]
    }
  }
  
  getAsCql2Text () {
    return `sortby=${this._directionAsSymbol}${this.field}`
  }

}