<template>
  <div class="keywords d-flex flex-wrap" :class="{'justify-content-center': center}">
    <b-badge v-for="keyword in sortedKeywords" :key="keyword" :variant="variant" class="mr-1 mb-1">{{ keyword }}</b-badge>
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
    },
    center: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    sortedKeywords() {
      return [...this.keywords].sort((a, b) => a.localeCompare(b));
    }
  }
};
</script>
