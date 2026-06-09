<template>
  <ul v-if="layers.length > 0">
    <li v-for="layer in layers" :key="layer.id">
      <div class="d-flex justify-content-between">
        <b-form-checkbox
          inline
          :model-value="layer.visible"
          @update:model-value="toggleVisibility(layer, $event)"
        >
          <span class="title">{{ layer.title }}</span>
        </b-form-checkbox>
      </div>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'LayerControlGroup',
  props: {
    map: {
      type: Object,
      required: true
    },
    layerIds: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    layers() {
      if (!this.map || !this.layerIds.length) {return [];}
      return this.layerIds.map(id => {
        const vis = this.map.getLayoutProperty(id, 'visibility');
        return {
          id,
          title: id,
          visible: vis !== 'none',
        };
      });
    },
  },
  methods: {
    toggleVisibility(layer, visible) {
      const val = visible ? 'visible' : 'none';
      if (this.map.getLayer(layer.id)) {
        this.map.setLayoutProperty(layer.id, 'visibility', val);
      }
      layer.visible = visible;
    },
  },
};
</script>

<style lang="scss" scoped>
ul {
  list-style: none;
  padding: 0.1rem 0;
  margin: 0;

  li {
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
  }

  .title {
    line-break: anywhere;
  }
}
</style>
