//import i18n from '../../../i18n.js';
import CqlComparisonOperator from './comparison';

export class Like extends CqlComparisonOperator {

  constructor() {
    super("like");
  }

}

export class Between extends CqlComparisonOperator {

}

export class In extends CqlComparisonOperator {

}

export default {
  Like,
  Between,
  In
};