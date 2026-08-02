<template>
  <div class="keywords">
    <b-badge v-for="keyword in sortedKeywords" :key="keyword" :variant="variant" class="keyword">{{ keyword }}</b-badge>
  </div>
</template>

<script>
export default {
  name: 'Keywords',
  props: {
    keywords: {
      type: Array,
      required: true
    },
    variant: {
      type: String,
      default: 'secondary'
    }
  },
  computed: {
    sortedKeywords() {
      return [...this.keywords].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }
  }
};
</script>

<style lang="scss" scoped>
.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: flex-start;
  align-content: flex-start;

  .keyword {
    padding: 0.3em 0.4em;
  }
}
</style>
