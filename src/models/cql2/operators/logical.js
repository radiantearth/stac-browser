import CqlOperator from './operator';

export default class CqlLogicalOperator extends CqlOperator {

  constructor(operator, args = []) {
    super(operator, args);
  }

  static create(op, args) {
    if (['&&', 'and'].includes(op)) {
      return new CqlAnd(args);
    }
    else if (['||', 'or'].includes(op)) {
      return new CqlOr(args);
    }
    else if (['!', 'not'].includes(op)) {
      return new CqlNot(args);
    }
  }

}

export class CqlAnd extends CqlLogicalOperator {

  static SYMBOL = "and";

  constructor(args = []) {
    super(CqlAnd.SYMBOL, args);
  }

}

export class CqlOr extends CqlLogicalOperator {

  static SYMBOL = "or";

  constructor(args = []) {
    super(CqlOr.SYMBOL, args);
  }

}

export class CqlNot extends CqlLogicalOperator {

  static SYMBOL = "not";

  constructor(arg = null) {
    super(CqlNot.SYMBOL, arg ? [arg] : null);
  }

}
