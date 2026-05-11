<template>
  <div class="vue-component search-box">
    <b-icon-search class="icon" />
    <b-form-input type="search" v-model.trim="searchTerm" :placeholder="placeholder || $t('search.placeholder')" />
  </div>
</template>

<script>

export default {
  name: 'SearchBox',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      searchTerm: this.modelValue
    };
  },
  watch: {
    modelValue(newValue) {
      this.searchTerm = newValue;
    },
    searchTerm(newValue) {
      this.$emit('update:modelValue', newValue);
    }
  }
};
</script>

<style lang="scss">
@import '../theme/variables.scss';

#stac-browser .search-box {
  position: relative;
  box-sizing: border-box;

  input, .icon {
    font-size: $font-size-base;
    margin: 0;
  }
  input {
    min-height: $input-height;
    padding: $input-padding-y $input-padding-x;
    padding-left: calc($input-padding-x * 2 + $font-size-base);
    z-index: 1;
    display: inline-block;
    border: $input-border-width $border-style $input-border-color;
    border-radius: $input-border-radius;
    box-sizing: border-box;
    background-color: $input-bg;
    width: 100%;
    height: 100%;
  }
  .icon {
    height: $font-size-base;
    user-select: none;
    margin-left: $input-padding-x;
    width: $font-size-base;
    z-index: 2;
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
}
</style>
