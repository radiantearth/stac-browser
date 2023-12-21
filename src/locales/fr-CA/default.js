import Utils from '../../utils';
export default Utils.mergeDeep(
  {
    fields: require('../fr/fields.json'),
  },
  require('../fr/texts.json'),
  require('../fr/custom.json')
);