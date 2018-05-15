<script>
import L from "leaflet";
import "leaflet-easybutton";

export default {
  name: "LControlFullscreen",
  props: {
    fullscreen: {
      type: Boolean,
      default: false
    },
    onChange: {
      type: Function,
      required: true
    }
  },
  mounted() {
    this.button = L.easyButton(
      "fas fa-expand fa-2x",
      () => this.onChange(!this.fullscreen),
      {
        position: "topright"
      }
    ).addTo(this.$parent.mapObject);
  },
  beforeDestroy() {
    this.button.remove();
  },
  render() {
    return null;
  }
};
</script>
