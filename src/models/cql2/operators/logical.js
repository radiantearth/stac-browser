import * as Base from '@moregeo-it/cql2';
import i18n from '../../../i18n.js';
import withFormSupport from './operator.js';

export default class CqlLogicalOperator {

  static create(op, args) {
    if (['&&', 'and'].includes(op)) {
      return args.length === 1 ? args[0] : new CqlAnd(args);
    }
    else if (['||', 'or'].includes(op)) {
      return args.length === 1 ? args[0] : new CqlOr(args);
    }
    else if (['!', 'not'].includes(op)) {
      return new CqlNot(args[0]);
    }
  }

}

export class CqlAnd extends withFormSupport(Base.CqlAnd) {

  static get label() {
    return "∧";
  }

  static get longLabel() {
    return i18n.global.t('search.logical.and');
  }

}

export class CqlOr extends withFormSupport(Base.CqlOr) {

  static get label() {
    return "∨";
  }

  static get longLabel() {
    return i18n.global.t('search.logical.or');
  }

}

export class CqlNot extends withFormSupport(Base.CqlNot) {

  static get label() {
    return "¬";
  }

  static get longLabel() {
    return i18n.global.t('search.logical.not');
  }

}
