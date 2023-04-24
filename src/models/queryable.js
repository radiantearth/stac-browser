import { formatKey } from "@radiantearth/stac-fields/helper";
import Utils from '../utils';

export default class Queryable {

  constructor(id, schema) {
    this.id = id;
    this.schema = schema;
  }

  get title() {
    if (typeof this.schema.title === 'string') {
      return this.schema.title;
    }
    return formatKey(this.id);
  }

  toJSON(data) {
    let value = data.value;
    if (value instanceof Date) {
      value = { timestamp: Utils.dateToUTC(value).toISOString() };
    }
    return {
      op: data.operator,
      args: [{ property: this.id }, value]
    };
  }

  toText(data) {
    let value = data.value;
    if (value instanceof Date) {
      value = `TIMESTAMP('${Utils.dateToUTC(value).toISOString()}')`;
    }
    else if (typeof value === 'string') {
      value = `'${value.replace("'", "\\'")}'`;
    }
    return `${this.id} ${data.operator} ${value}`;
  }

  static formatText(filters, queryables) {
    if (filters.length === 0) {
      return {};
    }

    return {
      "filter-lang": "cql2-text",
      filter: filters.map(f => {
        let queryable = queryables.find(q => q.id === f.qid);
        return queryable.toText(f.data);
      }).join(' AND ')
    };
  }

  static formatJSON(filters, queryables) {
    if (filters.length === 0) {
      return {};
    }

    filters = filters.map(f => {
      let queryable = queryables.find(q => q.id === f.qid);
      return queryable.toJSON(f.data);
    });

    let filter;
    if (filters.length === 1) {
      filter = filters[0];
    }
    else {
      filter = {
        op: "and",
        args: filters
      };
    }

    return {
      "filter-lang": "cql2-json",
      filter
    };
  }
}