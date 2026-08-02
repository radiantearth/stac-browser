<template>
  <div class="custom-text">
    <h3 v-if="title">{{ title }}</h3>
    <Description :description="text" :allowHTML="allowHTML" />
  </div>
</template>

<script>
import Description from '../components/Description.vue';

export default {
  name: "CustomText",
  components: {
    Description
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    },
    allowHTML: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../theme/variables.scss";

.custom-text {
  margin-bottom: var(--sb-block-gap);
}
</style>
