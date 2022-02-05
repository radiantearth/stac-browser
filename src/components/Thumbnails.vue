<template>
  <div class="previews">
    <a v-for="thumbnail in thumbnails" :key="thumbnail.href" :href="thumbnail.href">
      <img class="thumbnail" :src="thumbnail.href" />
    </a>
  </div>
</template>

<script>
export default {
  name: 'Thumbnails',
  props: {
    thumbnails: {
      type: Array
    }
  }
}
</script>

<style lang="scss">
@import '../theme/variables.scss';

.previews {
  text-align: center;

  a {
    display: inline-block;
    padding: 1px;
    border: 1px solid $body-bg;
    margin: 0.25rem;
    border-radius: $border-radius;

    &:hover {
      border-color: map-get($theme-colors, "primary");
    }
  }

  .thumbnail {
    max-width: 100%;
    max-height: 400px;
    border-radius: $border-radius;
  }
}

</style>