import Utils from '../../utils';
export default Utils.mergeDeep(
  {
    fields: require('../de/fields.json'),
  },
  require('../de/texts.json'),
  require('../de/custom.json')
);