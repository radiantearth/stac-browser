<template>
  <b-button-group :class="classes">
    <b-button @click="paginate(pagination.first)" :disabled="!pagination.first" variant="outline-primary">« First</b-button>
    <b-button @click="paginate(pagination.prev)" :disabled="!pagination.prev" variant="outline-primary">‹ Previous</b-button>
    <b-button @click="paginate(pagination.next)" :disabled="!pagination.next" variant="outline-primary">Next ›</b-button>
    <b-button v-if="pagination.last" @click="paginate(pagination.last)" variant="outline-primary">Last »</b-button>
  </b-button-group>
</template>

<script>
export default {
  name: "Pagination",
  props: {
    pagination: {
      type: Object,
      default: () => ({})
    },
    placement: {
      type: String
    }
  },
  computed: {
    classes() {
      return this.placement === 'top' ? 'mb-4 mt-2' : 'mb-2 mt-2'
    }
  },
  methods: {
    paginate(link) {
      this.$emit('paginate', link, this.placement);
    }
  }
};
</script>
