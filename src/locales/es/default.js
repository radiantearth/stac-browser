export default Object.assign(
  // Don't import the fields as it's a 1:1 mapping anyway
  // { fields: require('./fields.json') },
  require('./texts.json'),
  require('./custom.json')
);