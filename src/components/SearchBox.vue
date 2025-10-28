<template>
  <div class="vue-component search-box">
    <span class="icon">🔎</span>
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
#stac-browser .search-box {
  position: relative;
  box-sizing: border-box;

  input, .icon {
    font-size: 1em;
    margin: 0;
  }
  input {
    min-height: 2.75em;
    padding: 0.75em 0.75em;
    padding-left: 2.75em;
    z-index: 1;
    display: inline-block;
    border: 1px solid #ccc;
    box-sizing: border-box;
    background-color: #fff;
    width: 100%;
  }
  .icon {
    height: 1em;
    user-select: none;
    margin-left: 0.75em;
    width: 1em;
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
