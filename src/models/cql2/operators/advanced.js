import i18n from '../../../i18n.js';
import CqlComparisonOperator from './comparison';

export class CqlLike extends CqlComparisonOperator {

  static SYMBOL = "like";

  constructor(pred = null, obj = null) {
    super(CqlLike.SYMBOL, pred, obj);
  }

  static get label() {
    return "~";
  }

  static get longLabel() {
    return i18n.t('search.matches');
  }

  static get description() {
    return i18n.t('search.likeOperatorDescription');
  }

}

export class CqlBetween extends CqlComparisonOperator {

  static SYMBOL = "between";

  constructor(pred = null, obj = []) {
    super(CqlBetween.SYMBOL, pred, obj);
  }

  static get label() {
    return "≥ … ≤";
  }

  static get longLabel() {
    return i18n.t('search.between');
  }

  static get description() {
    return i18n.t('search.betweenOperatorDescription');
  }

  toText() {
    return `${this.args[0].toText()} BETWEEN ${this.args[1].toText()} and ${this.args[2].toText()}`;
  }

}

// Currently only implemented for strings and numbers, not for booleans and time instances
export class CqlIn extends CqlComparisonOperator {

  static SYMBOL = "in";

  constructor(pred = null, obj = []) {
    super(CqlIn.SYMBOL, pred, obj);
  }

  static get label() {
    return "∈";
  }

  static get longLabel() {
    return i18n.t('search.in');
  }

  static get description() {
    return i18n.t('search.inOperatorDescription');
  }

  toText() {
    let values = this.args.slice(1).map(arg => arg.toText()).join(`,`);
    return `${this.args[0].toText()} IN (${values})`;
  }

}
