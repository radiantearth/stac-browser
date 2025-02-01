<template>
  <div v-if="texts.length > 0" class="ol-textcontrol ol-unselectable ol-control" @click="toggle" :class="{pointer: texts.length > 1}">{{ current }}</div>
</template>

<script>
import ControlMixin from './ControlMixin.js';

export default {
  name: 'TextControl',
  mixins: [
    ControlMixin
  ],
  props: {
    text: {
      type: [
        String,
        Array
      ],
      default: ''
    }
  },
  data() {
    return {
      i: 0
    };  
  },
  computed: {
    texts() {
      if (Array.isArray(this.text)) {
        return this.text;
      }
      else if (typeof this.text === 'string' && this.text.length > 0) {
        return [this.text];
      }
      return [];
    },
    current() {
      if (this.texts.length === 0) {
        return "";
      }
      else {
        return this.texts[this.i % this.text.length];
      }
    }
  },
  methods: {
    toggle() {
      if (this.texts.length > 1) {
        this.i++;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.ol-textcontrol {
  position: absolute;
  top: 0.5em;
  left: calc(2.375em + 6px);
  max-width: calc(100% - 2*(2.375em + 6px));
  box-sizing: border-box;
  background-color: rgba(255,255,255,0.6);
  white-space: pre-wrap;
  font-size: 0.9em;
  padding: 0.2em;
  text-align: center;
  z-index: 1;
}
.pointer {
  cursor: pointer;
}
</style>
