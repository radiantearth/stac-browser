import Queryable from './Queryable';
import bboxPolygon from '@turf/bbox-polygon'

export default class QueryableBBox extends Queryable {
  constructor (id, json) {
    super(id, json)
  }

  get field () {
    return this.id
  }

  get _hasDetails () {
    return true
  }

  get uiType () {
    return 'bboxMap'
  }

  get operatorOptions () {
    return null
  }

  getAsCql2Json (operator, bboxArray) {
    return {
      "op": 's_intersects',
      "args": [ { "property": "geometry" }, bboxPolygon(bboxArray) ]
    }
  }

  getAsCql2Text (operator, bboxArray) {
    return `bbox=${bboxArray.toString(',')}`
  }
}