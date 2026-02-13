import i18n from '../../../i18n.js';
import CqlOperator from './operator';

export class CqlArrayOverlaps extends CqlOperator {

  static SYMBOL = "a_overlaps";

  constructor(pred = null, obj = null) {
    super(CqlArrayOverlaps.SYMBOL, [pred, obj]);
  }

  static get label() {
    return "∩";
  }

  static get longLabel() {
    return i18n.global.t('search.arrayOverlaps');
  }

  static get description() {
    return i18n.global.t('search.arrayOverlapsDescription');
  }

}

export class CqlArrayContains extends CqlOperator {

  static SYMBOL = "a_contains";

  constructor(pred = null, obj = null) {
    super(CqlArrayContains.SYMBOL, [pred, obj]);
  }

  static get label() {
    return "⊇";
  }

  static get longLabel() {
    return i18n.global.t('search.arrayContains');
  }

  static get description() {
    return i18n.global.t('search.arrayContainsDescription');
  }

}

export class CqlArrayEquals extends CqlOperator {

  static SYMBOL = "a_equals";

  constructor(pred = null, obj = null) {
    super(CqlArrayEquals.SYMBOL, [pred, obj]);
  }

  static get label() {
    return "≡";
  }

  static get longLabel() {
    return i18n.global.t('search.arrayEquals');
  }

  static get description() {
    return i18n.global.t('search.arrayEqualsDescription');
  }

}

export class CqlArrayContainedBy extends CqlOperator {

  static SYMBOL = "a_contained_by";

  constructor(pred = null, obj = null) {
    super(CqlArrayContainedBy.SYMBOL, [pred, obj]);
  }

  static get label() {
    return "⊆";
  }

  static get longLabel() {
    return i18n.global.t('search.arrayContainedBy');
  }

  static get description() {
    return i18n.global.t('search.arrayContainedByDescription');
  }

}

// Negated Array Operators

export class CqlNotArrayOverlaps extends CqlOperator {

  static SYMBOL = "not";

  constructor(pred = null, obj = null) {
    super(CqlNotArrayOverlaps.SYMBOL, [new CqlArrayOverlaps(pred, obj)]);
  }

  static get label() {
    return "∌";
  }

  static get longLabel() {
    return i18n.global.t('search.notArrayOverlaps');
  }

  static get description() {
    return i18n.global.t('search.notArrayOverlapsDescription');
  }

}

export class CqlNotArrayContains extends CqlOperator {

  static SYMBOL = "not";

  constructor(pred = null, obj = null) {
    super(CqlNotArrayContains.SYMBOL, [new CqlArrayContains(pred, obj)]);
  }

  static get label() {
    return "⊉";
  }

  static get longLabel() {
    return i18n.global.t('search.notArrayContains');
  }

  static get description() {
    return i18n.global.t('search.notArrayContainsDescription');
  }

}

export class CqlNotArrayEquals extends CqlOperator {

  static SYMBOL = "not";

  constructor(pred = null, obj = null) {
    super(CqlNotArrayEquals.SYMBOL, [new CqlArrayEquals(pred, obj)]);
  }

  static get label() {
    return "≢";
  }

  static get longLabel() {
    return i18n.global.t('search.notArrayEquals');
  }

  static get description() {
    return i18n.global.t('search.notArrayEqualsDescription');
  }

}

export class CqlNotArrayContainedBy extends CqlOperator {

  static SYMBOL = "not";

  constructor(pred = null, obj = null) {
    super(CqlNotArrayContainedBy.SYMBOL, [new CqlArrayContainedBy(pred, obj)]);
  }

  static get label() {
    return "⊈";
  }

  static get longLabel() {
    return i18n.global.t('search.notArrayContainedBy');
  }

  static get description() {
    return i18n.global.t('search.notArrayContainedByDescription');
  }

}
