<template>
  <b-card>
    <b-card-title>
      <StacLink :link="catalog" class="stretched-link" />
    </b-card-title>
  </b-card>
</template>

<script>
import StacLink from './StacLink.vue';

export default {
  name: 'Catalog',
  components: {
    StacLink
  },
  props: {
    catalog: {
      type: Object,
      required: true
    }
  }
}
</script>