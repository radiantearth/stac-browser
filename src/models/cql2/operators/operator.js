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

  description() {
    return "";
  }

  label() {
    return this.operator;
  }

  longLabel() {
    return this.label();
  }

}