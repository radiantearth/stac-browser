import Utils from '../../utils';

import texts from './texts.json';
import custom from './custom.json';
import fields from './fields.json';

export default Utils.mergeDeep(
  {
    fields,
  },
  texts,
  custom
);