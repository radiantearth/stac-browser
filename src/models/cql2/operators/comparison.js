import i18n from '../../../i18n.js';
import CqlOperator from './operator';

export default class CqlComparisonOperator extends CqlOperator {

  constructor(operator, pred = null, obj = null) {
    super(operator, [pred, obj]);
  }

  clone(value) {
    return new this.constructor(this.operator, this.args[0], value);
  }

  static create(pred, op, obj) {
    if (["=", "==", "==="].includes(op)) {
      return new CqlEqual(pred, obj);
    }
    else if (["<>", "!=", "!==", "≠"].includes(op)) {
      return new CqlNotEqual(pred, obj);
    }
    else if ([">=", "≥"].includes(op)) {
      return new CqlGreaterThanEqual(pred, obj);
    }
    else if (op === ">") {
      return new CqlGreaterThan(pred, obj);
    }
    else if (["<=", "≤"].includes(op)) {
      return new CqlLessThanEqual(pred, obj);
    }
    else if (op === "<") {
      return new CqlLessThan(pred, obj);
    }
  }

}

export class CqlEqual extends CqlComparisonOperator {

  static SYMBOL = "=";

  constructor(pred = null, obj = null) {
    super(CqlEqual.SYMBOL, pred, obj);
  }

  static get longLabel() {
    return i18n.t('search.equalTo');
  }

}

export class CqlNotEqual extends CqlComparisonOperator {

  static SYMBOL = "<>";

  constructor(pred = null, obj = null) {
    super(CqlNotEqual.SYMBOL, pred, obj);
  }

  static get label() {
    return "≠";
  }

  static get longLabel() {
    return i18n.t('search.notEqualTo');
  }

}

export class CqlGreaterThan extends CqlComparisonOperator {

  static SYMBOL = ">";

  constructor(pred = null, obj = null) {
    super(CqlGreaterThan.SYMBOL, pred, obj);
  }

  static get longLabel() {
    return i18n.t('search.greaterThan');
  }

}

export class CqlGreaterThanEqual extends CqlComparisonOperator {

  static SYMBOL = ">=";

  constructor(pred = null, obj = null) {
    super(CqlGreaterThanEqual.SYMBOL, pred, obj);
  }

  static get label() {
    return "≥";
  }

  static get longLabel() {
    return i18n.t('search.greaterThanEqual');
  }

}

export class CqlLessThan extends CqlComparisonOperator {

  static SYMBOL = "<";

  constructor(pred = null, obj = null) {
    super(CqlLessThan.SYMBOL, pred, obj);
  }

  static get longLabel() {
    return i18n.t('search.lessThan');
  }

}

export class CqlLessThanEqual extends CqlComparisonOperator {

  static SYMBOL = "<=";

  constructor(pred = null, obj = null) {
    super(CqlLessThanEqual.SYMBOL, pred, obj);
  }

  static get label() {
    return "≤";
  }

  static get longLabel() {
    return i18n.t('search.lessThanEqual');
  }
  
}

/* export class CqlIsNull extends CqlComparisonOperator {
  
  constructor(pred = null) {
    super("IS NULL", pred);
  }

} */
