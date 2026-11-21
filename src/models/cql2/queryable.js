import { Fields } from "@radiantearth/stac-fields";
import { formatKey } from "@radiantearth/stac-fields/helper";
import i18n, { translateFields } from '../../i18n.js';
import { CqlEqual, CqlGreaterThan, CqlGreaterThanEqual, CqlLessThan, CqlLessThanEqual, CqlNotEqual, CqlBetween, CqlLike } from "./operators/comparison";
import { CqlIn, CqlArrayOverlaps, CqlArrayContains, CqlArrayEquals, CqlArrayContainedBy } from "./operators/array";
import { isObject } from "stac-js/src/utils.js";

// Uses the translated stac-fields labels for well-known fields, e.g. properties.datetime
export function formatPropertyKey(key) {
  const field = key.replace(/^properties\./, '');
  const label = Fields.metadata[field]?.label;
  if (typeof label === 'string') {
    return translateFields(label);
  }
  return formatKey(field);
}

const toPattern = source => new RegExp(source, 'u');
const IDENTIFIER = toPattern('^[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFE\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}][:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFE\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}.0-9\u0300-\u036F\u203F-\u2040]*$');
const KEYWORDS = new Set([
  'a_equals', 'a_contains', 'a_containedby', 'a_overlaps', 'accenti', 'and', 'bbox', 'between', 'casei',
  'date', 'div', 'false', 'geometrycollection', 'in', 'interval', 'is', 'like', 'linestring',
  'multilinestring', 'multipoint', 'multipolygon', 'not', 'null', 'or', 'point', 'polygon', 's_intersects',
  's_equals', 's_disjoint', 's_touches', 's_within', 's_overlaps', 's_crosses', 's_contains', 't_after',
  't_before', 't_contains', 't_disjoint', 't_during', 't_equals', 't_finishedby', 't_finishes',
  't_intersects', 't_meets', 't_metby', 't_overlappedby', 't_overlaps', 't_startedby', 't_starts',
  'timestamp', 'true'
]);

export default class Queryable {
  constructor(id, schema) {
    this.id = id;
    this.schema = schema;
  }

  get title() {
    if (typeof this.schema.title === 'string') {
      return this.schema.title;
    }
    return formatPropertyKey(this.id);
  }

  get description() {
    if (this.isTemporal) {
      return i18n.global.t('search.dateDescription');
    }
    return "";
  }

  get supported() {
    return this.isText || this.isNumeric || this.isBoolean || this.isArray;
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

  get isArray() {
    return this.is('array');
  }

  get arrayItems() {
    // Detect the type(s) of the items in the array based on the JSON Schema.
    // JSON Schema allows a variety of ways to specify both "items" and "types".
    // We cater only for the most common cases here, which are:
    // items: object
    // type: omitted, array of strings, a single string
    if (this.isArray && isObject(this.schema.items)) {
      if (typeof this.schema.items.type === 'string') {
        return [this.schema.items.type];
      }
      else if (Array.isArray(this.schema.items.type)) {
        return this.schema.items.type;
      }
    }
    return [];
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
    else if (this.isArray) {
      return [];
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
    const ops = [];

    if (!this.isDateTime && !this.isArray) {
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
    if (this.isNumeric && cql.advancedComparison) {
      ops.push(CqlBetween);
      ops.push(CqlIn);
    }
    if (this.isText && cql.advancedComparison) {
      ops.push(CqlLike);
      ops.push(CqlIn);
    }

    // Array operators for array-type queryables
    if (this.isArray && cql.arrayOperators) {
      ops.push(CqlArrayOverlaps);
      ops.push(CqlArrayContains);
      ops.push(CqlArrayEquals);
      ops.push(CqlArrayContainedBy);
    }

    return ops;
  }

  toText() {
    if (IDENTIFIER.test(this.id) && !KEYWORDS.has(this.id.toLowerCase())) {
      return this.id;
    }
    return `"${this.id.replaceAll('"', '""')}"`;
  }

  toJSON() {
    return { property: this.id };
  }
}
