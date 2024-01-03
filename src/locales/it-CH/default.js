import Utils from '../../utils';
export default Utils.mergeDeep(
  {
    fields: require('../it/fields.json'),
  },
  require('../it/texts.json'),
  require('../it/custom.json')
);