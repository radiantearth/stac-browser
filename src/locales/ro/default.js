import Utils from '../../utils';
import text from './texts.json';
import custom from './custom.json';
import fields from './fields.json';

export default Utils.mergeDeep(
  {
    fields,
  },
  text,
  custom
);