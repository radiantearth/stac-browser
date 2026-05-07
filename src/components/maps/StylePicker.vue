<template>
  <div v-if="styles.length > 1" class="map-stylepicker">
    <select v-model="selected" :title="$t('mapping.styles.select')">
      <option v-for="(style, index) in styles" :key="style.name" :value="index">
        {{ style.title }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'StylePicker',
  props: {
    styles: { type: Array, default: () => [] },
    activeIndex: { type: Number, default: 0 },
  },
  emits: ['change'],
  data() {
    return { selected: this.activeIndex };
  },
  watch: {
    activeIndex(val) { this.selected = val; },
    selected(val) { this.$emit('change', val); },
  },
};
</script>

<style lang="scss" scoped>
.map-stylepicker {
  position: absolute;
  z-index: 2;
  left: 10px;
  bottom: 30px;

  select {
    font-size: 0.85rem;
    padding: 2px 6px;
    border-radius: 2px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    max-width: 200px;
  }
}
</style>
