import {
  CqlArray as BaseArray,
  CqlTimestamp as BaseTimestamp,
  CqlValue as BaseValue
} from '@moregeo-it/cql2';

export default class CqlValue extends BaseValue {

  static create(value) {
    if (Array.isArray(value)) {
      return new CqlArray(value);
    }
    else if (value instanceof Date) {
      return new CqlTimestamp(value);
    }
    else if (value === null || typeof value === 'undefined') {
      return new CqlValue(value);
    }
    return BaseValue.create(value);
  }

}

export class CqlTimestamp extends BaseTimestamp {

  constructor(date) {
    super(date);
    this.date = date;
  }

  get raw() {
    return this.date;
  }

}

export class CqlArray extends BaseArray {

  constructor(values = []) {
    super(values.map(value => CqlValue.create(value)));
  }

  // The values as entered in the form, e.g. Date objects instead of timestamps
  get raw() {
    return this.value.map(element => 'raw' in element ? element.raw : element.value);
  }

}
