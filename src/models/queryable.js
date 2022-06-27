import { label } from "@radiantearth/stac-fields";

export default class Queryable {

  constructor(id, schema) {
    this.id = id;
    this.schema = schema;
  }

  get title() {
    if (typeof this.schema.title === 'string') {
      return this.schema.title;
    }
    return label(this.id);
  }

  toJSON(queryable) {
    return {
      op: queryable.operator,
      args: [{property: this.id }, queryable.value]
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