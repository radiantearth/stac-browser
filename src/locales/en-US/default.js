export default Object.assign(
  // Don't import the fields as it's a 1:1 mapping anyway
  // { fields: require('../en/fields.json') },
  require('../en/texts.json'),
  require('../en/custom.json')
);