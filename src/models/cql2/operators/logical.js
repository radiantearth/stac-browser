//import i18n from '../../../i18n.js';
import CqlOperator from './operator';

export class CqlLogicalOperator extends CqlOperator {

  constructor(operator, args = []) {
    super(operator, args);
  }

}

export class CqlAnd extends CqlLogicalOperator {

  constructor(args = []) {
    super("and", args);
  }

}

export class CqlOr extends CqlLogicalOperator {

  constructor(args = []) {
    super("or", args);
  }

}

export class CqlNot extends CqlLogicalOperator {

  constructor(arg = null) {
    super("not", arg ? [arg] : null);
  }

}
