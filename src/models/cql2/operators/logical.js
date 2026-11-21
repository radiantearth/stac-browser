import i18n from '../../../i18n.js';
import CqlOperator from './operator.js';

export default class CqlLogicalOperator extends CqlOperator {

  constructor(operator, args = []) {
    super(operator, args);
  }

  static create(op, args) {
    if (args.length === 1 && ['&&', 'and', '||', 'or'].includes(op)) {
      return args[0];
    }
    else if (['&&', 'and'].includes(op)) {
      return new CqlAnd(args);
    }
    else if (['||', 'or'].includes(op)) {
      return new CqlOr(args);
    }
    else if (['!', 'not'].includes(op)) {
      return new CqlNot(args[0]);
    }
  }

}

export class CqlAnd extends CqlLogicalOperator {

  static SYMBOL = "and";

  constructor(args = []) {
    super(CqlAnd.SYMBOL, args);
  }

  static get label() {
    return "∧";
  }

  static get longLabel() {
    return i18n.global.t('search.logical.and');
  }

}

export class CqlOr extends CqlLogicalOperator {

  static SYMBOL = "or";

  constructor(args = []) {
    super(CqlOr.SYMBOL, args);
  }

  static get label() {
    return "∨";
  }

  static get longLabel() {
    return i18n.global.t('search.logical.or');
  }

}

export class CqlNot extends CqlLogicalOperator {

  static SYMBOL = "not";

  constructor(arg = null) {
    super(CqlNot.SYMBOL, arg ? [arg] : []);
  }

  toText() {
    return `NOT (${this.args[0].toText()})`;
  }

  static get label() {
    return "¬";
  }

  static get longLabel() {
    return i18n.global.t('search.logical.not');
  }

}
