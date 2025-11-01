export default class CqlOperator {

  constructor(operator, args = []) {
    this.operator = operator;
    this.args = args;
  }

  toText() {
    let op = this.operator.toUpperCase();
    return this.args.map(arg => arg.toText()).join(` ${op} `);
  }

  toJSON() {
    return {
      op: this.operator,
      args: this.args.map(arg => arg.toJSON())
    };
  }

  // Returns a locale key for long label, or null if not available.
  static get description() {
    return null;
  }

  // Returns a string that is internationally understood.
  // This does not get localized.
  static get label() {
    return this.SYMBOL;
  }

  // Returns a locale key for long label, or null if not available.
  static get longLabel() {
    return null;
  }

}
