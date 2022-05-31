import Queryable from './Queryable'
import QueryableInput from "./QueryableInput"

export default class FilterFragment {
  constructor () {
    this.queryableInputs = []
    this.queryables = []
  }

  async init (stac) {
    const rawQueryables = await stac.getQueryables()
    const keys = Object.keys(rawQueryables)
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index]
      const q = new Queryable(key, rawQueryables[key])
      await q.init()
      this.queryables.push(q)
    }
  }

  createQueryableInput (q) {
    this.queryableInputs.push(new QueryableInput(q))
  }

  removeQueryableInput (input) {
    const index = this.queryableInputs.findIndex(i => i.uniqueId === input.uniqueId)
    this.queryableInputs.splice(index, 1)
  }

  get isSet () {
    return true
  }

  getAsCql2Json (combineOperator) {
    const filters = this.queryableInputs
    if (filters.length === 0) return {}
    return {
      "filter-lang": "cql2-json",
      "filter": {
        "op": combineOperator,
        "args": filters.map(q => q.getAsCql2Json())
      }
    }
  } 

  getAsCql2Text (combineOperator) {
    const operatorText = ` ${combineOperator} `
    return `${this.queryableInputs.map(q => q.getAsCql2Text()).join(operatorText)}`
  }
}