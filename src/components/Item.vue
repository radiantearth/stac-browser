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
    <b-card-text v-if="fileFormats.length > 0">
      <b-badge v-for="format in fileFormats" :key="format" variant="secondary" class="mr-1 mt-1">{{ format | MediaType }}</b-badge>
    </b-card-text>
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
    },
    fileFormats() {
      if (!this.data) {
        return [];
      }
      return Object.values(this.data.assets)
        .filter(asset => Array.isArray(asset.roles) && asset.roles.includes('data') && typeof asset.type === 'string') // Look for data files
        .map(asset => asset.type) // Array shall only contain media types
        .filter((v, i, a) => a.indexOf(v) === i); // Unique values
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