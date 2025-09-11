<template>
  <div class="ol-location ol-unselectable ol-control" style="pointer-events: auto;">
    <button @click.prevent.stop="request" :title="$t('mapping.location.description')">
      <b-icon-pin-map-fill />
    </button>
  </div>
</template>

<script>
import Point from 'ol/geom/Point';
import ControlMixin from './ControlMixin';
import { fromLonLat } from 'ol/proj';
import { BIconPinMapFill } from 'bootstrap-vue';

export default {
  name: 'UserLocationControl',
  components: {
    BIconPinMapFill
  },
  mixins: [
    ControlMixin
  ],
  props: {
    maxZoom: {
      type: Number,
      default: undefined
    }
  },
  methods: {
    request() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const view = this.map.getView();
            const coords = fromLonLat([position.coords.longitude, position.coords.latitude], view.getProjection());
            const point = new Point(coords);
            view.fit(point, {maxZoom: this.maxZoom});
          },
          error => this.$root.$emit('error', error, error.message),
          {
            maximumAge: Infinity
          }
        );
      }
    },
  }
};
</script>

<style lang="scss" scoped>
.ol-location {
  z-index: 1;
  left: 0.5em;
  top: calc(3.75em + 6px);
}
</style>
