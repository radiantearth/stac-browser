import i18n from '../../../i18n.js';
import CqlValue, { CqlArray } from '../value.js';
import CqlOperator from './operator';

export default class CqlArrayOperator extends CqlOperator {

  constructor(operator, pred = null, obj = null) {
    super(operator, [pred, obj]);
  }

  static create(pred, op, obj) {
    switch(op.toLowerCase()) {
      case 'in':
        return new CqlIn(pred, obj);
      case 'a_overlaps':
        return new CqlArrayOverlaps(pred, obj);
      case 'a_contains':
        return new CqlArrayContains(pred, obj);
      case 'a_equals':
        return new CqlArrayEquals(pred, obj);
      case 'a_contained_by':
        return new CqlArrayContainedBy(pred, obj);
    }
  }

  static valueType() {
    return CqlArray;
  }

  static getDefaultValue() {
    return CqlValue.create([]);
  }

}

// Currently only implemented for strings and numbers, not for booleans and time instances
export class CqlIn extends CqlArrayOperator {

  static SYMBOL = "in";

  constructor(pred = null, obj = []) {
    super(CqlIn.SYMBOL, pred, obj);
  }

  static get label() {
    return "∈";
  }

  static get longLabel() {
    return i18n.global.t('search.in');
  }

  static get description() {
    return i18n.global.t('search.inOperatorDescription');
  }

  toText() {
    return `${this.args[0].toText()} IN ${this.args[1].toText()}`;
  }

}

export class CqlArrayOverlaps extends CqlArrayOperator {

  static SYMBOL = 'a_overlaps';

  constructor(pred = null, obj = null) {
    super(CqlArrayOverlaps.SYMBOL, pred, obj);
  }

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

export class CqlArrayContains extends CqlArrayOperator {

  static SYMBOL = 'a_contains';

  constructor(pred = null, obj = null) {
    super(CqlArrayContains.SYMBOL, pred, obj);
  }

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

export class CqlArrayEquals extends CqlArrayOperator {

  static SYMBOL = 'a_equals';

  constructor(pred = null, obj = null) {
    super(CqlArrayEquals.SYMBOL, pred, obj);
  }

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

export class CqlArrayContainedBy extends CqlArrayOperator {

  static SYMBOL = 'a_contained_by';

  constructor(pred = null, obj = null) {
    super(CqlArrayContainedBy.SYMBOL, pred, obj);
  }

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
