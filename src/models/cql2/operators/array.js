import * as Base from '@moregeo-it/cql2';
import i18n from '../../../i18n.js';
import CqlValue, { CqlArray } from '../value.js';
import withFormSupport from './operator.js';

function valueType() {
  return CqlArray;
}

function getDefaultValue() {
  return CqlValue.create([]);
}

// Currently only implemented for strings, numbers and time instances, not for booleans
export class CqlIn extends withFormSupport(Base.CqlIn) {

  static valueType = valueType;

  static getDefaultValue = getDefaultValue;

  static get label() {
    return "∈";
  }

  static get longLabel() {
    return i18n.global.t('search.in');
  }

  static get description() {
    return i18n.global.t('search.inOperatorDescription');
  }

}

export class CqlArrayOverlaps extends withFormSupport(Base.CqlArrayOverlaps) {

  static valueType = valueType;

  static getDefaultValue = getDefaultValue;

  static get label() {
    return '∩';
  }

  static get longLabel() {
    return i18n.global.t('search.arrayOverlaps');
  }

  static get description() {
    return i18n.global.t('search.arrayOverlapsDescription');
  }

}

export class CqlArrayContains extends withFormSupport(Base.CqlArrayContains) {

  static valueType = valueType;

  static getDefaultValue = getDefaultValue;

  static get label() {
    return '⊇';
  }

  static get longLabel() {
    return i18n.global.t('search.arrayContains');
  }

  static get description() {
    return i18n.global.t('search.arrayContainsDescription');
  }

}

export class CqlArrayEquals extends withFormSupport(Base.CqlArrayEquals) {

  static valueType = valueType;

  static getDefaultValue = getDefaultValue;

  static get label() {
    return '≡';
  }

  static get longLabel() {
    return i18n.global.t('search.arrayEquals');
  }

  static get description() {
    return i18n.global.t('search.arrayEqualsDescription');
  }

}

export class CqlArrayContainedBy extends withFormSupport(Base.CqlArrayContainedBy) {

  static valueType = valueType;

  static getDefaultValue = getDefaultValue;

  static get label() {
    return '⊆';
  }

  static get longLabel() {
    return i18n.global.t('search.arrayContainedBy');
  }

  static get description() {
    return i18n.global.t('search.arrayContainedByDescription');
  }

}
