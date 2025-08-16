import Utils from '../../utils';
export default Utils.mergeDeep(
  {
    fields: require('./fields.json')
  },
  require('./texts.json'),
  require('./custom.json')
);
