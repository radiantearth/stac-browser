<template>
  <b-card class="item-card" :img-src="thumbnail.href" :img-alt="thumbnail.title" img-top v-b-visible.once.200="load">
    <b-card-title>
      <StacLink :link="item" :title="title" class="stretched-link" />
    </b-card-title>
    <b-card-text><small class="text-muted">
      <template v-if="extent">{{ extent | TemporalExtent }}</template>
      <template v-else-if="data && data.properties.datetime">{{ data.properties.datetime | Timestamp }}</template>
      <template v-else>No time given</template>
    </small></b-card-text>
  </b-card>
</template>

<script>
import { mapGetters } from 'vuex';
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
  },
  computed: {
    ...mapGetters(['getStac']),
    data() {
      return this.getStac(this.item.href);
    },
    thumbnail() {
      if (this.data) {
        let thumbnails = this.data.getThumbnails(true, 'thumbnail');
        if (thumbnails.length > 0) {
          return thumbnails[0];
        }
      }
      return {
        href: null,
        title: ''
      };
    },
    title() {
      if (this.data) {
        return this.data.properties.title || this.data.id;
      }
      return null;
    },
    extent() {
      if (this.data && (this.data.properties.start_datetime || this.data.properties.end_datetime)) {
        return [this.data.properties.start_datetime, this.data.properties.end_datetime];
      }
      return null;
    }
  },
  methods: {
    load(visible) {
      if (visible) {
        this.$store.dispatch("load", { url: this.item.href });
      }
    }
  }
}
</script>

<style>
.item-card {
  text-align: center;
}
.item-card .card-img-top {
  width: auto;
  max-width: 100%;
  max-height: 200px;
}
</style>