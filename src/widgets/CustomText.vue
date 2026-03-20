<template>
  <div class="custom-text">
    <h3>{{ title }}</h3>
    <p>{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: "CustomText",
  props: {
    title: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../theme/variables.scss";

.custom-text {
  margin-bottom: $block-margin;
}
</style>
