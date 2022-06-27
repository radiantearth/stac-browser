<template>
  <div :class="classes">
    <b-spinner label="Loading..." :small="small" />
  </div>
</template>

<script>
export default {
  name: 'Loading',
  props: {
    fill: {
      type: Boolean,
      default: false
    },
    small: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    classes() {
      return this.fill ? 'loading-fill' : 'loading';
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../theme/variables.scss';

.loading-fill {
  z-index: 100;
  position: absolute;
  background-color: rgba(255,255,255, 0.75);
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border-radius: $border-radius;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading {
  text-align: center;
}
</style>