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
