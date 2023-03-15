<template>
  <div :class="classes">
    <b-spinner :label="$t('loading')" :small="small" />
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
    stretch: {
      type: Boolean,
      default: false
    },
    small: {
      type: Boolean,
      default: false
    },
    top: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    classes() {
      let classes = ['loading'];
      if (this.fill) {
        classes.push('loading-fill');
      }
      else if (this.stretch) {
        classes.push('loading-stretch');
      }
      if (this.top) {
        classes.push('top');
      }
      return classes;
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../theme/variables.scss';

.loading {
  text-align: center;
  box-sizing: border-box;

  &.loading-stretch {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &.loading-fill {
    z-index: 2000;
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

  &.top {
    align-items: start !important;
    padding-top: 1em;

    > .spinner-border {
      position: sticky;
      top: 1em;
    }
  }
}
</style>