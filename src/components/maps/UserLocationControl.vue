<template>
  <div class="map-location-control">
    <button
      class="maplibregl-ctrl maplibregl-ctrl-group location-btn"
      @click.prevent.stop="request"
      :title="$t('mapping.location.description')"
    >
      <b-icon-pin-map-fill />
    </button>
  </div>
</template>

<script>
export default {
  name: 'UserLocationControl',
  props: {
    map: {
      type: Object,
      default: null,
    },
    maxZoom: {
      type: Number,
      default: 16
    }
  },
  methods: {
    request() {
      if (!this.map || !("geolocation" in navigator)) return;
      navigator.geolocation.getCurrentPosition(
        position => {
          this.map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: this.maxZoom,
          });
        },
        error => this.$store.commit('showGlobalError', {
          error,
          message: error.message
        }),
        { maximumAge: Infinity }
      );
    },
  }
};
</script>

<style lang="scss" scoped>
.map-location-control {
  position: absolute;
  z-index: 2;
  left: 10px;
  top: 80px;
}

.location-btn {
  cursor: pointer;
  width: 29px;
  height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: none;
  padding: 0;
}
</style>
