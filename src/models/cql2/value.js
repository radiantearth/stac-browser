import Utils from "../../utils";

export default class CqlValue {

  constructor(value) {
    this.value = value;
  }

  static create(value) {
    if (Array.isArray(value)) {
      return new CqlArray(value);
    }
    else if (value instanceof Date) {
      return new CqlTimestamp(value);
    }
    else if (typeof value === 'string') {
      return new CqlString(value);
    }
    else {
      return new CqlValue(value);
    }
  }

  toJSON() {
    return this.value;
  }

  toText() {
    return this.value;
  }

}

export class CqlTimestamp extends CqlValue {

  constructor(value) {
    super(value);
  }

  toJSON() {
    return { timestamp: this.toTimestamp() };
  }

  toText() {
    return `TIMESTAMP('${this.toTimestamp()}')`;
  }

  toTimestamp() {
    return Utils.dateToUTC(this.value).toISOString();
  }

}

export class CqlString extends CqlValue {

  constructor(value) {
    super(value);
  }

  toJSON() {
    return this.value;
  }

  toText() {
    return `'${this.value.replace("'", "''")}'`;
  }

}

export class CqlArray extends CqlValue {

  constructor(value) {
    super(value);
  }

  toJSON() {
    return this.value;
  }

  toText() {
    return this.value.map(elem => {
      let cql = elem instanceof CqlValue ? elem : CqlValue.create(elem);
      return cql.toText();
    });
  }

}