<template>
  <b-alert class="alert-box" :variant="variant" :dismissible="dismissible" show>
    <template v-if="title">
      <strong>{{ title }}</strong>&nbsp;
      <small>{{ text }}</small>
    </template>
    <template v-else>{{ text }}</template>
  </b-alert>
</template>

<script>
export default {
  name: "AlertBox",
  props: {
    title: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    },
    variant: {
      type: String,
      default: 'warning'
    },
    dismissible: {
      type: Boolean,
      default: false
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../theme/variables.scss";

.alert-box {
  margin-bottom: $block-margin;
}
</style>
