//import i18n from '../../../i18n.js';
import CqlOperator from './operator';

export default class CqlComparisonOperator extends CqlOperator {

  constructor(operator, pred = null, obj = null) {
    super(operator, [pred, obj]);
  }

  clone(pred, obj) {
    return new this.constructor(this.operator, pred, obj);
  }

  static create(pred, op, obj) {
    if (["=", "==", "==="].includes(op)) {
      return new CqlEqual(pred, obj);
    }
    else if (["<>", "!=", "!=="].includes(op)) {
      return new CqlNotEqual(pred, obj);
    }
    else if (op === ">=") {
      return new CqlGreaterThanEqual(pred, obj);
    }
    else if (op === ">") {
      return new CqlGreaterThan(pred, obj);
    }
    else if (op === "<=") {
      return new CqlLowerThanEqual(pred, obj);
    }
    else if (op === "<") {
      return new CqlLowerThan(pred, obj);
    }
  }

}

export class CqlEqual extends CqlComparisonOperator {

  constructor(pred = null, obj = null) {
    super("=", pred, obj);
  }

}

export class CqlNotEqual extends CqlComparisonOperator {

  constructor(pred = null, obj = null) {
    super("<>", pred, obj);
  }

}

export class CqlGreaterThan extends CqlComparisonOperator {

  constructor(pred = null, obj = null) {
    super(">", pred, obj);
  }

}

export class CqlGreaterThanEqual extends CqlComparisonOperator {

  constructor(pred = null, obj = null) {
    super(">=", pred, obj);
  }

}

export class CqlLowerThan extends CqlComparisonOperator {

  constructor(pred = null, obj = null) {
    super("<", pred, obj);
  }

}

export class CqlLowerThanEqual extends CqlComparisonOperator {

  constructor(pred = null, obj = null) {
    super("<=", pred, obj);
  }
  
}

/* export class CqlIsNull extends CqlComparisonOperator {
  
  constructor(pred = null) {
    super("IS NULL", pred);
  }

} */
