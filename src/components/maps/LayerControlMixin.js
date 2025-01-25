export default {
  methods: {
    getTitle(layer) {
      let title = layer.get('title') || this.$t('mapping.layers.unnamed', {id: layer.ol_uid});
      if (layer.get('bounds')) {
        return this.$t('mapping.layers.footprint');
      }
      let stac = layer.get('stac');
      if (stac) {
        if (stac.isAsset() || stac.isLink()) {
          title = stac.getMetadata('title') || stac.getKey();
        } else {
          title = stac.getMetadata('title') || stac.id;
        }
      }
      return title;
    }
  }
};
