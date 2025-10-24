<template>
  <b-button
    v-if="isSupported" @click.prevent="toggleFullscreen"
    ref="button" variant="dark" class="fullscreen-button" :title="title"
  >
    <span v-show="isFullscreen">{{ $t('fullscreen.exitLabel') }}</span>
    <span v-show="!isFullscreen">{{ $t('fullscreen.showLabel') }}</span>
  </b-button>
</template>

<script>
export default {
  name: 'FullscreenButton',
  props: {
    element: {
      type: [Function, String, Object],
      required: true
    }
  },
  emits: ['changed'],
  data() {
    return {
      isFullscreen: false,
      doc: document,
      node: null,
      listener: this.onChange.bind(this)
    };
  },
  computed: {
    title() {
      return this.isFullscreen ? this.$t('fullscreen.exit') : this.$t('fullscreen.show');
    },
    isSupported() {
      return Boolean(this.node && this.doc.body.requestFullscreen && this.doc.fullscreenEnabled);
    }
  },
  watch: {
    element: {
      immediate: true,
      handler() {
        this.update();
      }
    },
    isFullscreen(active) {
      if (active) {
        this.doc.addEventListener('fullscreenchange', this.listener);
      }
      else {
        this.doc.removeEventListener('fullscreenchange', this.listener);
      }
      this.node.classList.toggle('fullscreen', active);
      this.$refs.button.$el.blur();
      this.$emit('changed', active);
    }
  },
  mounted() {
    this.update();
  },
  beforeUnmount() {
    this.forceClose();
  },
  methods: {
    update() {
      this.forceClose();
      this.node = this.getElement();
      if (this.node) {
        this.doc = this.node.ownerDocument;
      }
    },
    forceClose() {
      if (this.isFullscreen) {
        this.doc.exitFullscreen();
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
    onChange() {
      if (this.isFullscreen && !this.doc.fullscreenElement) {
        this.isFullscreen = false;
      }
    },
    toggleFullscreen() {
      if (!this.isSupported) {
        return;
      }
      if (this.isFullscreen) {
        this.doc.exitFullscreen()
          .then(() => this.isFullscreen = false);
      } else {
        this.node.requestFullscreen()
          .then(() => this.isFullscreen = true);
      }
    },
  }
};
</script>

<style lang="scss">
#stac-browser {
  .fullscreen {
    background-color: white;
    overflow: auto;
  }
}
</style>
