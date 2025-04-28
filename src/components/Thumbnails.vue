<template>
  <div class="previews" ref="previews">
    <div class="overlay">
      <FullscreenButton :element="() => $refs.previews" />
    </div>
    <div class="content">
      <a v-for="thumbnail in thumbnails" :key="thumbnail.href" :href="thumbnail.href" target="_blank" download>
        <img class="thumbnail" :src="thumbnail.href" :crossorigin="crossOriginMedia">
      </a>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Thumbnails',
  components: {
    FullscreenButton: () => import('./FullscreenButton.vue')
  },
  props: {
    thumbnails: {
      type: Array,
      required: true
    }
  },
  computed: {
    ...mapState(['crossOriginMedia'])
  }
};
</script>

<style lang="scss">
@import '../theme/variables.scss';

#stac-browser {
  .previews {
    height: 350px;
    box-sizing: border-box;
    overflow: auto;

    a {
      display: inline-block;
      padding: 1px;
      border: 1px solid $body-bg;
      margin: 5px;
      border-radius: $border-radius;

      &:hover {
        border-color: map-get($theme-colors, "primary");
      }
    }

    .content {
      text-align: center;

      .thumbnail {
        max-width: 100%;
        max-height: 335px;
        border-radius: $border-radius;
      }
    }

    .overlay {
      text-align: right;
      position: sticky;
      top: 0;
      right: 0;
      left: 0;
      height: 0;
      width: 100%;
      z-index: 1;

      .fullscreen-button {
        margin: 10px;
      }
    }

    &.fullscreen {
      .thumbnail {
        max-height: none;
        border-radius: 0;
      }
    }
  }
}
</style>