<template>
  <b-card
    img-src="https://picsum.photos/600/300/?image=25"
    img-alt="Preview"
    img-height="200px"
    img-top
  >
    <b-card-title>
      <StacLink :link="item" class="stretched-link" />
    </b-card-title>
    <b-card-sub-title>2020-12-01 17:33:44</b-card-sub-title>
  </b-card>
</template>

<script>
import StacLink from './StacLink.vue';

export default {
  name: 'Item',
  components: {
    StacLink
  },
  props: {
    item: {
      type: Object,
      required: true
    }
  }
}
</script>