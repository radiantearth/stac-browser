<template>
  <b-button v-show="element" variant="light" class="fullscreen-button" type="button" @click="toggleFullscreen" :title="title">
    <span v-show="isFullscreen"><b-icon-fullscreen-exit /></span>
    <span v-show="!isFullscreen"><b-icon-fullscreen /></span>
  </b-button>
</template>

<script>
// This is taken from the openEO Web Editor:
// https://raw.githubusercontent.com/Open-EO/openeo-web-editor/master/src/components/FullscreenButton.vue

import { BIconFullscreen, BIconFullscreenExit } from 'bootstrap-vue';

export default {
  name: 'FullscreenButton',
  components: {
    BIconFullscreen,
    BIconFullscreenExit
  },
  props: {
    element: {
      type: [Function, String, Object],
      required: true
    },
    zIndex: {
      type: Number,
      default: 9000
    }
  },
  data() {
    return {
      isFullscreen: false,
      keyDownFn: null,
      oldZIndex: 'auto'
    };
  },
  computed: {
    title() {
      return this.isFullscreen ? this.$t('fullscreen.exit') : this.$t('fullscreen.show');
    }
  },
  mounted() {
    this.keyDownFn = this.onkeyDown.bind(this);
    let el = this.getElement();
    if (el) {
      el.style.position = "relative";
      el.addEventListener('keydown', this.keyDownFn);
    }
  },
  beforeDestroy() {
    let el = this.getElement();
    if (el) {
      el.removeEventListener('keydown', this.keyDownFn);
    }
  },
  methods: {
    onkeyDown(e) {
      // ToDo: This is bugged and needs some attention
      if(this.isFullscreen && (e.key === "F11" || e.key === "Escape")) {
        this.toggleFullscreen();
        e.preventDefault();
        e.stopPropagation();
      }
    },
    getElement() {
      if (typeof this.element === 'string') {
        return document.querySelector(this.element);
      }
      else if (typeof this.element === 'function') {
        return this.element();
      }
      else {
        return this.element;
      }
    },
    toggleFullscreen() {
      let el = this.getElement();
      if (!this.isFullscreen) {
        document.body.style.overflow = "hidden";
        this.isFullscreen = true;
        el.classList.add('fullscreen');
        this.oldZIndex = el.style.zIndex;
        el.style.zIndex = this.zIndex;
      }
      else {
        this.isFullscreen = false;
        document.body.style.overflow = null;
        el.classList.remove('fullscreen');
        // Revert z-index changes
        el.style.zIndex = this.oldZIndex;
      }

      this.$emit('changed', this.isFullscreen);
    },
  }
};
</script>

<style lang="scss">
#stac-browser {
  .fullscreen {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background-color: white;
    overflow: auto;
  }
}
</style>