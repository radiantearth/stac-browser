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

  toJSON(queryable) {
    let value = queryable.value;
    if (value instanceof Date) {
      value = { timestamp: Utils.dateToUTC(value).toISOString() };
    }
    return {
      op: queryable.operator,
      args: [{ property: this.id }, value]
    };
  }

  toText(queryable) {
    let value = queryable.value;
    if (value instanceof Date) {
      value = `TIMESTAMP('${Utils.dateToUTC(value).toISOString()}')`;
    }
    else if (typeof value === 'string') {
      value = `'${value.replace("'", "\\'")}'`;
    }
    return `${this.id} ${queryable.operator} ${value}`;
  }

  static formatText(queryables) {
    if (queryables.length === 0) {
      return {};
    }

    return {
      "filter-lang": "cql2-text",
      filter: queryables.map(q => q.queryable.toText(q)).join(' AND ')
    };
  }

  static formatJSON(queryables) {
    if (queryables.length === 0) {
      return {};
    }

    let filter;
    if (queryables.length === 1) {
      filter = queryables[0].queryable.toJSON(queryables[0]);
    }
    else {
      filter = {
        op: "and",
        args: queryables.map(q => q.queryable.toJSON(q))
      };
    }

    return {
      "filter-lang": "cql2-json",
      filter
    };
  }
}