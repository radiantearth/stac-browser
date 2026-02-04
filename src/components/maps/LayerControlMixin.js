export default {
  methods: {
    getTitle(layer) {
      const fallback = this.$t('mapping.layers.unnamed', {id: layer.ol_uid});
      let title = layer.get('title') || fallback;
      if (layer.get('bounds')) {
        return this.$t('mapping.layers.footprint');
      }
      const stac = layer.get('stac');
      if (stac) {
        const stacTitle = stac.getMetadata('title');
        if (stac.isAsset()) {
          title = stacTitle || stac.getKey();
        } else if (stac.isLink()) {
          title = stacTitle || (stac.rel ? stac.rel.toUpperCase() : fallback);
        } else {
          title = stacTitle || stac.id;
        }
      }
      return title;
    }
  }
};
