<template>
  <div class="previews" ref="previews">
    <div class="overlay">
      <FullscreenButton :element="() => $refs.previews" />
    </div>
    <div class="content">
      <a
        v-for="thumbnail in thumbnails" :key="thumbnail.href" :href="hrefs[thumbnail.href] || thumbnail.getAbsoluteUrl()"
        target="_blank" rel="noopener noreferrer" download
      >
        <AuthImage
          class="thumbnail" :src="thumbnail.getAbsoluteUrl()" :crossorigin="crossOriginMedia"
          @resolved="url => hrefs[thumbnail.href] = url"
        />
      </a>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { defineAsyncComponent } from 'vue';

export default {
  name: 'Thumbnails',
  components: {
    AuthImage: defineAsyncComponent(() => import('./AuthImage.vue')),
    FullscreenButton: defineAsyncComponent(() => import('./FullscreenButton.vue'))
  },
  props: {
    thumbnails: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      // The URLs the thumbnails are shown from (incl. credentials / object URLs),
      // so that the download links download what is shown
      hrefs: {}
    };
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
      border: 1px solid var(--bs-body-bg);
      margin: 5px;
      border-radius: $border-radius;

      &:hover {
        border-color: var(--bs-link-hover-color);
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
