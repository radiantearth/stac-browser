<template>
  <div class="terrain-control">
    <button
      type="button"
      :title="is3D ? $t('mapping.terrain.disable', '2D') : $t('mapping.terrain.enable', '3D')"
      :class="{ active: is3D }"
      @click="$emit('toggle')"
    >
      <span class="terrain-icon">{{ is3D ? '2D' : '3D' }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'TerrainControl',
  props: {
    is3D: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle'],
};
</script>

<style lang="scss" scoped>
.terrain-control {
  position: absolute;
  z-index: 3;
  top: 10px;
  left: 10px;

  button {
    width: 29px;
    height: 29px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: white;
    border: none;
    border-radius: 4px;
    padding: 0;
    box-shadow: 0 0 0 2px rgba(0,0,0,0.1);

    &.active {
      background-color: #4163cc;

      .terrain-icon {
        color: white;
      }
    }

    &:hover {
      background-color: #f0f0f0;
    }

    &.active:hover {
      background-color: #3352b5;
    }
  }

  .terrain-icon {
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    color: #333;
  }
}
</style>
