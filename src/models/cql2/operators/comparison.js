import * as Base from '@moregeo-it/cql2';
import i18n from '../../../i18n.js';
import CqlValue from '../value.js';
import withFormSupport from './operator.js';

export class CqlEqual extends withFormSupport(Base.CqlEqual) {

  static get longLabel() {
    return i18n.global.t('search.equalTo');
  }

}

export class CqlNotEqual extends withFormSupport(Base.CqlNotEqual) {

  static get label() {
    return "≠";
  }

  static get longLabel() {
    return i18n.global.t('search.notEqualTo');
  }

}

export class CqlGreaterThan extends withFormSupport(Base.CqlGreaterThan) {

  static get longLabel() {
    return i18n.global.t('search.greaterThan');
  }

}

export class CqlGreaterThanEqual extends withFormSupport(Base.CqlGreaterThanEqual) {

  static get label() {
    return "≥";
  }

  static get longLabel() {
    return i18n.global.t('search.greaterThanEqual');
  }

}

export class CqlLessThan extends withFormSupport(Base.CqlLessThan) {

  static get longLabel() {
    return i18n.global.t('search.lessThan');
  }

}

export class CqlLessThanEqual extends withFormSupport(Base.CqlLessThanEqual) {

  static get label() {
    return "≤";
  }

  static get longLabel() {
    return i18n.global.t('search.lessThanEqual');
  }

}

export class CqlLike extends withFormSupport(Base.CqlLike) {

  static get label() {
    return "~";
  }

  static get longLabel() {
    return i18n.global.t('search.matches');
  }

  static get description() {
    return i18n.global.t('search.likeOperatorDescription');
  }

}

export class CqlBetween extends withFormSupport(Base.CqlBetween) {

  // The form keeps both bounds in one array
  constructor(pred = null, bounds = []) {
    super(pred, bounds[0], bounds[1]);
  }

  static get label() {
    return "≥ … ≤";
  }

  static get longLabel() {
    return i18n.global.t('search.between');
  }

  static get description() {
    return i18n.global.t('search.betweenOperatorDescription');
  }

  static valueType() {
    return CqlBetween;
  }

  static getDefaultValue(queryable) {
    return [
      CqlValue.create(queryable.defaultValue),
      CqlValue.create(queryable.defaultValue)
    ];
  }

}
