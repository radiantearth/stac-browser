import { formatKey } from "@radiantearth/stac-fields/helper";
import { CqlEqual, CqlGreaterThan, CqlGreaterThanEqual, CqlLessThan, CqlLessThanEqual, CqlNotEqual } from "./operators/comparison";
import { CqlLike } from "./operators/advanced";

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

  get description() {
    if (this.isTemporal) {
      return 'search.dateDescription';
    }
    return null;
  }

  get supported() {
    return this.isText || this.isNumeric || this.isBoolean;
  }

  is(type) {
    return this.types.includes(type);
  }

  get isSelection() {
    return Array.isArray(this.schema.enum);
  }

  get isText() {
    return this.is('string');
  }

  get isBoolean() {
    return this.is('boolean');
  }

  get isNumeric() {
    return this.is('number') || this.is('integer');
  }

  get isDate() {
    return this.isText && this.schema.format === 'date';
  }

  get isDateTime() {
    return this.isText && this.schema.format === 'date-time';
  }

  get isTemporal() {
    return this.isDate || this.isDateTime;
  }

  get defaultValue() {
    if (typeof this.schema.default !== 'undefined') {
      return this.schema.default;
    }
    else if (this.isSelection) {
      return this.schema.enum[0];
    }
    else if (this.isTemporal) {
      return new Date();
    }
    else if (this.isNumeric) {
      if (typeof this.schema.minimum !== 'undefined') {
       return this.schema.minimum;
      }
      return 0;
    }
    else if (this.isText) {
      return '';
    }
    else if (this.isBoolean) {
      return false;
    }
    return null;
  }

  get types() {
    if (typeof this.schema.type === 'string') {
      return [this.schema.type];
    }
    else if (Array.isArray(this.schema.type)) {
      return this.schema.type;
    }
    return [];
  }

  getOperators(cql) {
    let ops = [];
    if (!this.isDateTime) {
      // Although it is supported, comparing specific instances in time doesn't give predictable results.
      // For example 2020-01-01T00:00:00Z is not equal to 2020-01-01T00:00:00.001Z and you don't know the granularity
      // of the datetimes in the database. In the end you usually don't get what you are looking for.
      // This may work better for dates only, so we only remove equality operators for dates with times.
      ops.push(CqlEqual);
      ops.push(CqlNotEqual);
    }
    if (this.isNumeric || this.isTemporal) {
      ops.push(CqlLessThan);
      ops.push(CqlLessThanEqual);
      ops.push(CqlGreaterThan);
      ops.push(CqlGreaterThanEqual);
    }
    else if (this.isText && cql.advancedComparison) {
      ops.push(CqlLike);
    }
    return ops;
  }

  toText() {
    return this.id;
  }

  toJSON() {
    return { property: this.id };
  }

}
