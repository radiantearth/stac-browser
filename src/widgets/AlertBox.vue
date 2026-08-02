<template>
  <b-alert class="alert-box" :variant="variant" :dismissible="dismissible" show>
    <template v-if="title">
      <strong>{{ title }}</strong>&nbsp;
      <Description inline :description="text" :allowHTML="allowHTML" />
    </template>
    <Description v-else compact :description="text" :allowHTML="allowHTML" />
  </b-alert>
</template>

<script>
import Description from '../components/Description.vue';

export default {
  name: "AlertBox",
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
    variant: {
      type: String,
      default: 'warning'
    },
    dismissible: {
      type: Boolean,
      default: false
    },
    allowHTML: {
      type: Boolean,
      default: false
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../theme/variables.scss";

.alert-box {
  margin-bottom: 0;
}
</style>
