// This language file tries to follow ISO standards and common global conventions as much as possible.
// This is specifically not optimized for the US or UK, but rather for a global audience.
import Utils from '../../utils';
export default Utils.mergeDeep(
  // Don't import the fields.json as it's a 1:1 mapping anyway.
  // If you want to make changes to en/fields.json you can override the phrases in custom.json
  // (or alternatively you can remove the '//' from the next line and edit the field.json directly).
  // { fields: require('./fields.json') },
  require('./texts.json'),
  require('./custom.json')
);
