<template>
  <div v-if="texts.length > 0" class="map-textcontrol" @click="toggle" :class="{pointer: texts.length > 1}">{{ current }}</div>
</template>

<script>
export default {
  name: 'TextControl',
  props: {
    text: {
      type: [String, Array],
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
      if (typeof this.text === 'string' && this.text.length > 0) {
        return [this.text];
      }
      return [];
    },
    current() {
      if (this.texts.length === 0) return "";
      return this.texts[this.i % this.texts.length];
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
.map-textcontrol {
  position: absolute;
  top: 10px;
  left: 50px;
  max-width: calc(100% - 120px);
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.6);
  white-space: pre-wrap;
  font-size: 0.9em;
  padding: 0.2em 0.5em;
  text-align: center;
  z-index: 2;
  border-radius: 4px;
}
.pointer {
  cursor: pointer;
}
</style>
