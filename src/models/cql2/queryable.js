import { formatKey } from "@radiantearth/stac-fields/helper";

// https://docs.ogc.org/DRAFTS/21-065.html

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

  toText() {
    return this.id;
  }

  toJSON() {
    return { property: this.id };
  }

}