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

  static get description() {
    return "";
  }

  static get label() {
    return this.SYMBOL;
  }

  static get longLabel() {
    return this.label;
  }

}