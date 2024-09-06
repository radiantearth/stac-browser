<template>
  <div class="vue-component search-box">
    <span class="icon">🔎</span>
    <b-form-input type="search" v-model.trim="searchTerm" :placeholder="placeholder || $t('search.placeholder')" />
  </div>
</template>

<script>
import { BFormInput } from 'bootstrap-vue';

export default {
  name: 'SearchBox',
  components: {
    BFormInput
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      searchTerm: this.value
    };
  },
  watch: {
    searchTerm(newValue) {
      if (newValue.length < this.minLength) {
        newValue = '';
      }
      this.$emit('input', newValue);
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
    min-height: 1.5em;
    padding: 0.25em 0.3em;
    padding-left: 1.9em;
    z-index: 1;
    display: inline-block;
    border: 1px solid #ccc;
    box-sizing: content-box;
    background-color: #fff;
    width: calc(100% - 1.9em - 0.25em - 2px);
  }
  .icon {
    height: 1.5em;
    user-select: none;
    margin-top: -0.75em;
    margin-left: 0.3em;
    width: 1em;
    z-index: 2;
    position: absolute;
    top: 50%;
    left: 0;
  }
}
</style>
