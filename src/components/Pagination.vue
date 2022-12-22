<template>
  <b-button-group :class="classes">
    <b-button @click="paginate(pagination.first)" :disabled="!pagination.first" variant="primary">« First</b-button>
    <b-button @click="paginate(pagination.prev)" :disabled="!pagination.prev" variant="primary">‹ Previous</b-button>
    <b-button @click="paginate(pagination.next)" :disabled="!pagination.next" variant="primary">Next ›</b-button>
    <b-button v-if="pagination.last" @click="paginate(pagination.last)" variant="primary">Last »</b-button>
  </b-button-group>
</template>

<script>
// TODO: I18N
export default {
  name: "Pagination",
  props: {
    pagination: {
      type: Object,
      default: () => ({})
    },
    placement: { // top or bottom
      type: String,
      default: "bottom"
    }
  },
  computed: {
    classes() {
      return this.placement === 'top' ? 'mb-4 mt-2' : 'mb-2 mt-2';
    }
  },
  methods: {
    paginate(link) {
      this.$emit('paginate', link, this.placement);
    }
  }
};
</script>
