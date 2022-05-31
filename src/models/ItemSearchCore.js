import Queryable from "./Queryable"
import QueryableInput from "./QueryableInput"

export default class ItemSearchCore {
  constructor () {
    this.queryables = []
    this.queryableInputs = []
  }

  init () {
    const coreFields = [
      {
        id: 'ids',
        options: {
          "title": "Item IDs",
          "type": "string"          
        }
      },
      {
        id: 'collections',
        options: {
          "title": "Collection",
          "type": "string"
        }
      },
      {
        id: 'datetime',
        options: {
          "type": "string",
          "format": "date-time",
          "pattern": "(\\+00:00|Z)$"
        }
      },
      {
        id: 'limit',
        options: {
          "title": "Limit",
          "type": "number",
          "minimum": 1,
          "maximum": 1000
        }
      },
      {
        id: 'bbox',
        options: {
          "title": "Bounding Box",
          "type": "number"
        }
      }
    ]
    coreFields.forEach(async (field) => {
      const q = new Queryable(field.id, field.options)
      await q.init()
      this.queryables.push(q)
      const qui = new QueryableInput(q)
      if (q.id === 'limit') qui.setDefaultValue(12)
      this.queryableInputs.push(qui)
    })
  }

  get limitQueryableInput () {
    return this.queryableInputs.find(q => q.queryable.id === 'limit')
  }

  get datetimeQueryableInput () {
    return this.queryableInputs.find(q => q.queryable.id === 'datetime')
  }

  get collectionsQueryableInput () {
    return this.queryableInputs.find(q => q.queryable.id === 'collections')
  }

  get bboxQueryableInput () {
    return this.queryableInputs.find(q => q.queryable.id === 'bbox')
  }

  getAsCql2Json () {
    let out = {}
    this.queryableInputs.forEach(q => {
      if (q.props.value !== '') out[q.queryable.field] = q.props.value 
    })
    return out
  }

  getAsCql2Text () {
    return ''
  }

}