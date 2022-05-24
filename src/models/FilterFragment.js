import Queryable from './Queryable'
import QueryableInput from "./QueryableInput"

export default class FilterFragment {
  constructor () {
    this.queryables = []
  }

  async init (stac) {
    const rawQueryables = await stac.getQueryables()
    const keys = Object.keys(rawQueryables)
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index]
      const q = new Queryable(key, rawQueryables[key])
      await q.init()
      const qui = new QueryableInput(q)
      this.queryables.push(qui)
    }
  }

  get isSet () {
    return true
  }

  getAsCql2Json (combineOperator) {
    const filters = this.queryables.filter(q => q.isUsed)
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
    return `${this.queryables.map(q => q.getAsCql2Text()).join(operatorText)}`
  }
}