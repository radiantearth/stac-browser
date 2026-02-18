import { mapState } from 'pinia';
import { useCatalogStore } from '../store/catalog';

import Registry from '@radiantearth/stac-fields/registry';
import contentType from 'content-type';
Registry.addDependency('content-type', contentType);

export default functions => {
  let mixin = {
    computed: {
      ...mapState(useCatalogStore, ['uiLanguage'])
    },
    methods: {}
  };
  for(let name in functions) {
    let fn = functions[name];
    mixin.methods[name] = function() {
      // We call uiLanguage once so that it's a dependency for the computed property
      // which makes the computed property to re-render when uiLanguage changes.
      this.uiLanguage;
      return fn(...arguments);
    };
  }
  return mixin;
};
