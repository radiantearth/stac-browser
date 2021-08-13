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
.previews {
  text-align: center;
}

.thumbnail {
  max-width: 100%;
  max-height: 400px;
}
</style>