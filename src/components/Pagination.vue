<template>
  <b-button-group>
    <b-button @click="paginate(pagination.first)" :disabled="!pagination.first" variant="primary">{{ $t('pagination.first') }}</b-button>
    <b-button @click="paginate(pagination.prev)" :disabled="!pagination.prev" variant="primary">{{ $t('pagination.previous') }}</b-button>
    <b-button @click="paginate(pagination.next)" :disabled="!pagination.next" variant="primary">{{ $t('pagination.next') }}</b-button>
    <b-button v-if="pagination.last" @click="paginate(pagination.last)" variant="primary">{{ $t('pagination.last') }}</b-button>
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
    placement: { // top or bottom
      type: String,
      default: "bottom"
    }
  },
  methods: {
    paginate(link) {
      this.$emit('paginate', link, this.placement);
    }
  }
};
</script>
